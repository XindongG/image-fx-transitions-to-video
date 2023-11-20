/**
 *@desc: 灵魂出窍滤镜
 *@author: XinD
 *@date: 2023/11/20
 */
import {BaseEffect} from './BaseEffect';

export class SoulOut extends BaseEffect {
	protected getFragmentShaderSource(): string {
		return `
			precision highp float;
			//纹理采样器
			uniform sampler2D Texture;
			//纹理坐标
			varying vec2 TextureCoordsVarying;
			//时间戳
			uniform float Time;
			
			void main (void) {
				
				//一次灵魂出窍效果的时长 0.7
				float duration = 0.7;
				//透明度上限
				float maxAlpha = 0.4;
				//放大图片上限
				float maxScale = 1.8;
				
				//进度值[0,1]
				float progress = mod(Time, duration) / duration; // 0~1
				//透明度[0,0.4]
				float alpha = maxAlpha * (1.0 - progress);
				//缩放比例[1.0,1.8]
				float scale = 1.0 + (maxScale - 1.0) * progress;
				
				//1.放大纹理坐标
				//根据放大笔记.得到放大纹理坐标 [0,0],[0,1],[1,1],[1,0]
				float weakX = 0.5 + (TextureCoordsVarying.x - 0.5) / scale;
				float weakY = 0.5 + (TextureCoordsVarying.y - 0.5) / scale;
				//放大纹理坐标
				vec2 weakTextureCoords = vec2(weakX, weakY);
				
				//获取对应放大纹理坐标下的纹素(颜色值rgba)
				vec4 weakMask = texture2D(Texture, weakTextureCoords);
			   
				//原始的纹理坐标下的纹素(颜色值rgba)
				vec4 mask = texture2D(Texture, TextureCoordsVarying);
				
				//颜色混合 默认颜色混合方程式 = mask * (1.0-alpha) + weakMask * alpha;
				gl_FragColor = mask * (1.0 - alpha) + weakMask * alpha;
			}
		`;
	}
}
