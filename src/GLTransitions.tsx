import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import effects from './Effect';
import {delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {useMount} from 'ahooks';
import image1 from './1.jpg';
const GLTransitions: React.FC<{
	name: string;
}> = ({name}) => {
	const [handle] = useState(() => delayRender());
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
		const result = new Effect({
			gl: gl as WebGLRenderingContext,
			fps,
			imageUrl: image1,
		});
		setShader(result);
		await result!.init();
	}, [fps, handle, height, width]);
	useMount(async () => {
		await init();
	});
	useEffect(() => {
		shader?.render(frame);
	}, [shader, fps, frame]);
	return <canvas ref={canvasRef} width={width} height={height} />;
};

export default GLTransitions;
