<script setup lang="ts">
import {
	NAvatar,
	NButton,
	NCard,
	NDataTable,
	NGrid,
	NGridItem,
	NSpace,
	useMessage,
} from 'naive-ui';
import { computed, h, onMounted, reactive, ref } from 'vue';
import clipboard3 from 'vue-clipboard3';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { useAuthStore } from '@/store';
import { fetchGenInviteCodeAPI, fetchGetInviteRecordAPI } from '@/api/user';
import type { ResData } from '@/api/types';
import { t } from '@/locales';

const { toClipboard } = clipboard3();

const authStore = useAuthStore();
const inviteCode = computed(() => authStore.userInfo.inviteCode);
const globalConfig = computed(() => authStore.globalConfig);
const { isSmallXl, isMobile } = useBasicLayout();
const ms = useMessage();
const regLoading = ref(false);

interface InviteRecord {
	avatar: string;
	email: string;
	username: string;
	status: number;
	createdAt: Date;
}

const paginationReg = reactive({
	page: 1,
	pageSize: 10,
	showSizePicker: true,
	pageSizes: [10, 20, 50],
	onChange: (page: number) => {
		paginationReg.page = page;
		queryInviteRecord();
	},
	onUpdatePageSize: (pageSize: number) => {
		paginationReg.pageSize = pageSize;
		paginationReg.page = 1;
		queryInviteRecord();
	},
});

const columns = computed(() => {
	return [
		{
			title: t('common.avatar'),
			key: 'avatar',
			render(row: InviteRecord) {
				return h(NAvatar, {
					src: row.avatar,
					size: 'small',
					round: true,
				});
			},
		},
		{
			title: t('common.userName'),
			key: 'username',
		},
		{
			title: t('common.userEmail'),
			key: 'email',
		},
		{
			title: t('common.inviteeStatus'),
			key: 'status',
			render(row: InviteRecord) {
				return h(
					NButton,
					{
						type: row.status === 1 ? 'primary' : 'error',
						size: 'small',
						round: true,
						quaternary: true,
					},
					{
						default: () => (row.status === 1 ? t('common.verified') : t('common.notActivated')),
					}
				);
			},
		},
		{
			title: t('common.invitationTime'),
			key: 'createdAt',
			render(row: InviteRecord) {
				return h(
					'div',
					{
						style: {
							fontSize: '12px',
							color: '#999',
						},
					},
					() => row.createdAt
				);
			},
		},
		{
			title: t('common.rewardStatus'),
			key: 'status',
			render(row: InviteRecord) {
				return h(
					NButton,
					{
						type: row.status === 1 ? 'success' : 'warning',
						size: 'small',
						round: true,
						quaternary: true,
					},
					{
						default: () =>
							row.status === 1
								? t('common.invitationRewardClaimed')
								: t('common.waitingForInviteeConfirmation'),
					}
				);
			},
		},
	];
});

const data = ref([]);

async function genMyInviteCode() {
	const res: ResData = await fetchGenInviteCodeAPI();
	if (!res.data) return ms.error(res.message);
	ms.success(t('common.generateInvitationLinkSuccess'));
	authStore.getUserInfo();
}

async function queryInviteRecord() {
	try {
		regLoading.value = true;
		const res: ResData = await fetchGetInviteRecordAPI({
			page: paginationReg.page,
			size: paginationReg.pageSize,
		});
		data.value = res.data.rows;
		regLoading.value = false;
	} catch (error) {
		regLoading.value = false;
	}
}

async function copyInviteCode() {
	if (!inviteCode.value) return ms.error(t('common.generateInvitationLinkFirst'));
	const path = `${window.location.href}?inVitecode=${inviteCode.value}`;
	try {
		await toClipboard(path);
		ms.success(t('common.copyExclusiveInvitationLinkSuccess'));
	} catch (error) {
		ms.error(t('common.manualCopyRequired'));
	}
}

onMounted(() => {
	queryInviteRecord();
});
</script>

<template>
	<NCard>
		<template #header>
			<div>{{ t('common.inviteUsersGetBenefits') }}</div>
		</template>
		<NGrid :x-gap="24" :y-gap="24" :cols="isSmallXl ? 1 : 3" class="mt-3">
			<NGridItem class="border rounded-sm p-3 dark:border-[#ffffff17]" :span="2">
				<div class="text-[#95aac9] mb-2 text-base">{{ t('common.myInvitationCode') }}</div>
				<div class="flex justify-between" :class="[isSmallXl ? 'flex-col mt-3' : '']">
					<b class="text-2xl text-[#555] dark:text-[#fff] whitespace-nowrap">
						{{ inviteCode || '********' }}</b
					>
					<NSpace :class="[isSmallXl ? ' mt-3' : '']">
						<NButton type="success" @click="genMyInviteCode">
							{{ t('common.generateExclusiveInvitationCode') }}
						</NButton>
						<NButton type="primary" @click="copyInviteCode">
							{{ t('common.copyExclusiveInvitationLink') }}
						</NButton>
					</NSpace>
				</div>
			</NGridItem>
			<NGridItem
				v-if="Number(globalConfig?.inviteSendStatus) === 1"
				class="border rounded-sm p-3 dark:border-[#ffffff17]"
				:span="1"
			>
				<b class="text-[000]">Tips</b>
				<div class="flex flex-col text-[#707384]">
					<span
						v-html="
							$t('common.inviteRewardMessage', {
								model3Count: globalConfig.inviteGiveSendModel3Count,
								model4Count: globalConfig.inviteGiveSendModel4Count,
								mjCount: globalConfig.inviteGiveSendDrawMjCount,
							})
						"
					></span>
					<span
						v-html="
							$t('common.invitationRewardMessage', {
								model3Count: globalConfig.invitedGuestSendModel3Count,
								model4Count: globalConfig.invitedGuestSendModel4Count,
								mjCount: globalConfig.invitedGuestSendDrawMjCount,
							})
						"
					></span>
				</div>
			</NGridItem>
		</NGrid>
	</NCard>
	<NCard class="mt-5">
		<template #header>
			<div>{{ t('common.invitationRecord') }}</div>
		</template>
		<NDataTable
			:loading="regLoading"
			:remote="true"
			pagination-behavior-on-filter="first"
			class="min-h-[350px]"
			:columns="columns"
			:data="data"
			:pagination="paginationReg"
			:scroll-x="500"
		/>
	</NCard>
</template>
