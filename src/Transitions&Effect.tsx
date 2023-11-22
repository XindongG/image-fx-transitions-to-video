import React, {useCallback, useRef, useState} from 'react';
import {
	continueRender,
	delayRender,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {BaseTransition} from './Transition/BaseTransition';
import {useAsyncEffect, useMount} from 'ahooks';
import {BaseEffect} from './Effect/BaseEffect';
import {FPS} from './constants';
import Effect from './Effect';
const data = {
	images: [
		// 'https://content-test.fancybos.com/evhcbgdagfc.webp',
		// 'https://content-test.fancybos.com/6o3ucz5qk7.webp',
		// 'https://content-test.fancybos.com/mowh9qf33f.webp',
		'https://content-test.fancybos.com/0qxsl9vemhhr.jpg',
		'https://content-test.fancybos.com/e3lk31mvvh.jpg',
		'https://content-test.fancybos.com/ovhmiyhkh2.jpg',
		'https://content-test.fancybos.com/h8yu7zyp4br.jpg',
		'https://content-test.fancybos.com/z57ynehdne.jpg',
	],
	effects: [
		{name: 'soulOut', duration: 2 * FPS},
		{name: 'digitalDistortion', duration: 2 * FPS},
		{name: 'shake', duration: 2 * FPS},
	],
	transitions: [
		{name: 'ColourDistance', duration: FPS},
		{name: 'CrossZoom', duration: FPS},
	],
};

const findEffectClass = (name: string) => {
	const effect = Effect.find((item) => item.name === name)?.effect;
	return effect || Effect.find((item) => item.name === 'soulOut')?.effect;
};

const findTransitionName = (index: number) => {
	return data.transitions[index]?.name || 'CrossZoom';
};

export const GLTransitionsAndEffect = () => {
	const handle = useRef<any>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [isInitialized, setIsInitialized] = useState(false);
	const [effectsEvents, setEffectsEvents] = useState<BaseEffect[]>([]);
	const [transitionsEvents, setTransitionsEvents] = useState<BaseTransition[]>(
		[],
	);

	const initialize = useCallback(async () => {
		const gl = canvasRef.current?.getContext('webgl');
		if (!gl) {
			console.error('WebGL context not found');
			return;
		}

		const effectInstances = [];
		const transitionInstances = [];

		for (let i = 0; i < data.images.length; i++) {
			const effectClass = findEffectClass(data.effects[i]?.name);
			const effectInstance = new effectClass!({
				gl: gl,
				fps,
				image: data.images[i],
				width,
				height,
			});
			await effectInstance.init();
			effectInstances.push(effectInstance);

			if (i < data.images.length - 1) {
				const transitionName = findTransitionName(i);
				const transitionInstance = new BaseTransition({
					gl: gl,
					width,
					height,
					fps,
					transitionName: transitionName,
					images: [data.images[i], data.images[i + 1]],
				});
				await transitionInstance.init();
				transitionInstances.push(transitionInstance);
			}
		}

		setEffectsEvents(effectInstances);
		setTransitionsEvents(transitionInstances);
		setIsInitialized(true);
	}, [fps, height, width]);

	useMount(async () => {
		handle.current = delayRender();
		await initialize();
		continueRender(handle.current);
	});

	const render = useCallback(async () => {
		if (!isInitialized) {
			return;
		}

		let currentFrameCounter = 0;

		for (let i = 0; i < data.images.length; i++) {
			const effectDuration = data.effects[i]?.duration || 2 * FPS; // 默认特效时长
			const transitionDuration =
				i < data.images.length - 1 ? data.transitions[i]?.duration || FPS : 0; // 默认转场时长

			if (
				frame >= currentFrameCounter &&
				frame < currentFrameCounter + effectDuration
			) {
				effectsEvents[i]?.drawFn!(frame - currentFrameCounter);
			}

			currentFrameCounter += effectDuration;

			if (
				i < transitionsEvents.length &&
				frame >= currentFrameCounter &&
				frame < currentFrameCounter + transitionDuration
			) {
				transitionsEvents[i]?.drawFn!(
					frame - currentFrameCounter,
					effectDuration,
					transitionDuration,
				);
			}

			currentFrameCounter += transitionDuration;
		}
	}, [frame, isInitialized, effectsEvents, transitionsEvents]);

	useAsyncEffect(async () => {
		await render();
	}, [frame]);

	return (
		<>
			<canvas ref={canvasRef} width={width} height={height} />
		</>
	);
};

export default GLTransitionsAndEffect;
