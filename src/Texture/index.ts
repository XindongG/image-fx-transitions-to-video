import createTexture from 'gl-texture2d';

export class Texture {
	private readonly gl: WebGLRenderingContext;
	private textures: Map<string, WebGLTexture> = new Map();
	private width: number = 0;
	private height: number = 0;
	constructor(params: {
		gl: WebGLRenderingContext;
		width: number;
		height: number;
	}) {
		const {gl, width, height} = params;
		this.gl = gl;
		this.width = width;
		this.height = height;
	}

	async loadTexture(imageUrl: string): Promise<WebGLTexture> {
		if (this.textures.has(imageUrl)) {
			return this.textures.get(imageUrl)!;
		}

		const image = await this.loadImage(imageUrl);
		const texture = this.createTexture(image);
		this.textures.set(imageUrl, texture);
		return texture;
	}

	private async loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	private createTexture(image: HTMLImageElement): WebGLTexture {
		const gl = this.gl;
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		const texture = createTexture(gl, image)!;
		texture.minFilter = gl.LINEAR;
		texture.magFilter = gl.LINEAR;
		return texture;
	}
}
