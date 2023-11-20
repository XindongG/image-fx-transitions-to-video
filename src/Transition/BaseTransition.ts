import {continueRender, delayRender} from 'remotion';
import one from '../1.jpg';
import two from '../2.jpg';
import createTexture from 'gl-texture2d';
import createTransition from 'gl-transition';
import transitions from 'gl-transitions';

export class BaseTransition {
	protected readonly gl: WebGLRenderingContext; //gl实例
	protected readonly fps; //帧率
	protected readonly width: number; // 宽度
	protected readonly height: number; // 宽度
	protected readonly transitionName: string; // 宽度
	protected readonly imageUrl: string | undefined; // 宽度
	protected readonly delayRenderHandel; //延迟渲染句柄
	public inited = false;
	public drawFn: ((frame: number) => void) | null = null; //绘制函数
	constructor(params: {
		gl: WebGLRenderingContext;
		fps: number;
		width: number;
		height: number;
		transitionName: string;
		imageUrl?: string;
	}) {
		const {gl, fps, width, height, transitionName, imageUrl} = params;
		this.gl = gl;
		this.fps = fps;
		this.width = width;
		this.height = height;
		this.imageUrl = imageUrl;
		this.transitionName = transitionName;
		this.delayRenderHandel = delayRender();
	}
	loadImage = (src: string) =>
		new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.onabort = reject;
			img.src = src;
		});
	async init() {
		const gl = this.gl;
		const imageFrom = await this.loadImage(one);
		const imageTo = await this.loadImage(two);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, -1, 4, 4, -1]), // See a-big-triangle
			gl.STATIC_DRAW,
		);
		gl.viewport(0, 0, this.width, this.height);

		const from = createTexture(gl, imageFrom);
		from.minFilter = gl.LINEAR;
		from.magFilter = gl.LINEAR;

		const to = createTexture(gl, imageTo);
		to.minFilter = gl.LINEAR;
		to.magFilter = gl.LINEAR;
		const transition = createTransition(
			gl,
			transitions.find((t: {name: string}) => t.name === this.transitionName),
		);
		this.drawFn = (frame: number) => {
			transition.draw(
				(frame / this.fps) % 1,
				from,
				to,
				this.width,
				this.height,
				{
					persp: 1.5,
					unzoom: 0.6,
				},
			);
		};
		this.inited = true;
		continueRender(this.delayRenderHandel);
	}
}
