import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import enUS from './en-US';
import zhCN from './zh-CN';
import koKR from './ko-KR';

export type Language = 'en-US' | 'zh-CN' | 'ko-KR';

const i18n = createI18n({
  legacy: false, // Vue 3에서는 legacy 모드를 false로 설정하는 것이 좋습니다.
	locale: 'ko-KR' as Language, // 기본값 설정
	fallbackLocale: 'en-US' as Language,
	allowComposition: true,
	messages: {
		'en-US': enUS,
		'zh-CN': zhCN,
		'ko-KR': koKR,
	},
});

export function setLocale(locale: Language) {
  i18n.global.locale.value = locale; // Composition API에서는 .value를 사용해야 합니다.
}

export const { t } = i18n.global;

export function setupI18n(app: App) {
	// useSettingsStore를 이 함수 내에서 import하고 사용합니다.
  import('@/store/modules/settings').then((module) => {
    const useSettingsStore = module.default;
    const settingsStore = useSettingsStore();
    const defaultLocale = settingsStore.getLanguage() || 'ko-KR';
    i18n.global.locale.value = defaultLocale;
  });

  app.use(i18n);
}

export default i18n;
