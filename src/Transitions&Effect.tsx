import React, {useCallback, useRef, useState} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useAsyncEffect, useMount} from 'ahooks';
import {DigitalDistortion} from './Effect/DigitalDistortion';
import image1 from './textImage/1.png';
import image2 from './textImage/2.png';
import {BaseEffect} from './Effect/BaseEffect';
import {SoulOut} from './Effect/SoulOut';

export const GLTransitionsAndEffect: React.FC<{
	name: string;
}> = ({name}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [transitionEvent, setTransitionEvent] = useState<BaseTransition | null>(
		null,
	);
	const [durationInFrames, setDurationInFrames] = useState<number>(0);
	const [effectEvent, setEffectEvent] = useState<BaseEffect | null>(null);
	const [effectEvent2, setEffectEvent2] = useState<BaseEffect | null>(null);
	const initialize = useCallback(async () => {
		const gl = canvasRef?.current!.getContext('webgl');
		const effect = new DigitalDistortion({
			gl: gl!,
			fps,
			image: image1,
			width,
			height,
		});
		const transition = new BaseTransition({
			gl: gl as WebGLRenderingContext,
			width,
			height,
			fps,
			transitionName: name,
			images: [image1, image2],
		});
		const effect2 = new SoulOut({
			gl: gl!,
			fps,
			image: image2,
			width,
			height,
		});
		setDurationInFrames(effect.duration * fps * 8);
		setEffectEvent(effect);
		setTransitionEvent(transition);
		setEffectEvent2(effect2);
	}, [fps, height, name, width]);

	useMount(async () => {
		await initialize();
	});
	const render = useCallback(async () => {
		// if (!effectEvent?.inited) {
		// 	await effectEvent?.init();
		// } else {
		// 	effectEvent?.drawFn!(frame);
		// }
		if (frame <= durationInFrames) {
			console.log('Rendering effect:', frame);
			if (!effectEvent?.inited) {
				await effectEvent?.init();
			} else {
				effectEvent?.drawFn!(frame);
			}
			return;
		}
		if (frame < durationInFrames + 36 && frame > durationInFrames) {
			console.log('Rendering transition:', frame);
			if (!transitionEvent?.inited) {
				await transitionEvent?.init();
			} else {
				transitionEvent?.drawFn!(frame);
			}
			return;
		}
		if (frame > durationInFrames + 26) {
			console.log('Rendering effect2:', frame);
			if (!effectEvent2?.inited) {
				await effectEvent2?.init();
			} else {
				effectEvent2.postDrawCleanUp();
				effectEvent2?.drawFn!(frame);
			}
			return;
		}
	}, [
		frame,
		transitionEvent,
		effectEvent,
		effectEvent2,
		durationInFrames,
		width,
		height,
	]);

	useAsyncEffect(async () => {
		await render();
	}, [fps, frame, transitionEvent]);

	return (
		<>
			<canvas ref={canvasRef} width={width} height={height} />
		</>
	);
};
