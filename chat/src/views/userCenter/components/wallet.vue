<script setup lang="ts">
import {
	NButton,
	NCard,
	NDataTable,
	NDrawer,
	NDrawerContent,
	NGrid,
	NGridItem,
	NInput,
	NSpace,
	useDialog,
	useMessage,
} from 'naive-ui';
import { computed, onMounted, reactive, ref } from 'vue';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { useAuthStore } from '@/store';
import { fetchGetRechargeLogAPI } from '@/api/balance';
import { fetchGetPackageAPI, fetchUseCramiAPI } from '@/api/crami';
import { RechargeTypeMap } from '@/constants';
import type { ResData } from '@/api/types';
import { t } from '@/locales';
const { isSmallMd, isMobile } = useBasicLayout();
const authStore = useAuthStore();
const ms = useMessage();
const dialog = useDialog();
interface RechargeLog {
	uid: string;
	rechargeType: number;
	usesLeft: number;
	paintCount: number;
	balance: number;
	createdAt: Date;
}

interface Rkg {
	name: string;
	coverImg: string;
	des: string;
	rechargeType: number;
	model3Count: number;
	model4Count: number;
	drawMjCount: number;
	expireDateCn: string;
	createdAt: Date;
	price: number;
}

const userBalance = computed(() => authStore.userBalance);
const loading = ref(false);
const code = ref('');
const showDrawer = ref(false);
const packageList = ref<Rkg[]>([]);
const rechargeLoading = ref(false);

const paginationReg = reactive({
	page: 1,
	pageSize: 10,
	showSizePicker: true,
	pageSizes: [10, 20, 50],
	onChange: (page: number) => {
		paginationReg.page = page;
		queryRechargeLog();
	},
	onUpdatePageSize: (pageSize: number) => {
		paginationReg.pageSize = pageSize;
		paginationReg.page = 1;
		queryRechargeLog();
	},
});

const columns = computed(() => {
	return [
		{
			title: t('common.orderNumber'),
			key: 'uid',
		},
		{
			title: t('common.rechargeType'),
			key: 'rechargeType',
			render(row: RechargeLog) {
				return RechargeTypeMap[row.rechargeType];
			},
		},
		{
			title: t('common.basicModelQuota'),
			key: 'model3Count',
		},
		{
			title: t('common.advancedModelQuota'),
			key: 'model4Count',
		},
		{
			title: 'MJ' + t('common.drawingQuota'),
			key: 'drawMjCount',
		},
		{
			title: t('common.validityPeriod'),
			key: 'expireDateCn',
		},
		{
			title: t('common.rechargeTime'),
			key: 'createdAt',
			render(row: RechargeLog) {
				return row.createdAt;
			},
		},
	];
});

const data = ref([]);

async function queryRechargeLog() {
	const res: ResData = await fetchGetRechargeLogAPI({
		page: paginationReg.page,
		size: paginationReg.pageSize,
	});
	const { rows } = res.data;
	data.value = rows;
}

async function useCrami() {
	if (!code.value) return ms.warning(t('common.pleaseEnterCardCode'));
	try {
		loading.value = true;
		await fetchUseCramiAPI({ code: code.value });
		ms.success(t('common.cardKeyExchangeSuccess'));
		queryRechargeLog();
		authStore.getUserInfo();
		loading.value = false;
	} catch (error) {
		loading.value = false;
	}
}

function openDrawer() {
	showDrawer.value = true;
}

async function openDrawerAfter() {
	const res: ResData = await fetchGetPackageAPI({ status: 1, size: 30 });
	packageList.value = res.data.rows;
}

const buyCramiAddress = computed(() => authStore.globalConfig?.buyCramiAddress);

function buyPackage() {
	window.open(buyCramiAddress.value);
}

onMounted(() => {
	queryRechargeLog();
});
</script>

