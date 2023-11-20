import {Composition} from 'remotion';
import GLTransitions from './GLTransitions';
import {GLTransitions1} from './GLTransitions-1';

export const RemotionVideo: React.FC = () => {
	return (
		<>
			<Composition
				id="zoom"
				component={GLTransitions}
				durationInFrames={60 * 3}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'zoom',
				}}
			/>
			<Composition
				id="soulOut"
				component={GLTransitions}
				durationInFrames={60 * 3}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'soulOut',
				}}
			/>
			<Composition
				id="shake"
				component={GLTransitions}
				durationInFrames={60 * 3}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'shake',
				}}
			/>
			<Composition
				id="flashWhite"
				component={GLTransitions}
				durationInFrames={60 * 3}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'flashWhite',
				}}
			/>
			<Composition
				id="digitalDistortion"
				component={GLTransitions}
				durationInFrames={60 * 3}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'digitalDistortion',
				}}
			/>
			<Composition
				id="Directional"
				component={GLTransitions1}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'Directional',
				}}
			/>
			<Composition
				id="Cube"
				component={GLTransitions1}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'cube',
				}}
			/>
			<Composition
				id="PolkaDotsCurtain"
				component={GLTransitions1}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'PolkaDotsCurtain',
				}}
			/>
			<Composition
				id="cannabisleaf"
				component={GLTransitions1}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'cannabisleaf',
				}}
			/>
			<Composition
				id="ButterflyWaveScrawler"
				component={GLTransitions1}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					name: 'ButterflyWaveScrawler',
				}}
			/>
		</>
	);
};
