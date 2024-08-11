<script lang="ts" setup>
import {
	NAvatar,
	NDataTable,
	NIcon,
	NInput,
	NInputGroup,
	NInputGroupLabel,
	NModal,
	NNumberAnimation,
	NPopover,
	NTabPane,
	NTabs,
	NTag,
	useMessage,
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { computed, h, onMounted, reactive, ref } from 'vue';
import { CloseOutline, ShareOutline } from '@vicons/ionicons5';
import DrawMoneyDialog from './components/drawMoneyDialog.vue';
import { TitleBar } from '@/components/base';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import qianbao from '@/assets/qianbao.png';
import { SvgIcon } from '@/components/common';
import { copyText } from '@/utils/format';
import { useAuthStore } from '@/store';
import BadgeImg from '@/assets/badge.png';
import { fetchGenInviteCodeAPI, fetchGetInviteRecordAPI } from '@/api/user';
import { fetchSalesAccountAPI, fetchSalesOrderAPI, fetchSalesRecordsAPI } from '@/api/sales';
import type { ResData } from '@/api/types';
import QRCode from '@/components/common/QRCode/index.vue';
import { t } from '@/locales';

interface InviteAccount {
	distributionBalance: number;
	drawMoneyIn: number;
	id: number;
	inviteCount: number;
	inviteLinkCount: number;
	orderCount: number;
	performanceRatio: number;
	salesOutletName: string;
	totalAmount: number;
	withdrawalAmount: number;
}
const inviteAccount = ref<InviteAccount>({
	distributionBalance: 0,
	drawMoneyIn: 0,
	id: 0,
	inviteCount: 0,
	inviteLinkCount: 0,
	orderCount: 0,
	performanceRatio: 0,
	salesOutletName: '',
	totalAmount: 0,
	withdrawalAmount: 0,
});

interface SalesRecords {
	orderId: number;
	orderPrice: string;
	commissionPercentage: string;
	commissionAmount: number;
	createdAt: Date;
	updatedAt: Date;
}

interface DrawMoneyOrder {
	auditStatus: number;
	withdrawalAmount: number;
	withdrawalChannels: number;
	remark: string;
	orderStatus: number;
	paymentStatus: number;
	createdAt: Date;
	contactInformation: string;
	auditUserId: number;
	auditUserName: string;
}

const drawMoneyVisibleDialog = ref(false);
const inviteDialog = ref(false);
const salesRecords = ref<SalesRecords[]>([]);
const drawMoneyOrders = ref<DrawMoneyOrder[]>([]);
const authStore = useAuthStore();
const globalConfig = computed(() => authStore.globalConfig);
const salesBaseRatio = computed(() =>
	globalConfig.value?.salesBaseRatio ? Number(globalConfig.value?.salesBaseRatio) : 10
);
const salesSeniorRatio = computed(() =>
	globalConfig.value?.salesSeniorRatio ? Number(globalConfig.value?.salesSeniorRatio) : 10
);
const tabRef = ref<HTMLDivElement | null>(null);
const tabValue = ref('rec');

interface InviteRecord {
	avatar: string;
	email: string;
	username: string;
	status: number;
	createdAt: Date;
}

/* 邀请码 */
const inviteCode = computed(() => authStore.userInfo.inviteCode);
const domain = computed(() => {
	let domain = `${window.location.protocol}//${window.location.hostname}`;
	if (window.location.port) domain += `:${window.location.port}`;
	return domain;
});
const inviteUrl = computed(() =>
	!inviteCode.value ? '**************' : `${domain.value}?inVitecode=${inviteCode.value}`
);

const ms = useMessage();
const selectable = ref<HTMLElement | null>(null);
const router = useRouter();
const data = ref([]);
const numberAnimationInstRef = ref(null);
const pagination = ref({ pageSize: 23 });
const inviteData = ref<any>([]);
const recLoading = ref(false);
const drawOrderLoading = ref(false);
const registerLoading = ref(false);

const paginationRec = reactive({
	page: 1,
	pageSize: 10,
	itemCount: 0,
	showSizePicker: true,
	pageSizes: [10, 20, 50],
	onChange: (page: number) => {
		paginationRec.page = page;
		querySalesRecords();
	},
	onUpdatePageSize: (pageSize: number) => {
		paginationRec.pageSize = pageSize;
		paginationRec.page = 1;
		querySalesRecords();
	},
});

const paginationOrder = reactive({
	page: 1,
	pageSize: 10,
	itemCount: 0,
	showSizePicker: true,
	pageSizes: [10, 20, 50],
	onChange: (page: number) => {
		paginationOrder.page = page;
		querySalesRecords();
	},
	onUpdatePageSize: (pageSize: number) => {
		paginationOrder.pageSize = pageSize;
		paginationOrder.page = 1;
		querySalesRecords();
	},
});

const paginationReg = reactive({
	page: 1,
	pageSize: 10,
	itemCount: 0,
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

/* 推介记录 */
const recColumns = ref<any[]>([
	{
		title: t('common.orderAmount'),
		align: 'center',
		orderPrice: 'address',
		render(row: SalesRecords) {
			return `￥${row.orderPrice}` + t('common.yuan');
		},
	},
	{
		align: 'center',
		title: t('common.productType'),
		key: 'tags',
		render(row: SalesRecords) {
			return t('common.purchasePlan');
		},
	},
	{
		align: 'center',
		title: t('common.status'),
		key: 'status',
		render(row: SalesRecords) {
			return h(
				NTag,
				{
					type: 'success',
					size: 'small',
					round: true,
				},
				() => t('common.accountedFor')
			);
		},
	},
	{
		align: 'center',
		title: t('common.commissionRatio'),
		key: 'commissionAmount',
		render(row: SalesRecords) {
			return `${row.commissionPercentage}%`;
		},
	},
	{
		align: 'center',
		title: t('common.commission'),
		key: 'commissionAmount',
		render(row: SalesRecords) {
			return `￥${row.commissionAmount}` + t('common.yuan');
		},
	},
	{
		align: 'center',
		title: t('common.orderTime'),
		key: 'createdAt',
	},
]);

/* 移动tab到提现列表 */
function handleChangeTabDrawMoney() {
	// TODO获取提现列表
	tabValue.value = 'drawMoney';
	querySalesAccount();
	querySalesOrder();
}

/* 申请邀请码 */
async function genMyInviteCode() {
	const res: ResData = await fetchGenInviteCodeAPI();
	if (!res.data) return ms.error(res.message);
	ms.success(t('common.generateInvitationCodeSuccess'));
	authStore.getUserInfo();
}

/* 二维码邀请链接 */
function qrcodeInvite() {
	inviteDialog.value = true;
}

/* 查询我的账户 */
async function querySalesAccount() {
	const res: ResData = await fetchSalesAccountAPI();
	inviteAccount.value = res.data;
}

/* 切换tab */
function handleUpdateValue(val: string) {
	val === 'drawMoney' && querySalesOrder();
	val === 'rec' && querySalesRecords();
	val === 'register' && queryInviteRecord();
}

/* 查询我的推介名单 */
async function querySalesRecords() {
	try {
		recLoading.value = true;
		const res: ResData = await fetchSalesRecordsAPI({
			page: paginationRec.page,
			size: paginationRec.pageSize,
		});
		salesRecords.value = res.data.rows;
		paginationRec.itemCount = res.data.count;
		recLoading.value = false;
	} catch (error) {
		recLoading.value = false;
	}
}

/* 查询我的提现工单 */
async function querySalesOrder() {
	try {
		drawOrderLoading.value = true;
		const res: ResData = await fetchSalesOrderAPI({
			page: paginationOrder.page,
			size: paginationOrder.pageSize,
		});
		paginationOrder.itemCount = res.data.count;
		drawMoneyOrders.value = res.data.rows;
		drawOrderLoading.value = false;
	} catch (error) {
		drawOrderLoading.value = false;
	}
}

const drawMoneyColums = ref<any[]>([
	{
		title: t('common.withdrawalTime'),
		key: 'createdAt',
		align: 'center',
	},
	{
		title: '提现金额',
		key: 'withdrawalAmount',
		align: 'center',
	},
	{
		title: '提现渠道',
		key: 'withdrawalChannels',
		align: 'center',
		render(row: DrawMoneyOrder) {
			return h(
				NTag,
				{
					type: row.withdrawalChannels === 1 ? 'info' : 'success',
					size: 'small',
					round: true,
				},
				() => (row.withdrawalChannels === 1 ? t('common.alipay') : t('common.wechat'))
			);
		},
	},
	{
		title: t('common.withdrawalStatus'),
		key: 'paymentStatus',
		render(row: DrawMoneyOrder) {
			return h(
				NTag,
				{
					type: row.paymentStatus === 1 ? 'success' : row.paymentStatus === -1 ? 'error' : 'info',
					size: 'small',
					round: true,
				},
				() =>
					row.paymentStatus === 1
						? t('common.paymentMade')
						: row.paymentStatus === -1
							? t('common.rejected')
							: t('common.underReview')
			);
		},
	},
	{
		title: '提现备注',
		key: 'contactInformation',
		align: 'center',
		render(row: DrawMoneyOrder) {
			return ` ${row?.contactInformation || '---'} `;
		},
	},
	{
		title: t('common.reviewer'),
		key: 'auditUserId',
		align: 'center',
		render(row: DrawMoneyOrder) {
			return ` ${row?.auditUserName || '---'} `;
		},
	},
]);

const regColums = ref<any[]>([
	{
		title: t('common.avatar'),
		align: 'center',
		key: 'avatar',
		render(row: InviteRecord) {
			return h(NAvatar, {
				src: row.avatar,
				round: true,
				size: 38,
				border: true,
			});
		},
	},
	{
		align: 'center',
		title: t('common.username'),
		key: 'username',
	},
	{
		align: 'center',
		title: t('common.email'),
		key: 'email',
	},
	{
		title: t('common.inviteeStatus'),
		align: 'center',
		key: 'status',
		render(row: InviteRecord) {
			return h(
				NTag,
				{
					type: row.status === 1 ? 'success' : 'error',
					size: 'small',
					round: true,
				},
				() => (row.status === 1 ? t('common.registered') : t('common.toBeActivated'))
			);
		},
	},
	{
		title: t('common.registrationTime'),
		align: 'center',
		key: 'createdAt',
	},
	{
		title: t('common.lastLogin'),
		align: 'center',
		key: 'updatedAt',
	},
]);

const { isMobile } = useBasicLayout();

/* 获取邀请记录 */
async function queryInviteRecord() {
	try {
		registerLoading.value = true;
		const res: ResData = await fetchGetInviteRecordAPI({
			page: paginationReg.page,
			size: paginationReg.pageSize,
		});
		inviteData.value = res.data.rows;
		paginationReg.itemCount = res.data.count;
		registerLoading.value = false;
	} catch (error) {
		registerLoading.value = false;
	}
}

/* 复制分享连接 */
function copyUrl() {
	if (!inviteCode.value) return ms.error(t('common.applyForInvitationCodeFirst'));
	copyText({ text: inviteUrl.value });
	ms.success(t('common.copyRecommendationLinkSuccess'));
	const element: any = selectable.value;
	const range = document.createRange();
	const selection: any = window.getSelection();
	range.selectNodeContents(element);
	selection.removeAllRanges();
	selection.addRange(range);
}

onMounted(() => {
	numberAnimationInstRef.value?.play();
	querySalesAccount();
	querySalesRecords();
});
</script>

<template>
	<div class="main bg-[#f8f8fb] min-h-screen bg-center dark:bg-[#2F2E34]">
		<TitleBar
			:class="[isMobile ? 'px-3' : 'px-14']"
			:title="t('common.promotionPlan')"
			:des="t('common.joinUsMessage')"
		/>
		<div class="flex-1 flex-wrap py-5 flex justify-between" :class="[isMobile ? 'px-3' : 'px-20']">
			<div class="px-[12px] min-w-[350px]" :class="[isMobile ? 'w-full' : 'w-1/3']">
				<!-- 我得账户 -->

				<div
					class="w-full bg-[#f78400] p-6 flex flex-col justify-between rounded shadow-xl relative"
				>
					<div class="absolute right-4 top-6 font-bold text-base opacity-60 text-[#eee] flex">
						{{ inviteAccount?.salesOutletName || t('common.risingStarRecommendationOfficer') }}
						<img :src="BadgeImg" class="ml-2 w-6 h-6 opacity-50" />
					</div>
					<h2 class="text-[#fff] font-bold text-xl">{{ t('common.myRecommendations') }}</h2>
					<div class="leading-loose flex justify-between items-center py-5">
						<div class="text-[#fff]">
							<span class="font-bold text-4xl">
								<NNumberAnimation
									ref="numberAnimationInstRef"
									:from="0"
									:to="Number(inviteAccount?.totalAmount)"
									:active="true"
									:precision="2"
								/>
							</span>
							<span class="ml-3">{{ t('common.yuan') }}</span>
						</div>
						<img :src="qianbao" class="w-20 opacity-10" alt="" />
					</div>
					<div class="flex justify-between text-[#fff] items-center">
						<div class="flex flex-col">
							<div class="flex items-end">
								<span class="font-bold text-xl">{{ inviteAccount?.distributionBalance || 0 }}</span>
								<span class="ml-2">{{ t('common.yuan') }}</span>
							</div>
							<div>{{ t('common.remainingWithdrawableAmount') }}</div>
						</div>
						<div class="flex flex-col">
							<div class="flex items-end">
								<span class="font-bold text-xl">{{ inviteAccount?.drawMoneyIn || 0 }}</span>
								<span class="ml-2">{{ t('common.yuan') }}</span>
							</div>
							<div>{{ t('common.withdrawingAmount') }}</div>
						</div>
						<div>
							<NPopover
								placement="top"
								trigger="hover"
								:delay="inviteAccount?.distributionBalance > 10 ? 800 : 200"
							>
								<template #trigger>
									<div
										class="btn"
										:class="[
											inviteAccount?.distributionBalance < Number(salesBaseRatio) ? 'disabled' : '',
										]"
										@click="drawMoneyVisibleDialog = true"
									>
										{{ t('common.withdrawImmediately') }}
									</div>
								</template>
								<span>最低{{ Number(globalConfig?.salesAllowDrawMoney) || 10 }}元可提现!</span>
							</NPopover>
						</div>
					</div>
				</div>

				<!-- 数据统计 -->
				<div class="flex flex-col bg-[#fff] mt-5 rounded dark:bg-[#24272e] px-2">
					<div class="flex p-4 justify-between border-b dark:border-[#3a3a40]">
						<div class="flex item-center">
							<SvgIcon class="text-lg" icon="icon-park-outline:order" />
							<span class="ml-2">{{ t('common.orderQuantity') }}</span>
						</div>
						<b class="text-base">{{ inviteAccount?.orderCount || 0 }}</b>
					</div>
					<div class="flex p-4 justify-between border-b dark:border-[#3a3a40]">
						<div class="flex item-center">
							<SvgIcon class="text-lg" icon="ep:link" />
							<span class="ml-2">{{ t('common.promotionalLinkVisits') }}</span>
						</div>
						<b class="text-base">{{ inviteAccount?.inviteLinkCount || 0 }}</b>
					</div>
					<div class="flex p-4 justify-between">
						<div class="flex item-center">
							<SvgIcon class="text-lg" icon="ph:user" />
							<span class="ml-2">{{ t('common.registeredUser') }}</span>
						</div>
						<b class="text-base">{{ inviteAccount?.inviteCount || 0 }}</b>
					</div>
				</div>

				<!-- 推荐收益 -->
				<div class="flex flex-col bg-[#fff] mt-5 rounded dark:bg-[#24272e] px-2">
					<div class="py-6 px-4 flex justify-between items-center">
						<div class="flex flex-col">
							<h3 class="text-base">{{ t('common.promotionEarnings') }}</h3>
							<div class="text-[#999] text-xs mt-2">
								{{ t('common.commissionAfterUserRegistration') }}
							</div>
						</div>
						<NTag round :bordered="false" type="success" size="small">
							{{ t('common.percentage') + ' ' + salesBaseRatio }}%
						</NTag>
					</div>
					<div class="py-6 px-4 flex justify-between items-center">
						<div class="flex flex-col">
							<h3 class="text-base">{{ t('common.applyForSeniorAgent') }}</h3>
							<div class="text-[#999] text-xs mt-2">{{ t('common.contactAdminMessage') }}</div>
						</div>
						<NTag round :bordered="false" type="success" size="small">
							{{ t('common.percentage') + ' ' + salesSeniorRatio }}%
						</NTag>
					</div>
					<div class="py-6 px-4 flex justify-between items-center">
						<div class="flex flex-col">
							<h3 class="text-base">{{ t('common.becomePartner') }}</h3>
							<div class="text-[#999] text-xs mt-2">{{ t('common.becomePartnerMessage') }}</div>
						</div>
						<NTag round :bordered="false" type="error" size="small">
							{{ t('common.winWinCooperation') }}
						</NTag>
					</div>
				</div>
			</div>

			<div class="px-[12px]" :class="[isMobile ? 'w-full' : 'w-2/3']">
				<!-- 推荐链接 -->
				<div class="bg-[#fff] dark:bg-[#24272e] p-5 rounded flex">
					<div class="w-full flex">
						<div
							class="border border-[ced4da] dark:border-[#3a3a40] text-sm py-1 rounded-l-md flex items-center"
							:class="[isMobile ? 'px-1' : 'px-3']"
						>
							{{ t('common.recommendationLink') }}：
						</div>
						<!-- <NInput value="https://www.asiayun.com/aff/KOSLCAQV" disabled :style="{ width: '500px' }" /> -->
						<div
							ref="selectable"
							class="bg-[#fafafa] dark:bg-[#2F2E34] flex-1 flex items-center dark:border-[#ffffff17] border-b border-t pl-4 max-w-[500px] select-text overflow-x-hidden whitespace-nowrap"
						>
							{{ inviteUrl }}
						</div>
						<div
							v-if="!inviteCode"
							:class="[isMobile ? 'px-2' : 'px-5']"
							class="cursor-pointer hover:text-[#5A91FC] transition-all border dark:border-[#ffffff17] flex items-center mr-[-1px] select-none"
							@click="genMyInviteCode"
						>
							{{ t('common.apply') }}
						</div>
						<div
							v-if="inviteCode"
							:class="[isMobile ? 'px-2' : 'px-5']"
							class="cursor-pointer hover:text-[#5A91FC] transition-all border dark:border-[#ffffff17] flex items-center mr-[-1px]"
						>
							<SvgIcon class="text-lg" icon="fluent:document-copy-48-regular" @click="copyUrl" />
						</div>
						<div
							v-if="!isMobile && inviteCode"
							class="cursor-pointer hover:text-[#5A91FC] transition-all border dark:border-[#ffffff17] flex items-center px-5 bg-currentrounded-r-md"
							@click="qrcodeInvite"
						>
							<SvgIcon class="text-lg" icon="la:qrcode" />
						</div>
					</div>
				</div>

				<!-- 推荐记录 -->
				<div class="mt-5 bg-[#fff] p-5 dark:bg-[#24272e]">
					<NTabs
						ref="tabRef"
						v-model:value="tabValue"
						:bar-width="338"
						animated
						justify-content="space-evenly"
						type="line"
						@update:value="handleUpdateValue"
					>
						<NTabPane name="rec" :tab="t('common.recommendationRecord')">
							<div class="pt-5">
								<NDataTable
									:min-width="200"
									:loading="recLoading"
									:remote="true"
									pagination-behavior-on-filter="first"
									class="min-h-[350px]"
									:columns="recColumns"
									:data="salesRecords"
									:pagination="paginationRec"
									:scroll-x="700"
								/>
							</div>
						</NTabPane>
						<NTabPane name="drawMoney" :tab="t('common.withdrawalRecord')">
							<div class="pt-5">
								<NDataTable
									:loading="drawOrderLoading"
									:remote="true"
									pagination-behavior-on-filter="first"
									class="min-h-[350px]"
									:columns="drawMoneyColums"
									:data="drawMoneyOrders"
									:pagination="paginationOrder"
									:scroll-x="500"
								/>
							</div>
						</NTabPane>
						<NTabPane name="register" :tab="t('common.registeredUser')">
							<div class="pt-5">
								<NDataTable
									:loading="registerLoading"
									:remote="true"
									pagination-behavior-on-filter="first"
									class="min-h-[350px]"
									:columns="regColums"
									:data="inviteData"
									:pagination="paginationReg"
									:scroll-x="500"
								/>
							</div>
						</NTabPane>
					</NTabs>
				</div>

				<!-- 提现 -->
				<DrawMoneyDialog
					:visible="drawMoneyVisibleDialog"
					@close="drawMoneyVisibleDialog = false"
					@submit="handleChangeTabDrawMoney"
				/>
			</div>
		</div>

		<NModal :show="inviteDialog" style="width: 90%; max-width: 420px">
			<div class="p-4 bg-white rounded dark:bg-slate-800">
				<div class="flex justify-between" @click="inviteDialog = false">
					<div class="flex text-base mb-[20px] bg-currentflex items-center">
						<NIcon size="22" color="#0e7a0d">
							<ShareOutline />
						</NIcon>
						<span class="ml-[8px] mt-2">{{ t('common.inviteFriendsPromotionMessage') }}</span>
					</div>
					<NIcon size="20" color="#0e7a0d" class="cursor-pointer">
						<CloseOutline />
					</NIcon>
				</div>
				<div class="w-full flex mb-5 px-6">
					<NInputGroup>
						<NInputGroupLabel size="small"> {{ t('common.invitationLink') }} </NInputGroupLabel>
						<NInput size="small" :style="{ flex: 1 }" :value="inviteUrl" />
						<NInputGroupLabel size="small" @click="copyUrl">
							<div>{{ t('common.copy') }}</div>
						</NInputGroupLabel>
					</NInputGroup>
				</div>

				<div class="flex justify-center items-center">
					<QRCode :value="inviteUrl" :size="240" />
				</div>
				<div class="flex flex-col p-5 justify-center">
					<span class="text-center"> 1. {{ t('common.inviteFriendsRewardMessage') }} </span>
					<span class="text-center">
						2. 邀请好友充值，您可获得充值金额的{{ salesBaseRatio || 10 }}%返佣
					</span>
				</div>
			</div>
		</NModal>
	</div>
</template>

<style lang="less">
.btn {
	user-select: none;
	padding: 4px 12px;
	background-color: #fff;
	opacity: 0.65;
	color: #f7a200;
	cursor: pointer;
	border-radius: 3px;
	&:hover {
		opacity: 0.9;
	}
}

.disabled {
	cursor: not-allowed !important;
	&:hover {
		opacity: 0.65 !important;
	}
}
</style>
