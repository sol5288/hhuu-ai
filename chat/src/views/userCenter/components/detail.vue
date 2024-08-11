<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NAvatar, NButton } from 'naive-ui';
import { useAuthStore, useGlobalStoreWithOut } from '@/store';
import defaultAvatar from '@/assets/avatar.png';
import { t } from '@/locales';

const authStore = useAuthStore();
const router = useRouter();

const { userBalance } = authStore;
const useGlobalStore = useGlobalStoreWithOut();
const email = computed(() => authStore.userInfo.email || '');
const isBindWx = computed(() => authStore.userInfo.isBindWx);
const avatar = ref(authStore.userInfo.avatar ?? defaultAvatar);
const username = ref(authStore.userInfo.username ?? t('common.notLoggedIn'));
const sign = ref(authStore.userInfo.sign ?? t('common.aiIntroduction'));

function logOut() {
	authStore.logOut();
	router.push('/');
}
const isLogin = computed(() => authStore.isLogin);
onMounted(() => {
	if (!isLogin.value) authStore.setLoginDialog(true);
});
</script>

<template>
	<div class="flex flex-col justify-center items-center">
		<div class="text-2xl text-primary self-start mb-3 flex justify-between w-full">
			<span>Profile</span>
			<NButton v-if="isLogin" tertiary type="error" @click="logOut">
				{{ t('common.logout') }}
			</NButton>
			<NButton v-if="!isLogin" tertiary type="success" @click="authStore.setLoginDialog(true)">
				{{ t('common.clickToLogin') }}
			</NButton>
		</div>
		<NAvatar :size="148" :src="avatar" :fallback-src="defaultAvatar" />
		<b class="mt-3 text-lg text-[#555]">{{ username }}</b>
		<span class="text-[#95aac9] mt-2"> {{ email }}</span>
		<div class="text-[#555] mt-3 px-4">
			{{ sign }}
		</div>

		<div class="self-start">
			<div class="flex pl-3 pt-3 text-base font-bold text-primary">
				<span>{{ t('common.myAccountBalance') }}</span>
			</div>
			<div
				v-if="userBalance.expirationTime"
				class="flex pl-3 pt-3 text-base font-bold text-primary"
			>
				<span>{{ t('common.membershipExpirationTime') }}：</span>
				<span>{{ userBalance.expirationTime }}</span>
			</div>

			<div class="flex items-center space-x-4 pl-3 mt-3">
				<span class="flex-shrink-0 w-24 text-primary">{{ t('common.basicModelBalance') }}:</span>
				<div class="w-[200px]">
					{{ userBalance.sumModel3Count || '0' }} {{ t('common.points') }}
				</div>
			</div>
			<div class="flex items-center space-x-4 pl-3 mt-3">
				<span class="flex-shrink-0 w-24 text-primary">{{ t('common.advancedModelBalance') }}:</span>
				<div class="w-[200px]">
					{{ userBalance.sumModel4Count || '0' }} {{ t('common.points') }}
				</div>
			</div>
			<div class="flex items-center space-x-4 pl-3 mt-3">
				<span class="flex-shrink-0 w-24 text-primary">{{ t('common.drawingBalance') }}:</span>
				<div class="w-[200px]">
					{{ userBalance.sumDrawMjCount || '0' }} {{ t('common.points') }}
				</div>
			</div>

			<div class="flex items-center space-x-4 pl-3 mt-3">
				<span class="flex-shrink-0 w-24 text-primary">{{ t('common.bindWechat') }}:</span>
				<div class="w-[200px]">
					<NButton v-if="!isBindWx" text @click="useGlobalStore.updateBindwxDialog(true)">
						{{ t('common.clickToBindWechat') }}
					</NButton>
					<span v-else>{{ t('common.wechatBound') }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
