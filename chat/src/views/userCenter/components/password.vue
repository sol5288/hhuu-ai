<script setup lang="ts">
import type { FormInst, FormItemInst, FormItemRule, FormRules } from 'naive-ui';
import { NButton, NCard, NForm, NFormItem, NGrid, NGridItem, NInput, useMessage } from 'naive-ui';
import { ref } from 'vue';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { useAuthStore } from '@/store';
import { fetchUpdatePasswordAPI } from '@/api';
import type { ResData } from '@/api/types';
import { t } from '@/locales';

interface ModelType {
	oldPassword: string;
	password: string;
	reenteredPassword: string;
}

const modelRef = ref<ModelType>({
	oldPassword: '',
	password: '',
	reenteredPassword: '',
});
const model = modelRef;

const formRef = ref<FormInst | null>(null);

const rPasswordFormItemRef = ref<FormItemInst | null>(null);

const rules: FormRules = {
	oldPassword: [
		{
			required: true,
			min: 6,
			message: t('common.passwordMinLength'),
			trigger: ['blur'],
		},
		{
			required: true,
			max: 30,
			message: t('common.passwordMaxLength'),
			trigger: ['blur'],
		},
	],
	password: [
		{
			required: true,
			message: t('common.enterPassword'),
		},
	],
	reenteredPassword: [
		{
			required: true,
			message: t('common.reenterPassword'),
			trigger: ['input', 'blur'],
		},
		{
			validator: validatePasswordStartWith,
			message: t('common.passwordMismatch'),
			trigger: 'input',
		},
		{
			validator: validatePasswordSame,
			message: t('common.passwordMismatch'),
			trigger: ['blur', 'password-input'],
		},
	],
};
function validatePasswordStartWith(rule: FormItemRule, value: string): boolean {
	return (
		!!modelRef.value.password &&
		modelRef.value.password.startsWith(value) &&
		modelRef.value.password.length >= value.length
	);
}
function validatePasswordSame(rule: FormItemRule, value: string): boolean {
	return value === modelRef.value.password;
}
function handlePasswordInput() {
	if (modelRef.value.reenteredPassword)
		rPasswordFormItemRef.value?.validate({ trigger: 'password-input' });
}

const { isSmallXl } = useBasicLayout();
const authStore = useAuthStore();
const ms = useMessage();

async function updatePassword(options: { oldPassword: string; password: string }) {
	const res: ResData = await fetchUpdatePasswordAPI(options);
	if (res.success) ms.success(t('common.passwordUpdateSuccess'));
	resetForm();
	authStore.updatePasswordSuccess();
}

function resetForm() {
	modelRef.value = {
		oldPassword: '',
		password: '',
		reenteredPassword: '',
	};
}

function handleValidate(e: MouseEvent) {
	e.preventDefault();
	formRef.value?.validate(async (errors) => {
		if (!errors) {
			const { oldPassword, password } = modelRef.value;
			updatePassword({ oldPassword, password });
		}
	});
}
</script>

<template>
	<NCard>
		<template #header>
			<div>{{ t('common.changePassword') }}</div>
		</template>
		<NGrid :x-gap="24" :y-gap="24" :cols="isSmallXl ? 1 : 3" class="mt-3">
			<NGridItem class="border rounded-sm p-3 dark:border-[#ffffff17]" span="2">
				<NForm ref="formRef" :model="model" :rules="rules">
					<NFormItem path="oldPassword" :label="t('common.oldPassword')">
						<NInput v-model:value="model.oldPassword" @keydown.enter.prevent />
					</NFormItem>
					<NFormItem path="password" :label="t('common.newPassword')">
						<NInput
							v-model:value="model.password"
							type="password"
							@input="handlePasswordInput"
							@keydown.enter.prevent
						/>
					</NFormItem>
					<NFormItem
						ref="rPasswordFormItemRef"
						first
						path="reenteredPassword"
						:label="t('common.confirmPassword')"
					>
						<NInput
							v-model:value="model.reenteredPassword"
							:disabled="!model.password"
							type="password"
							tabindex="0"
							@keyup.enter="handleValidate"
						/>
					</NFormItem>

					<div class="flex justify-between">
						<span class="text-[#95AAC9]">{{ t('common.passwordUpdateMessage') }}</span>
						<NButton :disabled="model.oldPassword === null" type="primary" @click="handleValidate">
							{{ t('common.updatePassword') }}
						</NButton>
					</div>
				</NForm>
			</NGridItem>
			<NGridItem
				class="border rounded-sm p-3 bg-[#f8f9fa] h-48 dark:bg-[#18181c] dark:border-[#ffffff17]"
			>
				<b class="text-base">{{ t('common.passwordRequirements') }}</b>
				<p class="text-[#95AAC9] mt-3">{{ t('common.newPasswordRequirements') }}</p>
				<div class="ml-3 text-[#95AAC9] mt-2">{{ t('common.minSixCharacters') }}</div>
				<div class="ml-3 text-[#95AAC9] mt-2">{{ t('common.maxThirtyCharacters') }}</div>
				<div class="ml-3 text-[#95AAC9] mt-2">{{ t('common.atLeastOneNumber') }}</div>
			</NGridItem>
		</NGrid>
	</NCard>
</template>
