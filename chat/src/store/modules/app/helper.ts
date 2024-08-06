import { ss } from '@/utils/storage';

function detectEnvironment() {
	if (typeof process !== 'undefined' && process?.type === 'renderer') return 'electron';
	if (typeof wx !== 'undefined') return 'wechat';
	if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches)
		return 'webApp';
	if (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent))
		return 'mobile';
	return 'webBrowser';
}

const LOCAL_NAME = 'appSetting';

export type Theme = 'light' | 'dark' | 'auto';

export type Language = 'zh-CN' | 'ko-KR' | 'en-US';

export type Env = 'electron' | 'wecaht' | 'web' | 'mobile';

export interface AppState {
	siderCollapsed: boolean;
	theme: Theme;
	language: Language;
	env: Env;
}

export function defaultSetting(): AppState {
	return { siderCollapsed: false, theme: 'auto', language: 'ko-KR', env: detectEnvironment() };
}

export function getLocalSetting(): AppState {
	const localSetting: AppState | undefined = ss.get(LOCAL_NAME);
	return { ...defaultSetting(), ...localSetting };
}

export function setLocalSetting(setting: AppState): void {
	ss.set(LOCAL_NAME, setting);
}
