import {continueRender, delayRender} from 'remotion';
import createTransition from 'gl-transition';
import transitions from 'gl-transitions';
import {Texture} from '../Texture';

export class BaseTransition {
	protected readonly gl: WebGLRenderingContext; //gl实例
	protected readonly fps; //帧率
	protected readonly width: number; // 宽度
	protected readonly height: number; // 宽度
	protected readonly transitionName: string; // 特效名称
	private readonly images: string[]; // 图片地址
	protected textureFrom: WebGLTexture | undefined;
	protected textureTo: WebGLTexture | undefined;
	protected delayRenderHandel: number | undefined; //延迟渲染句柄
	protected vertexBuffer?: WebGLBuffer | null;
	protected vertices: number[] = [];
	public transition: any;
	protected positionAttribLocation?: number;
	public inited = false;
	public drawFn:
		| ((
				frame: number,
				effectDurationInFrames: number,
				transitionDuration: number,
		  ) => void)
		| undefined; //绘制函数
	constructor(params: {
		gl: WebGLRenderingContext;
		fps: number;
		width: number;
		height: number;
		transitionName: string;
		images: string[];
	}) {
		const {gl, fps, width, height, images, transitionName} = params;
		this.gl = gl;
		this.fps = fps;
		this.width = width;
		this.height = height;
		this.transitionName = transitionName;
		this.images = images;
	}
	private applyBuffer() {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!);
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
			2,
			gl.FLOAT,
			false,
			0,
			0,
		);
	}
	postDrawCleanUp() {
		const gl = this.gl;
		gl.disableVertexAttribArray(this.positionAttribLocation!);
		gl.disableVertexAttribArray(0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.useProgram(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	async init() {
		const gl = this.gl;
		const texture = new Texture({
			gl: gl as WebGLRenderingContext,
			width: this.width,
			height: this.height,
		});
		this.textureFrom = await texture.loadTexture(this.images[0]);
		this.textureTo = await texture.loadTexture(this.images[1]);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		this.vertices = [-1, -1, -1, 4, 4, -1];
		this.vertexBuffer = gl.createBuffer();
		this.applyBuffer();
		this.applyVertexAttribute();
		gl.viewport(0, 0, this.width, this.height);

		this.transition = createTransition(
			gl,
			transitions.find((t: {name: string}) => t.name === this.transitionName),
		);
		this.drawFn = (
			frame: number,
			effectDurationInFrames: number,
			transitionDuration: number,
		) => {
			const relativeFrame = effectDurationInFrames - frame;
			let progress = Math.abs(
				relativeFrame / transitionDuration -
					effectDurationInFrames / transitionDuration,
			);
			console.log(
				frame,
				effectDurationInFrames,
				transitionDuration,
				progress,
				'======',
			);
			this.delayRenderHandel = delayRender();
			this.postDrawCleanUp();
			gl.viewport(0, 0, this.width, this.height);
			this.applyBuffer();
			this.applyVertexAttribute();
			continueRender(this.delayRenderHandel);

			if (this.textureFrom && this.textureTo) {
				this.transition?.draw(
					effectDurationInFrames ? progress : (frame / this.fps) % 1,
					this.textureFrom,
					this.textureTo,
					this.width,
					this.height,
					{
						persp: 1.5,
						unzoom: 0.6,
					},
				);
			}
			this.postDrawCleanUp();
		};

		this.inited = true;
	}
}
