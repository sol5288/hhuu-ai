<script setup lang="ts">
import { computed, ref } from 'vue';
import { NDropdown, useMessage } from 'naive-ui';
import AvatarComponent from './Avatar.vue';
import TextComponent from './Text.vue';
import { copyText } from '@/utils/format';
import { useIconRender } from '@/hooks/useIconRender';
import { t } from '@/locales';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { SvgIcon } from '@/components/common';

interface Props {
	dateTime?: string;
	text?: string;
	inversion?: boolean;
	error?: boolean;
	loading?: boolean;
	imageUrl?: string;
}

interface Emit {
	(ev: 'regenerate'): void;
	(ev: 'delete'): void;
	(ev: 'video'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emit>();
const ms = useMessage();
const { isMobile } = useBasicLayout();

const { iconRender } = useIconRender();

const textRef = ref<HTMLElement>();

const asRawText = ref(props.inversion);

const messageRef = ref<HTMLElement>();

const options = computed(() => {
	const common = [
		{
			label: t('common.copy'),
			key: 'copyText',
			icon: iconRender({ icon: 'ri:file-copy-2-line' }),
		},
		{
			label: t('common.delete'),
			key: 'delete',
			icon: iconRender({ icon: 'ri:delete-bin-line' }),
		},
	];

	if (!props.inversion) {
		common.unshift({
			label: asRawText.value ? t('common.preview') : t('common.showRawText'),
			key: 'toggleRenderType',
			icon: iconRender({
				icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code',
			}),
		});
	}

	return common;
});

function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
	switch (key) {
		case 'copyText':
			copyText({ text: props.text ?? '' });
			ms.success(t('common.copySuccess'));
			return;
		case 'toggleRenderType':
			asRawText.value = !asRawText.value;
			return;
		case 'delete':
			emit('delete');
	}
}

function handleDetele() {
	emit('delete');
}

function hendleVideo() {
	emit('video');
}

function handleCopy() {
	copyText({ text: props.text ?? '' });
	props.text && ms.success(t('common.copySuccess'));
}

function handleRegenerate() {
	messageRef.value?.scrollIntoView();
	emit('regenerate');
}
</script>

<template>
	<div
		ref="messageRef"
		class="flex w-full mb-6 overflow-hidden items-start"
		:class="[{ 'flex-row-reverse': inversion }]"
	>
		<div
			class="flex items-center justify-center flex-shrink-0 mt-1"
			:class="[inversion ? 'ml-2' : 'mr-2']"
		>
			<AvatarComponent :image="inversion" />
		</div>
		<div class="overflow-hidden text-sm" :class="[inversion ? 'items-end' : 'items-start']">
			<p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
				{{ dateTime }}
			</p>
			<div
				class="flex items-end gap-1 mt-2"
				:class="[inversion ? 'flex-row-reverse' : 'flex-row', inversion ? 'pl-5' : 'pr-5']"
			>
				<TextComponent
					ref="textRef"
					:inversion="inversion"
					:error="error"
					:text="text"
					:loading="loading"
					:as-raw-text="asRawText"
					@regenerate="handleRegenerate"
					@copy="handleCopy"
					@delete="handleDetele"
					@video="hendleVideo"
					:imageUrl="imageUrl"
				/>
				<!-- <div class="flex flex-col">
          <button
            v-if="!inversion"
            class="flex mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            @click="handleRegenerate"
          >
            <SvgIcon icon="ri:restart-line" />
          </button>
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect"
          >
            <button
              class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div> -->
			</div>
		</div>
	</div>
</template>
