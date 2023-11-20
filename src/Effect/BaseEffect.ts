import {continueRender, delayRender} from 'remotion';

export abstract class BaseEffect {
	protected readonly gl: WebGLRenderingContext; //gl实例
	protected readonly fps; //帧率
	protected readonly delayRenderHandel; //延迟渲染句柄
	protected readonly imageUrl: string; //待处理图片地址
	//顶点着色器
	protected getVertexShaderSource(): string {
		return `
            attribute vec4 Position;
            attribute vec2 TextureCoords;
            varying vec2 TextureCoordsVarying;
            
            void main() {
                gl_Position = Position;
                TextureCoordsVarying = TextureCoords;
            }
        `;
	}
	protected abstract getFragmentShaderSource(): string; //片段着色器
	public drawFn: ((frame: number) => void) | null = null; //绘制函数

	constructor(params: {
		gl: WebGLRenderingContext;
		fps: number;
		imageUrl: string;
	}) {
		const {gl, fps, imageUrl} = params;
		this.gl = gl;
		this.fps = fps;
		this.imageUrl = imageUrl;
		this.delayRenderHandel = delayRender();
	}

	async loadImage(src: string) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	loadShader(
		gl: WebGLRenderingContext,
		type: number,
		source: string,
	): WebGLShader | null {
		const shader = gl.createShader(type);
		if (!shader) {
			console.error('Error creating shader.');
			return null;
		}

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(
				'An error occurred compiling the shaders:',
				gl.getShaderInfoLog(shader),
			);
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	setDrawFn(render: (time: number) => void) {
		this.drawFn = render;
	}

	render(frame: number) {
		if (this.drawFn) {
			this.drawFn(frame);
		}
	}

	async init() {
		const gl = this.gl;
		try {
			if (!gl) {
				console.error('Unable to initialize WebGL.');
				return;
			}

			// 加载图片作为纹理
			const loadImageAsTexture = async (src: string) => {
				const image = await this.loadImage(src);
				const texture = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					image as
						| ImageBitmap
						| ImageData
						| HTMLImageElement
						| HTMLCanvasElement
						| HTMLVideoElement
						| OffscreenCanvas,
				);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				return texture;
			};
			const texture = await loadImageAsTexture(this.imageUrl); // 加载图片

			// 创建和编译着色器
			const vertexShader = this.loadShader(
				gl,
				gl.VERTEX_SHADER,
				this.getVertexShaderSource(),
			) as WebGLShader;
			const fragmentShader = this.loadShader(
				gl,
				gl.FRAGMENT_SHADER,
				this.getFragmentShaderSource(),
			) as WebGLShader;
			if (!fragmentShader) {
				console.error('Shader failed to compile.');
				return;
			}

			// 创建和链接程序
			const shaderProgram = gl.createProgram() as WebGLProgram;
			gl.attachShader(shaderProgram, vertexShader);
			gl.attachShader(shaderProgram, fragmentShader);
			gl.linkProgram(shaderProgram);
			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				console.error(
					'Unable to initialize the shader program:',
					gl.getProgramInfoLog(shaderProgram),
				);
				return;
			}
			gl.useProgram(shaderProgram);

			// 定义顶点数据
			const vertices = [
				-1.0, -1.0, 0.0, 0.0, 1.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
			];

			// 创建顶点缓冲
			const vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array(vertices),
				gl.STATIC_DRAW,
			);

			// 连接顶点着色器的属性
			const positionAttribLocation = gl.getAttribLocation(
				shaderProgram,
				'Position',
			);
			gl.enableVertexAttribArray(positionAttribLocation);
			gl.vertexAttribPointer(
				positionAttribLocation,
				2, // 每个顶点的元素数量
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点的总大小
				0, // 偏移量
			);

			const texCoordAttribLocation = gl.getAttribLocation(
				shaderProgram,
				'TextureCoords',
			);
			gl.enableVertexAttribArray(texCoordAttribLocation);
			gl.vertexAttribPointer(
				texCoordAttribLocation,
				2, // 纹理坐标的元素数量
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点的总大小
				2 * Float32Array.BYTES_PER_ELEMENT, // 偏移量
			);

			// 设置纹理
			const u_imageLocation = gl.getUniformLocation(shaderProgram, 'u_image');
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(u_imageLocation, 0);

			// 绘制场景
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			const timeUniformLocation = gl.getUniformLocation(shaderProgram, 'Time');
			const render = (time: number) => {
				const timeInSeconds = time / this.fps; // 将帧索引转换为时间（秒）
				gl.uniform1f(timeUniformLocation, timeInSeconds);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			};
			this.setDrawFn(render);
		} finally {
			continueRender(this.delayRenderHandel);
		}
	}
}
