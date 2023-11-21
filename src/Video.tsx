import {Composition} from 'remotion';
import GLEffects from './GLEffects';
import {GLTransitions} from './GLTransitions';
import {GLTransitionsAndEffect} from './Transitions&Effect';
import transitions from 'gl-transitions';
import {DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from './constants';
import effects from './Effect';

const letterToUpperCase = (str: string) => {
	return str.replace(/_(\w)/g, function (_: unknown, letter: string) {
		return letter.toUpperCase();
	});
};
export const RemotionVideo: React.FC = () => {
	return (
		<>
			<Composition
				id="GLTransitionsAndEffect"
				component={GLTransitionsAndEffect}
				durationInFrames={4 * 18 + 36 + 4 * 18}
				fps={FPS}
				width={WIDTH}
				height={HEIGHT}
				defaultProps={{
					name: 'BowTieHorizontal',
				}}
			/>
			{effects.map((item: {name: any}, index: any) => {
				return (
					<Composition
						key={item.name}
						id={`GLEffects-${
							item.name.charAt(0).toUpperCase() + item.name.slice(1)
						}`}
						component={GLEffects}
						durationInFrames={DURATION_IN_FRAMES}
						fps={FPS}
						width={WIDTH}
						height={HEIGHT}
						defaultProps={{
							name: item.name,
						}}
					/>
				);
			})}
			<div>
				{transitions.map((item: {name: any}, index: any) => {
					//将item.name中的_，变成驼峰命名
					item.name = letterToUpperCase(item.name);
					return (
						<Composition
							key={item.name}
							id={`GLTransitions-${item.name}`}
							component={GLTransitions}
							durationInFrames={DURATION_IN_FRAMES}
							fps={FPS}
							width={WIDTH}
							height={HEIGHT}
							defaultProps={{
								name: item.name,
							}}
						/>
					);
				})}
			</div>
		</>
	);
};
