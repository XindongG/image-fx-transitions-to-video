import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import effects from './Effect';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useMount} from 'ahooks';
import image1 from './textImage/1.png';
import {Texture} from './Texture';
const GLEffects: React.FC<{
	name: string;
}> = ({name}) => {
	const {fps, width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [shader, setShader] = useState<any>(null);

	const Effect = useMemo(() => {
		return effects.find((item) => item.name === name)!.effect;
	}, [effects]);

	// 初始化渲染
	const init = useCallback(async () => {
		const gl = canvasRef?.current!.getContext('webgl');
		const texture = new Texture({
			gl: gl as WebGLRenderingContext,
			width,
			height,
		});
		const result = new Effect({
			gl: gl as WebGLRenderingContext,
			fps,
			width,
			height,
			image: image1,
		});
		setShader(result);
		await result!.init();
	}, [fps, height, width]);
	useMount(async () => {
		await init();
	});
	useEffect(() => {
		if (shader?.drawFn) {
			shader?.drawFn(frame);
		}
	}, [shader, fps, frame]);
	return <canvas ref={canvasRef} width={width} height={height} />;
};

export default GLEffects;
