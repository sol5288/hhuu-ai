<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
import { NTooltip, useMessage } from 'naive-ui';
import { useUsingContext } from '../../hooks/useUsingContext';
import { SvgIcon } from '@/components/common';
import { useAppStore, useAuthStore, useChatStore, useGlobalStoreWithOut } from '@/store';
import { useBasicLayout } from '@/hooks/useBasicLayout';

import type { Theme } from '@/store/modules/app/helper';
import { t } from '@/locales';

defineProps<Props>();
const emit = defineEmits<Emit>();
const authStore = useAuthStore();
const { usingContext, toggleUsingContext } = useUsingContext();

interface Props {
	usingContext: boolean;
}

interface Emit {
	(ev: 'export'): void;
	(ev: 'toggleUsingContext'): void;
	(ev: 'clear'): void;
	(ev: 'scrollBtn'): void;
}
const ms = useMessage();
const marks = ref({
	0: t('common.rigid'),
	0.1: t('common.professional'),
	0.2: t('common.accurate'),
	0.8: t('common.balanced'),
	1: t('common.creative'),
	1.3: t('common.ridiculous'),
	1.6: t('common.absurd'),
});
const themeOptions: {
	label: string;
	key: Theme;
	icon: string;
}[] = [
	{
		label: 'Auto',
		key: 'auto',
		icon: 'ri:contrast-line',
	},
	{
		label: 'Light',
		key: 'light',
		icon: 'twemoji:sun',
	},
	{
		label: 'Dark',
		key: 'dark',
		icon: 'noto-v1:last-quarter-moon-face',
	},
];

const modelName = computed(() => {
	if (!chatStore.activeConfig) return;
	const { modelTypeInfo, modelInfo } = chatStore.activeConfig;
	if (!modelTypeInfo || !modelInfo) return;
	return `${modelTypeInfo?.label} / ${modelInfo.modelName}`;
});

const appStore = useAppStore();
const chatStore = useChatStore();
const useGlobalStore = useGlobalStoreWithOut();

const collapsed = computed(() => appStore.siderCollapsed);
const currentChatHistory = computed(() => chatStore.getChatByGroupInfo());

const { isMobile } = useBasicLayout();
const theme = computed(() => appStore.theme);

function handleUpdateCollapsed() {
	appStore.setSiderCollapsed(!collapsed.value);
}

function onScrollToTop() {
	const scrollRef = document.querySelector('#scrollRef');
	if (scrollRef) nextTick(() => (scrollRef.scrollTop = 0));
}

function handleExport() {
	emit('export');
}

function handleClear() {
	emit('clear');
}

function handleScrollBtm() {
	emit('scrollBtn');
}

function handleOpenModelDialog() {
	if (useGlobalStore.isChatIn) return ms.warning(t('common.waitForChatToEndBeforeModifying'));

	useGlobalStore.updateModelDialog(true);
}
const isLogin = computed(() => authStore.isLogin);

function handleSignIn() {
	if (!isLogin.value) {
		authStore.setLoginDialog(true);
		return;
	}
	useGlobalStore.updateSignInDialog(true);
}
</script>

