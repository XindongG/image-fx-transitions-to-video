import React, {useCallback, useEffect, useState} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useMount} from 'ahooks';
const image1 = 'https://content-test.fancybos.com/e3lk31mvvh.jpg';
const image2 = 'https://content-test.fancybos.com/ovhmiyhkh2.jpg';

const canvas = React.createRef<HTMLCanvasElement>();

export const GLTransitions: React.FC<{
	name: string;
}> = ({name}) => {
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
			images: [image1, image2],
		});
		await result.init();
		setTransitionEvent(result);
	}, [fps, height, name, width]);

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
