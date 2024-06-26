import createTexture from 'gl-texture2d';

export class Texture {
	private readonly gl: WebGLRenderingContext;
	private textures: Map<string, WebGLTexture> = new Map();
	private maxCacheSize = 20;
	private width: number;
	private height: number;
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

		// 检查缓存大小，如果过大则删除最旧的纹理
		if (this.textures.size >= this.maxCacheSize) {
			const oldestKey = this.textures.keys().next().value;
			const oldestTexture = this.textures.get(oldestKey);
			this.gl.deleteTexture(oldestTexture!);
			this.textures.delete(oldestKey);
		}

		const image = await this.loadImage(imageUrl);
		const texture = this.createTexture(image);
		this.textures.set(imageUrl, texture);
		return texture;
	}

	private async loadImage(
		src: string,
		maxRetries = 3,
	): Promise<HTMLImageElement> {
		let retries = 0;
		while (retries < maxRetries) {
			try {
				return await new Promise((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = (e) => reject(e);
					img.src = src;
				});
			} catch (e) {
				console.warn(
					`Failed to load image ${src}, retrying... (${
						retries + 1
					}/${maxRetries})`,
				);
				retries++;
			}
		}
		throw new Error(`Failed to load image ${src} after ${maxRetries} retries.`);
	}

	private createTexture(image: HTMLImageElement): WebGLTexture {
		const gl = this.gl;
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		const texture = createTexture(gl, image)!;
		texture.minFilter = gl.LINEAR;
		texture.magFilter = gl.LINEAR;
		return texture;
	}
	calculateVertices(
		textureWidth: number,
		textureHeight: number,
		viewportWidth: number,
		viewportHeight: number,
	) {
		// 纹理的宽高比
		const textureAspectRatio = textureWidth / textureHeight;
		// 视口的宽高比
		const viewportAspectRatio = viewportWidth / viewportHeight;

		let scaleX, scaleY;

		// 确保宽度撑满，高度根据纹理比例调整
		if (textureAspectRatio > viewportAspectRatio) {
			// 图像比视口宽
			scaleX = 1;
			scaleY = viewportAspectRatio / textureAspectRatio;
		} else {
			// 图像比视口窄
			scaleX = textureAspectRatio / viewportAspectRatio;
			scaleY = 1;
		}

		// 返回顶点坐标
		return [
			-scaleX,
			-scaleY, // 左下角
			scaleX,
			-scaleY, // 右下角
			-scaleX,
			scaleY, // 左上角
			scaleX,
			scaleY, // 右上角
		];
	}
	clearTextures() {
		for (const texture of this.textures.values()) {
			this.gl.deleteTexture(texture);
		}
		this.textures.clear();
	}
}
