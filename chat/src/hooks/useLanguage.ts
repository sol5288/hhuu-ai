import { computed } from 'vue';
import { enUS, zhCN, koKR } from 'naive-ui';
import { useAppStore } from '@/store';
import { setLocale } from '@/locales';

export function useLanguage() {
	const appStore = useAppStore();
	// 기본언어 ko-KR로 강제변경
	appStore.setLanguage('ko-KR');

	const language = computed(() => {
		switch (appStore.language) {
			case 'en-US':
				setLocale('en-US');
				return enUS;
			case 'zh-CN':
				setLocale('zh-CN');
				return zhCN;
			case 'ko-KR':
				setLocale('ko-KR');
				return koKR;
			default:
				setLocale('ko-KR');
				return koKR;
		}
	});

	return { language };
}
