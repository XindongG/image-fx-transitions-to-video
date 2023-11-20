import React, {useCallback, useEffect, useState} from 'react';
import {delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useMount} from 'ahooks';
const canvas = React.createRef<HTMLCanvasElement>();

export const GLTransitions: React.FC<{
	name: string;
}> = ({name}) => {
	const [handle] = useState(() => delayRender());
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [transitionEvent, setTransitionEvent] = useState<any>(null);
	const initialize = useCallback(async () => {
		const gl =
			(canvas.current as HTMLCanvasElement).getContext('webgl') ||
			((canvas.current as HTMLCanvasElement).getContext(
				'experimental-webgl',
			) as WebGLRenderingContext);
		const result = new BaseTransition({
			gl: gl as WebGLRenderingContext,
			width,
			height,
			fps,
			transitionName: name,
		});
		await result.init();
		setTransitionEvent(result);
	}, [fps, handle, height, name, width]);

	useMount(async () => {
		await initialize();
	});

	useEffect(() => {
		if (transitionEvent?.drawFn) {
			transitionEvent.drawFn(frame);
		}
	}, [fps, frame, transitionEvent]);

	return <canvas ref={canvas} width={width} height={height} />;
};
