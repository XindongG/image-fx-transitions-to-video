/**
 *@desc: 抖动滤镜：颜色偏移 + 微弱的放大效果
 *@author: XinD
 *@date: 2023/11/20
 */
import {BaseEffect} from './BaseEffect';

export class Shake extends BaseEffect {
	public duration: number = 0.7;
	protected getFragmentShaderSource(): string {
		return `
            precision highp float;
			//纹理
			uniform sampler2D Texture;
			//纹理坐标
			varying vec2 TextureCoordsVarying;
			//时间戳
			uniform float Time;
			
			void main (void) {
				
				//一次抖动滤镜的时长 1.2
				float duration = 1.2;
				//放大图片上限
				float maxScale = 1.1;
				//颜色偏移步长
				float offset = 0.02;
				
				//进度[0,1]
				float progress = mod(Time, duration) / duration; // 0~1
				//颜色偏移值范围[0,0.02]
				vec2 offsetCoords = vec2(offset, offset) * progress;
				//缩放范围[1.0-1.1];
				float scale = 1.0 + (maxScale - 1.0) * progress;
				
				//放大纹理坐标.
				vec2 ScaleTextureCoords = vec2(0.5, 0.5) + (TextureCoordsVarying - vec2(0.5, 0.5)) / scale;
				
				//获取3组颜色rgb
				//原始颜色+offsetCoords
				vec4 maskR = texture2D(Texture, ScaleTextureCoords + offsetCoords);
				//原始颜色-offsetCoords
				vec4 maskB = texture2D(Texture, ScaleTextureCoords - offsetCoords);
				//原始颜色
				vec4 mask = texture2D(Texture, ScaleTextureCoords);
				
				//从3组来获取颜色:
				//maskR.r,mask.g,maskB.b 注意这3种颜色取值可以打乱或者随意发挥.不一定写死.只是效果会有不一样.大家可以试试.
				//mask.a 获取原图的透明度
				gl_FragColor = vec4(maskR.r, mask.g, maskB.b, mask.a);
			}
        `;
	}
}
