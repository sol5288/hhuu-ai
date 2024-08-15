import { computed } from 'vue';
import { useMessage } from 'naive-ui';
import { useChatStore } from '@/store';
import { t } from '@/locales';

export function useUsingNetwork() {
	const ms = useMessage();
	const chatStore = useChatStore();
	const usingNetwork = computed<boolean>(() => chatStore.usingNetwork);

	function toggleUsingNetwork() {
		chatStore.setUsingNetwork(!usingNetwork.value);
		if (usingNetwork.value) ms.success(t('common.networkModeEnabled'));
		else ms.warning(t('common.networkModeDisabled'));
	}

	return {
		usingNetwork,
		toggleUsingNetwork,
	};
}
