import {continueRender, delayRender} from 'remotion';

export abstract class BaseEffect {
	protected readonly gl: WebGLRenderingContext; //gl实例
	protected readonly fps; //帧率
	protected readonly delayRenderHandel; //延迟渲染句柄
	protected texture: WebGLTexture | null = null;
	protected imageUrl: string | null = null;
	protected shaderProgram: WebGLProgram | null = null;
	public inited = false;
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
		texture?: WebGLTexture;
		imageUrl?: string;
	}) {
		const {gl, fps, texture, imageUrl} = params;
		this.gl = gl;
		this.fps = fps;
		this.texture = texture || null;
		this.imageUrl = imageUrl || null;
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
	render(time: number) {
		const gl = this.gl;
		const timeUniformLocation = gl.getUniformLocation(
			this.shaderProgram!,
			'Time',
		);
		if (!this.shaderProgram) {
			console.error('Shader program is not initialized.');
			return;
		}

		// 使用正确的着色器程序

		gl.useProgram(this.shaderProgram);
		const timeInSeconds = time / this.fps; // 将帧索引转换为时间（秒）
		gl.uniform1f(timeUniformLocation, timeInSeconds);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	loadImageAsTexture = async (gl: WebGLRenderingContext, src: string) => {
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
	async init() {
		const gl = this.gl;

		try {
			if (!gl) {
				console.error('Unable to initialize WebGL.');
				return;
			}
			// 加载图片作为纹理
			if (this.imageUrl && !this.texture) {
				// 如果提供了 imageUrl，则加载纹理
				this.texture = await this.loadImageAsTexture(gl, this.imageUrl);
			}

			if (!this.texture) {
				console.error('No texture or image URL provided.');
				return;
			}

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
			this.shaderProgram = gl.createProgram() as WebGLProgram;
			gl.attachShader(this.shaderProgram, vertexShader);
			gl.attachShader(this.shaderProgram, fragmentShader);
			gl.linkProgram(this.shaderProgram);
			if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
				console.error(
					'Unable to initialize the shader program:',
					gl.getProgramInfoLog(this.shaderProgram),
				);
				return;
			}
			gl.useProgram(this.shaderProgram);

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
				this.shaderProgram,
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
				this.shaderProgram,
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
			const u_imageLocation = gl.getUniformLocation(
				this.shaderProgram,
				'u_image',
			);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(u_imageLocation, 0);

			// 绘制场景
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			this.setDrawFn(this.render);
		} finally {
			this.inited = true;
			continueRender(this.delayRenderHandel);
		}
	}
	deleteProgram() {
		this.gl.useProgram(null);
	}
	applyEffect(texture: WebGLTexture, frame: number): void {
		const gl = this.gl;

		if (!this.shaderProgram) {
			console.error('Shader program is not initialized.');
			return;
		}

		// 使用着色器程序
		gl.useProgram(this.shaderProgram);

		// 激活并绑定纹理
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'u_image'), 0);

		// 设置时间uniform
		const timeLocation = gl.getUniformLocation(this.shaderProgram, 'Time');
		gl.uniform1f(timeLocation, frame / this.fps);

		// 绘制场景
		gl.clearColor(0, 0, 0, 0); // 清除画布
		gl.clear(gl.COLOR_BUFFER_BIT);

		// 绘制四边形
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		// 解绑纹理和着色器程序
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.useProgram(null);
	}
}
