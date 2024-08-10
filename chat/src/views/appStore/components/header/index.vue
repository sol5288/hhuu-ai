<script lang="ts" setup>
import { useRouter } from 'vue-router';
import sider from '../siderbar/index.vue';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { SvgIcon } from '@/components/common';
const router = useRouter();
const { isMobile } = useBasicLayout();
import { t } from '@/locales';
</script>

<template>
	<div v-if="!isMobile" class="flex pl-5 h-full items-center space-x-2 overflow-hidden pr-2">
		<button @click="router.go(-1)">
			<SvgIcon class="text-xl" icon="arcticons:huawei-tips" />
		</button>
		<h2 class="text-base text-[#999999] flex items-center w-full">
			Tips:
			<span class="text-sm ml-2"
				>{{ t('common.currentModeUsageInfo') }}
				<span class="text-[#5a91fc] cursor-pointer" @click="router.push('/role')">{{
					t('common.personalWorkbench')
				}}</span>
				{{ t('common.createCustomApp') }}
			</span>
			<span class="flex-1 ele-drag" />
		</h2>
	</div>
	<sider v-if="isMobile" />
</template>
