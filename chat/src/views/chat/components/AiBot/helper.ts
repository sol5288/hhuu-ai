interface ChatBoxItemChildrenItem {
	appId?: number;
	id: number;
	prompt: number;
	title: string;
	coverImg: string;
}
export interface ChatboxItem {
	id: number;
	icon: string;
	name: string;
	childList: ChatBoxItemChildrenItem[];
}

import { t } from '@/locales';

export const defaultChatBox: any = [
	{
		id: 1,
		name: t('common.personalAssistant'),
		icon: 'ri:ai-generate',
		childList: [
			{
				appId: 0,
				prompt: t('common.personalAssistantDescription'),
				title: t('common.englishTranslator'),
			},
			{
				id: 3,
				appId: 0,
				prompt: t('common.psychologistDescription'),
				title: t('common.psychologist'),
			},
			{
				id: 4,
				appId: 0,
				prompt: t('common.productManagerDescription'),
				title: t('common.productManager'),
			},
		],
	},
	{
		id: 2,
		name: t('common.casualEntertainment'),
		icon: 'ri:lightbulb-flash-line',
		childList: [
			{
				id: 5,
				appId: 0,
				prompt: t('common.personalChefDescription'),
				title: t('common.howToCook'),
			},
			{
				id: 6,
				appId: 0,
				prompt: t('common.travelGuideDescription'),
				title: t('common.travelGuide'),
			},
			{
				id: 7,
				appId: 0,
				prompt: t('common.timeTravelQuestion'),
				title: t('common.timeTravel'),
			},
		],
	},
	{
		id: 3,
		name: t('common.encyclopedia'),
		icon: 'ri:book-mark-line',
		childList: [
			{
				id: 8,
				appId: 0,
				prompt: t('common.quantumMechanicsQuestion'),
				title: t('common.quantumMechanics'),
			},
			{
				id: 9,
				appId: 0,
				prompt: t('common.artificialIntelligenceQuestion'),
				title: t('common.artificialIntelligence'),
			},
			{
				id: 10,
				appId: 0,
				prompt: t('common.deepLearningQuestion'),
				title: t('common.deepLearning'),
			},
		],
	},
];
