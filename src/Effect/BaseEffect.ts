import {continueRender, delayRender} from 'remotion';
import {Texture} from '../Texture';

export abstract class BaseEffect {
	protected readonly gl: WebGLRenderingContext; //gl实例
	protected readonly fps; //帧率
	protected readonly width: number; // 宽度
	protected readonly height: number; // 宽度
	protected delayRenderHandel: number | undefined; //延迟渲染句柄
	private texture:
		| (WebGLTexture & {handle?: any; width?: number; height?: number})
		| undefined;
	private readonly image: string | undefined;
	protected vertexBuffer: WebGLBuffer | null = null;
	protected vertices: number[] = [];
	protected positionAttribLocation: number | null = null;
	protected texCordAttribLocation: number | null = null;
	protected u_imageLocation: WebGLUniformLocation | null = null;
	protected shaderProgram: WebGLProgram | null = null;
	protected vertexShader: WebGLShader | null = null;
	protected fragmentShader: WebGLShader | null = null;
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
		image: string;
		width: number;
		height: number;
	}) {
		const {gl, fps, width, height, image} = params;
		this.gl = gl;
		this.fps = fps;
		this.width = width;
		this.height = height;
		this.image = image;
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
	postDrawCleanUp() {
		const gl = this.gl;
		gl.disableVertexAttribArray(this.positionAttribLocation!);
		gl.disableVertexAttribArray(this.texCordAttribLocation!);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.useProgram(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	private applyBuffer() {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.vertices),
			gl.STATIC_DRAW,
		);
	}
	private applyVertexAttribute() {
		const gl = this.gl;
		gl.enableVertexAttribArray(this.positionAttribLocation!);
		gl.vertexAttribPointer(
			this.positionAttribLocation!,
			2, // 每个顶点的元素数量
			gl.FLOAT,
			false,
			4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点的总大小
			0, // 偏移量
		);
		gl.enableVertexAttribArray(this.texCordAttribLocation!);
		gl.vertexAttribPointer(
			this.texCordAttribLocation!,
			2, // 纹理坐标的元素数量
			gl.FLOAT,
			false,
			4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点的总大小
			2 * Float32Array.BYTES_PER_ELEMENT, // 偏移量
		);

		gl.uniform1i(this.u_imageLocation, 0);
	}
	applyEffect(): void {
		const gl = this.gl;
		// 使用正确的着色器程序
		gl.useProgram(this.shaderProgram);
		if (this.texture) {
			gl.bindTexture(gl.TEXTURE_2D, this.texture!.handle);
		}
		this.applyBuffer();
		this.applyVertexAttribute();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture!.handle);
	}
	render(time: number) {
		const gl = this.gl;
		this.delayRenderHandel = delayRender();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		this.postDrawCleanUp();
		gl.viewport(0, 0, this.width, this.height);
		const timeUniformLocation = gl.getUniformLocation(
			this.shaderProgram!,
			'Time',
		);
		if (!this.shaderProgram) {
			console.error('Shader program is not initialized.');
			return;
		}
		this.applyEffect();
		const timeInSeconds = time / this.fps; // 将帧索引转换为时间（秒）
		gl.uniform1f(timeUniformLocation, timeInSeconds);
		continueRender(this.delayRenderHandel!);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		this.postDrawCleanUp();
	}
	async init() {
		this.postDrawCleanUp();
		const gl = this.gl;
		const texture = new Texture({
			gl: gl as WebGLRenderingContext,
			width: this.width,
			height: this.height,
		});
		this.texture = await texture.loadTexture(this.image!);
		if (!gl) {
			console.error('Unable to initialize WebGL.');
			return;
		}

		if (!this.texture) {
			console.error('No texture or image URL provided.');
			return;
		}

		// 创建和编译着色器
		this.vertexShader = this.loadShader(
			gl,
			gl.VERTEX_SHADER,
			this.getVertexShaderSource(),
		) as WebGLShader;
		this.fragmentShader = this.loadShader(
			gl,
			gl.FRAGMENT_SHADER,
			this.getFragmentShaderSource(),
		) as WebGLShader;
		if (!this.fragmentShader) {
			console.error('Shader failed to compile.');
			return;
		}

		// 创建和链接程序
		this.shaderProgram = gl.createProgram() as WebGLProgram;
		gl.attachShader(this.shaderProgram, this.vertexShader);
		gl.attachShader(this.shaderProgram, this.fragmentShader);
		gl.linkProgram(this.shaderProgram);
		gl.viewport(0, 0, this.width, this.height);
		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
			console.error(
				'Unable to initialize the shader program:',
				gl.getProgramInfoLog(this.shaderProgram),
			);
			return;
		}
		// 假设 imageWidth 和 imageHeight 是你的纹理图片的原始尺寸
		const imageAspectRatio = this.texture.width! / this.texture.height!;

		// WebGL 视口的尺寸
		const viewportWidth = this.width;
		const viewportHeight = this.height;
		const viewportAspectRatio = viewportWidth / viewportHeight;

		let scaleX, scaleY;
		if (imageAspectRatio > viewportAspectRatio) {
			// 图片比视口宽
			scaleX = 1;
			scaleY = viewportAspectRatio / imageAspectRatio;
		} else {
			// 图片比视口高
			scaleX = imageAspectRatio / viewportAspectRatio;
			scaleY = 1;
		}

		// 更新顶点坐标以反映新的比例
		this.vertices = [
			-scaleX,
			-scaleY,
			0.0,
			0.0,
			scaleX,
			-scaleY,
			1.0,
			0.0,
			-scaleX,
			scaleY,
			0.0,
			1.0,
			scaleX,
			scaleY,
			1.0,
			1.0,
		];

		// 创建顶点缓冲
		this.vertexBuffer = gl.createBuffer();
		this.applyBuffer();

		// 连接顶点着色器的属性
		this.positionAttribLocation = gl.getAttribLocation(
			this.shaderProgram,
			'Position',
		);
		this.applyVertexAttribute();

		this.texCordAttribLocation = gl.getAttribLocation(
			this.shaderProgram,
			'TextureCoords',
		);
		gl.enableVertexAttribArray(this.texCordAttribLocation);
		gl.vertexAttribPointer(
			this.texCordAttribLocation,
			2, // 纹理坐标的元素数量
			gl.FLOAT,
			false,
			4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点的总大小
			2 * Float32Array.BYTES_PER_ELEMENT, // 偏移量
		);

		// 设置纹理
		this.u_imageLocation = gl.getUniformLocation(this.shaderProgram, 'u_image');
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(this.u_imageLocation, 0);
		// 绘制场景
		this.setDrawFn(this.render);
		this.inited = true;
	}
}