<template>
	<header
		class="sticky top-0 left-0 right-0 z-30 border-b dark:border-neutral-800 bg-white/80 dark:bg-black/20 backdrop-blur"
	>
		<div class="relative flex items-center justify-center min-w-0 overflow-hidden h-12">
			<div class="max-w-screen-4xl flex w-full h-full items-center px-2">
				<div v-if="isMobile" class="flex items-center">
					<button class="flex items-center justify-center w-11 h-11" @click="handleUpdateCollapsed">
						<SvgIcon v-if="collapsed" class="text-2xl" icon="ri:align-justify" />
						<SvgIcon v-else class="text-2xl" icon="ri:align-right" />
					</button>
				</div>

				<!-- pc -->
				<div
					class="flex justify-between items-center h-full w-full"
					:class="[isMobile ? 'title-wrapper' : '']"
				>
					<div class="flex ele-drag items-center h-full over-hidden">
						<h1
							class="font-bold overflow-hidden cursor-pointer select-none text-ellipsis whitespace-nowrap px-2 pr-2"
							@dblclick="onScrollToTop"
						>
							{{ currentChatHistory?.title ?? '' }}
						</h1>
					</div>
					<div class="flex items-center space-x-2">
						<!-- <NPopover v-if="isMobile" trigger="click">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400">
                    <SvgIcon icon="fluent:dark-theme-24-regular" />
                  </span>
                </button>
              </template>
              <div>
                <div class="flex items-center gap-4">
                  <template v-for="item of themeOptions" :key="item.key">
                    <NButton
                      size="small"
                      :type="item.key === theme ? 'info' : undefined"
                      @click="appStore.setTheme(item.key)"
                    >
                      <template #icon>
                        <SvgIcon
                          :icon="item.icon"
                          :style="{ color: item.color }"
                        />
                      </template>
                    </NButton>
                  </template>
                </div>
              </div>
            </NPopover> -->

						<NTooltip v-if="isMobile" trigger="hover" :disabled="isMobile">
							<template #trigger>
								<button
									class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
									@click="handleSignIn"
								>
									<span class="text-base text-slate-500 dark:text-slate-400">
										<SvgIcon icon="streamline-emojis:wrapped-gift-1" />
									</span>
								</button>
							</template>
							{{ t('common.signInForRewards') }}
						</NTooltip>
						<NTooltip trigger="hover" :disabled="isMobile">
							<template #trigger>
								<button
									class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
									@click="handleExport"
									v-show="!isMobile"
								>
									<span class="text-base text-slate-500 dark:text-slate-400">
										<SvgIcon icon="material-symbols:sim-card-download-outline-rounded" />
									</span>
								</button>
							</template>
							{{ t('common.exportPageAsImage') }}
						</NTooltip>
						<NTooltip trigger="hover" :disabled="isMobile">
							<template #trigger>
								<button
									class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
									@click="handleClear"
								>
									<span class="text-base text-slate-500 dark:text-slate-400"
										><SvgIcon icon="material-symbols:delete-outline"
									/></span>
								</button>
							</template>
							{{ t('common.deletePageContent') }}
						</NTooltip>
						<NTooltip trigger="hover" :disabled="isMobile">
							<template #trigger>
								<button
									class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
									@click="handleScrollBtm"
								>
									<span class="text-base text-slate-500 dark:text-slate-400"
										><SvgIcon icon="material-symbols:keyboard-arrow-down"
									/></span>
								</button>
							</template>
							{{ t('common.scrollToBottom') }}
						</NTooltip>
					</div>
				</div>
			</div>
		</div>
		<!-- <NPopover :show="showModelPopover">
      <template #trigger> -->
		<!-- <div
      class="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap cursor-pointer select-none rounded-b-md border bg-white px-4 dark:border-neutral-700 dark:bg-[#111114] flex items-center hover:text-[#5a91fc] transition"
      @click="handleOpenModelDialog"
    > -->
		<!-- <SvgIcon class="text-base mr-2" icon="fluent:flash-sparkle-20-regular" /> -->
		<!-- <img :src="modelSvg" class="text-base mr-2 w-4" alt=""> -->

		<!-- {{ modelName }}
      <SvgIcon
        class="text-2xl"
        :icon="
          useGlobalStore.modelDialog
            ? 'ri:arrow-down-s-line'
            : 'ri:arrow-right-s-line'
        "
      />
    </div> -->
		<!-- </template>
      <template #header>
        <span class="cursor-pointer  hover:text-[#3076fd]" @click="handleChangeMode(3)">
          GPT-3.5
        </span>
      </template>
      <span class="cursor-pointer  hover:text-[#3076fd]" @click="handleChangeMode(4)">
        GPT-4.0
      </span>
    </NPopover> -->
	</header>
</template>

<style scoped>
.title-wrapper {
	width: calc(100% - 44px);
}
.over-hidden {
	width: 100%;
	overflow: hidden;
}
</style>
