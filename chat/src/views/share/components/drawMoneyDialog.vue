<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';
import {
	NButton,
	NForm,
	NFormItem,
	NIcon,
	NInput,
	NInputNumber,
	NModal,
	NSelect,
	useMessage,
} from 'naive-ui';
import { ref } from 'vue';
import { CloseOutline } from '@vicons/ionicons5';
import { fetchAppforMoneyAPI } from '../../../api/sales';
import type { ResData } from '@/api/types';
import { t } from '@/locales';
defineProps<Props>();
const emit = defineEmits<Emit>();
interface Emit {
	(e: 'close'): void;
	(e: 'submit'): void;
}
interface Props {
	visible: boolean;
}
const formRef = ref<FormInst | null>(null);
const message = useMessage();
const options = [
	{
		label: t('common.alipay'),
		value: 1,
	},
	{
		label: t('common.wechat'),
		value: 2,
	},
];

const getDefaultForm = () => {
	return {
		withdrawalAmount: null,
		withdrawalChannels: null,
		contactInformation: '',
		remark: '',
	};
};

const orderForm = ref(getDefaultForm());

const loading = ref(false);

const rules: FormRules = {
	withdrawalAmount: [{ required: true, message: t('common.enterWithdrawalAmount') }],
	withdrawalChannels: [{ required: true, message: t('common.chooseWithdrawalChannel') }],
	contactInformation: [
		{ required: true, message: t('common.fillYourContactInfoWithRemark'), trigger: 'blur' },
	],
	remark: [{ required: false, message: t('common.specialCircumstancesNote'), trigger: 'blur' }],
};

/* 重置表单 */
function resetForm() {
	orderForm.value = getDefaultForm();
}

function handlerSubmit() {
	formRef.value?.validate(async (errors) => {
		if (!errors) {
			try {
				loading.value = true;
				const { withdrawalAmount, withdrawalChannels, contactInformation, remark } =
					orderForm.value;
				const res: ResData = await fetchAppforMoneyAPI({
					withdrawalAmount,
					withdrawalChannels,
					contactInformation,
					remark,
				});
				if (res.success) {
					message.success(t('common.withdrawalApplicationSuccess'));
					resetForm();
					emit('submit');
					emit('close');
				}

				loading.value = false;
			} catch (error) {
				loading.value = false;
			}
		}
	});
}

function openDialog() {}

function handleCloseDialog() {}

function handleClose() {
	emit('close');
}
</script>

<template>
	<NModal
		:show="visible"
		style="width: 90%; max-width: 500px"
		:on-after-enter="openDialog"
		:on-after-leave="handleCloseDialog"
	>
		<div class="p-5 bg-white rounded dark:bg-slate-800">
			<span class="text-lg"> {{ t('common.withdrawalApplicationForm') }} </span>
			<div class="absolute top-3 right-3 cursor-pointer z-30" @click="handleClose">
				<NIcon size="20" color="#0e7a0d">
					<CloseOutline />
				</NIcon>
			</div>
			<div class="pt-5">
				<NForm
					ref="formRef"
					:model="orderForm"
					:rules="rules"
					label-placement="left"
					label-width="auto"
					require-mark-placement="right-hanging"
					:style="{
						maxWidth: '640px',
					}"
				>
					<NFormItem path="withdrawalAmount" :label="t('common.withdrawalAmount')">
						<NInputNumber
							v-model:value="orderForm.withdrawalAmount"
							class="w-full"
							clearable
							:precision="2"
							:placeholder="t('common.enterWithdrawalAmount2')"
						/>
					</NFormItem>
					<NFormItem path="withdrawalChannels" :label="t('common.withdrawalChannel')">
						<NSelect
							v-model:value="orderForm.withdrawalChannels"
							:placeholder="t('common.selectWithdrawalChannel')"
							:options="options"
						/>
					</NFormItem>
					<NFormItem path="contactInformation" :label="t('common.contactInfo')">
						<NInput
							v-model:value="orderForm.contactInformation"
							type="textarea"
							:rows="3"
							:placeholder="t('common.fillYourContactInfo')"
						/>
					</NFormItem>
					<NFormItem path="remark" :label="t('common.withdrawalRemark')">
						<NInput
							v-model:value="orderForm.remark"
							type="textarea"
							:rows="3"
							:placeholder="t('common.enterWithdrawalRemark')"
						/>
					</NFormItem>

					<NFormItem class="mt-3">
						<NButton
							block
							type="primary"
							:disabled="loading"
							:loading="loading"
							@click="handlerSubmit"
						>
							{{ t('common.applyForWithdrawal') }}
						</NButton>
					</NFormItem>
				</NForm>
			</div>
		</div>
	</NModal>
</template>