<template>
	<div class="flex h-full flex-col">
		<NCard>
			<template #header>
				<div>{{ t('common.userWalletBalance') }}</div>
			</template>
			<NGrid :x-gap="24" :y-gap="24" :cols="isSmallMd ? 1 : 2" class="mt-3">
				<NGridItem class="border dark:border-[#ffffff17] rounded-sm p-3">
					<div class="text-[#95aac9] mb-2 text-base">{{ t('common.basicModelBalance') }}</div>
					<b class="text-3xl text-[#555]">{{ userBalance.sumModel3Count ?? 0 }}</b>
					<span class="ml-4 text-[#989898]">{{ t('common.differentModelConsumption') }}</span>
				</NGridItem>
				<NGridItem class="border dark:border-[#ffffff17] rounded-sm p-3">
					<div class="text-[#95aac9] mb-2 text-base">{{ t('common.advancedModelBalance') }}</div>
					<b class="text-3xl text-[#555]">{{ userBalance.sumModel4Count ?? 0 }}</b>
					<span class="ml-4 text-[#989898]">{{
						t('common.differentModelConsumption')
					}}</span> </NGridItem
				><NGridItem class="border dark:border-[#ffffff17] rounded-sm p-3">
					<div class="text-[#95aac9] mb-2 text-base">{{ t('common.drawingBalance') }}</div>
					<b class="text-3xl text-[#555]">{{ userBalance.sumDrawMjCount ?? 0 }}</b>
					<span class="ml-4 text-[#989898]">{{
						t('common.differentDrawingConsumption')
					}}</span> </NGridItem
				><NGridItem class="border dark:border-[#ffffff17] rounded-sm p-3">
					<div class="text-[#95aac9] mb-2 text-base">{{ t('common.cardKeyRecharge') }}</div>
					<NSpace :wrap="false">
						<NInput
							v-model:value="code"
							:placeholder="t('common.pasteOrEnterCardInfo')"
							class="mr-3"
							maxlength="128"
							show-count
							clearable
						/>

						<NButton type="primary" :loading="loading" @click="useCrami">
							{{ t('common.exchange') }}
						</NButton>
						<NButton v-if="buyCramiAddress" type="success" @click="openDrawer">
							{{ t('common.buyCardKey') }}
						</NButton>
					</NSpace>
				</NGridItem>
			</NGrid>
		</NCard>
		<NCard class="mt-5 flex-1">
			<template #header>
				<div>{{ t('common.rechargeRecord') }}</div>
			</template>
			<NDataTable
				:columns="columns"
				:loading="rechargeLoading"
				:scroll-x="800"
				:data="data"
				max-height="280"
				:pagination="paginationReg"
			/>
		</NCard>
		<NDrawer
			v-model:show="showDrawer"
			:width="isSmallMd ? '100%' : 502"
			:on-after-enter="openDrawerAfter"
		>
			<NDrawerContent :title="t('common.purchasePackage')" closable>
				<NGrid :x-gap="15" :y-gap="15" :cols="isSmallMd ? 1 : 2" class="mt-3">
					<NGridItem v-for="(item, index) in packageList" :key="index">
						<NCard size="small" embedded>
							<template #header>
								<div class="relative">
									<b>{{ item.name }}</b>
								</div>
							</template>
							<template #cover>
								<img :src="item.coverImg" />
							</template>
							<div>
								<p>{{ item.des }}</p>
								<div class="flex justify-between items-end min-h-28">
									<span class="text-sm font-bold mr-1">{{ t('common.basicModelQuota') }}</span>
									<span class="font-bold">{{ item.model3Count }}</span>
								</div>
								<div class="flex justify-between items-end min-h-28">
									<span class="text-sm font-bold mr-1">{{ t('common.advancedModelQuota') }}</span>
									<span class="font-bold">{{ item.model4Count }}</span>
								</div>
								<div class="flex justify-between items-end min-h-28">
									<span class="text-sm font-bold mr-1">{{ t('common.drawingQuota') }}</span>
									<span class="font-bold">{{ item.drawMjCount }}</span>
								</div>
								<div class="flex justify-between items-end mt-5">
									<i class="text-xl text-[red] font-bold">{{ `￥${item.price}` }}</i>
									<NButton type="primary" dashed size="small" @click="buyPackage">
										{{ t('common.purchasePlan') }}
									</NButton>
								</div>
							</div>
						</NCard>
					</NGridItem>
				</NGrid>
			</NDrawerContent>
		</NDrawer>
	</div>
</template>
