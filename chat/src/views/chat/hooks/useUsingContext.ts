import { computed } from 'vue';
import { useMessage } from 'naive-ui';
import { t } from '@/locales';
import { useChatStore } from '@/store';

export function useUsingContext() {
	const ms = useMessage();
	const chatStore = useChatStore();
	const usingContext = computed<boolean>(() => chatStore.usingContext);

	function toggleUsingContext() {
		chatStore.setUsingContext(!usingContext.value);
		if (usingContext.value) ms.success(t('common.turnOnContext'));
		else ms.warning(t('common.turnOffContext'));
	}

	return {
		usingContext,
		toggleUsingContext,
	};
}
