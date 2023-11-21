/**
 *@desc: 闪白滤镜: 添加白色图层 ,白色图层的透明度随着时间变化。
 *@author: XinD
 *@date: 2023/11/20
 */
import {BaseEffect} from './BaseEffect';

export class FlashWhite extends BaseEffect {
	public duration: number = 0.6;
	protected getFragmentShaderSource(): string {
		return `
			precision highp float;
			//纹理采样器
			uniform sampler2D Texture;
			//纹理坐标
			varying vec2 TextureCoordsVarying;
			//时间撮
			uniform float Time;
			//PI 常量
			const float PI = 3.1415926;
			
			void main (void) {
				
				//一次闪白滤镜的时长 0.6
				float duration = 0.6;
				//表示时间周期[0.0,0.6]
				float time = mod(Time, duration);
				//白色颜色遮罩层
				vec4 whiteMask = vec4(1.0, 1.0, 1.0, 1.0);
				//振幅: (0.0,1.0)
				float amplitude = abs(sin(time * (PI / duration)));
				//纹理坐标对应的纹素(RGBA)
				vec4 mask = texture2D(Texture, TextureCoordsVarying);
				
				//利用混合方程式; 白色图层 + 原始纹理图片颜色 来进行混合
				gl_FragColor = mask * (1.0 - amplitude) + whiteMask * amplitude;
			}
		`;
	}
}
