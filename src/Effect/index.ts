import {Zoom} from './Zoom';
import {SoulOut} from './SoulOut';
import {Shake} from './Shake';
import {FlashWhite} from './FlashWhite';
import {DigitalDistortion} from './DigitalDistortion';

export default [
	{
		name: 'zoom', // 缩放效果
		effect: Zoom,
	},
	{
		name: 'soulOut', // 灵魂出窍效果
		effect: SoulOut,
	},
	{
		name: 'shake', // 抖动效果
		effect: Shake,
	},
	{
		name: 'flashWhite', // 闪白效果
		effect: FlashWhite,
	},
	{
		name: 'digitalDistortion', // 毛刺效果
		effect: DigitalDistortion,
	},
];
