import React, {useCallback, useRef, useState} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useAsyncEffect, useMount} from 'ahooks';
import {Zoom} from './Effect/Zoom';
import jpg1 from './1.jpg';
import {BaseEffect} from './Effect/BaseEffect';

export const GLTransitionsAndEffect: React.FC<{
	name: string;
}> = ({name}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [transitionEvent, setTransitionEvent] = useState<BaseTransition | null>(
		null,
	);
	const [effectEvent, setEffectEvent] = useState<BaseEffect | null>(null);
	const initialize = useCallback(async () => {
		const gl = canvasRef?.current!.getContext('webgl');
		const transition = new BaseTransition({
			gl: gl as WebGLRenderingContext,
			width,
			height,
			fps,
			transitionName: name,
		});

		const effect = new Zoom({
			gl: gl!,
			fps,
			imageUrl: jpg1,
		});

		setTransitionEvent(transition);
		setEffectEvent(effect);
	}, [fps, height, name, width]);

	useMount(async () => {
		await initialize();
	});
	const abc = useCallback(async () => {
		if (frame < 100) {
			if (!effectEvent?.inited) {
				effectEvent?.init();
			} else {
				effectEvent?.drawFn!(frame);
			}
		} else {
			if (!transitionEvent?.inited) {
				await transitionEvent?.init();
			} else {
				transitionEvent?.drawFn!(frame);
			}
		}
	}, [frame, transitionEvent, effectEvent]);

	useAsyncEffect(async () => {
		await abc();
	}, [fps, frame, transitionEvent]);

	return <canvas ref={canvasRef} width={width} height={height} />;
};
