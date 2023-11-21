import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
	continueRender,
	delayRender,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useAsyncEffect, useMount} from 'ahooks';
import {DigitalDistortion} from './Effect/DigitalDistortion';
import image1 from './textImage/1.png';
import image2 from './textImage/2.png';
import {BaseEffect} from './Effect/BaseEffect';
import {SoulOut} from './Effect/SoulOut';
import {FPS} from './constants';

export const GLTransitionsAndEffect: React.FC<{
	name: string;
	durationInFramesTotal: number;
}> = ({name, durationInFramesTotal}) => {
	const effectDurationInFrames = (durationInFramesTotal - FPS) / 2;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [transitionEvent, setTransitionEvent] = useState<BaseTransition | null>(
		null,
	);
	const [isInitialized, setIsInitialized] = useState(false);
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
		await effect.init();
		await transition.init();
		await effect2.init();
		setEffectEvent(effect);
		setTransitionEvent(transition);
		setEffectEvent2(effect2);
		setIsInitialized(true);
	}, [fps, height, name, width]);

	useMount(async () => {
		await initialize();
	});
	const render = useCallback(async () => {
		if (!isInitialized) {
			return; // 如果还未初始化完成，不执行渲染
		}
		if (frame <= effectDurationInFrames) {
			console.log('Rendering effect:', frame);
			effectEvent?.drawFn!(frame);
		} else if (frame <= effectDurationInFrames + FPS) {
			console.log('Rendering transition:', frame);
			transitionEvent?.drawFn!(frame, effectDurationInFrames);
		} else {
			console.log('Rendering effect2:', frame);
			effectEvent2?.drawFn!(frame);
		}
	}, [frame, isInitialized, effectDurationInFrames]);

	useAsyncEffect(async () => {
		await render();
	}, [fps, frame, transitionEvent]);

	return (
		<>
			<canvas ref={canvasRef} width={width} height={height} />
		</>
	);
};
