/**
 *@desc: 缩放效果滤镜
 *@author: XinD
 *@date: 2023/11/20
 */
import {BaseEffect} from './BaseEffect';

export class Zoom extends BaseEffect {
	protected getVertexShaderSource(): string {
		return `
			//顶点坐标/纹理坐标映射关系.放大?
			//放大过程. 顶点着色器完成.
			
			//顶点坐标
			attribute vec4 Position;
			//纹理坐标
			attribute vec2 TextureCoords;
			//纹理坐标
			varying vec2 TextureCoordsVarying;
			//时间戳(及时更新)
			uniform float Time;
			//PI
			const float PI = 3.1415926;
			
			void main (void) {
			   
				//一次缩放效果时长 0.6
				float duration = 0.6;
				//最大缩放幅度
				float maxAmplitude = 0.3;
				
				//表示时间周期.范围[0.0~0.6];
				float time = mod(Time, duration);
				
				//amplitude [1.0,1.3]
				float amplitude = 1.0 + maxAmplitude * abs(sin(time * (PI / duration)));
				
				// 顶点坐标x/y 分别乘以放大系数[1.0,1.3]
				gl_Position = vec4(Position.x * amplitude, Position.y * amplitude, Position.zw);
			   
				// 纹理坐标
				TextureCoordsVarying = TextureCoords;
			}
		`;
	}
	protected getFragmentShaderSource(): string {
		return `
			precision mediump float;
			uniform sampler2D u_image;
			varying vec2 TextureCoordsVarying;
		
			void main() {
				gl_FragColor = texture2D(u_image, TextureCoordsVarying);
			}
		`;
	}
}
