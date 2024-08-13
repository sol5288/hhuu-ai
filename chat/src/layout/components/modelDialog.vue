<script setup lang="ts">
import {
	NCountdown,
	NIcon,
	NImage,
	NModal,
	NSkeleton,
	NSpin,
	useMessage,
	NInput,
	NSelect,
	NCascader,
	NCollapse,
	NCollapseItem,
	NButton,
	NSlider,
	NTooltip,
	NTag,
} from 'naive-ui';
import { ref, onMounted, computed, watch, h } from 'vue';
import { CloseOutline, SettingsOutline } from '@vicons/ionicons5';
import { fetchQueryModelsListAPI } from '@/api/models';
import { useAuthStore, useGlobalStoreWithOut, useChatStore } from '@/store';
import { fetchUpdateGroupAPI } from '@/api/group';
import { useI18n } from 'vue-i18n';

defineProps<Props>();
interface ModelType {
	label: string;
	val: number;
}

const { t } = useI18n();

const useGlobalStore = useGlobalStoreWithOut();
const authStore = useAuthStore();
const chatStore = useChatStore();
const loading = ref(false);

/* 현재 대화 그룹의 설정 정보 */
const activeConfig = computed(() => {
	return chatStore.activeConfig;
});

const activeGroupAppId = computed(() => chatStore.activeGroupAppId);

/* openai 모델이 아닌 경우 임시로 프리셋 설정을 허용하지 않음 */
const disabled = computed(() => {
	return Number(activeConfig.value?.modelTypeInfo?.val) !== 1 || Number(activeGroupAppId.value) > 0;
});

/* 온도 */
const maxTemperature = computed(() => {
	return Number(chatStore.activeModelKeyType) === 1 ? 1.2 : 1;
});

/* 현재 대화 그룹 ID */
const chatGroupId = computed(() => chatStore.active);

watch(activeConfig, (val) => {
	if (!val) return;
	compilerConfig(val);
});

const maxModelTokens = ref(0);
const maxResponseTokens = ref(0);
const topN = ref(0.8);
const modelTypes = ref<ModelType[]>([]);
const model = ref('');
const systemMessage = ref('');
const maxRounds = ref();
const rounds = ref(8);

interface Props {
	visible: boolean;
}

const message = useMessage();
const showResetBtn = ref(false);
let modelMapsCache: any = ref({});
let modelTypeListCache: any = ref([]);

onMounted(() => {
	queryModelsList();
});

function compilerConfig(val: any) {
	const { modelInfo, modelTypeInfo } = val;
	if (!modelInfo || !modelTypeInfo) return;
	maxModelTokens.value = modelInfo.maxModelTokens;
	maxResponseTokens.value = modelInfo.maxResponseTokens;
	topN.value = modelInfo.topN;
	systemMessage.value = modelInfo.systemMessage;
	model.value = `${modelTypeInfo.val}----${modelInfo.model}`;
	maxRounds.value = modelInfo.maxRounds;
	rounds.value = modelInfo.rounds > modelInfo.maxRounds ? modelInfo.maxRounds : modelInfo.rounds;
}

/* 애플리케이션은 openai 모델만 사용 가능 */
const options = computed(() => {
	const data = !activeGroupAppId.value
		? modelTypeListCache
		: modelTypeListCache.filter((item: any) => Number(item.val) === 1);
	return data.map((item: any) => {
		const { label, val } = item;
		return {
			label,
			value: val,
			children: modelMapsCache[val].map((item: any) => {
				const { model, modelName } = item;
				return {
					label: modelName,
					value: `${val}----${model}`,
				};
			}),
		};
	});
});

async function queryModelsList() {
	try {
		const res: any = await fetchQueryModelsListAPI();
		if (!res.success) return;
		const { modelMaps, modelTypeList } = res.data;
		modelMapsCache = modelMaps;
		modelTypeListCache = modelTypeList;
		// options.value = modelTypeList.map((item: any) => {
		// 	const { label, val } = item
		// 	return {
		// 		label,
		// 		value: val,
		// 		children: modelMaps[val].map((item: any) => {
		// 			const { model, modelName } = item
		// 			return {
		// 				label: modelName,
		// 				value: `${val}----${model}`
		// 			}
		// 		})
		// 	}
		// })
		modelTypes.value = modelTypeList;
		// const typeValue = modelTypes.value[0].val
		/* 设置默认为第一项 使用 ---- 分割  前面是 模型类型 后面是模型的名称  */
		// model.value = `${modelTypes.value[0].val}----${modelMaps[typeValue][0].model}`
	} catch (error) {
		console.log('오류: ', error);
	}
}

function openDialog() {
	queryModelsList();
}

async function handleReset() {
	const config = chatStore.baseConfig;
	compilerConfig(config);
}

function handleUpdate(val: any) {
	showResetBtn.value = val.includes('1');
}

/* 모델의 개별 정보 가져오기 */
function getModelTypeInfo(type: any) {
	return modelTypeListCache.find((item: any) => item.val === type);
}

/* 모델 이름 가져오기 */
function getModelDetailInfo(type: any, model: any) {
	return modelMapsCache[type].find((item: any) => item.model === model);
}

/* 대화 그룹 모델 설정 수정 */
async function handleUpdateConfig() {
	const [type, m] = model.value.split('----');
	const { maxModelTokens } = activeConfig.value.modelInfo;
	const selectModelInfo = getModelDetailInfo(type, m);
	const { modelName, deductType, deduct, maxRounds } = selectModelInfo;
	const config = {
		modelInfo: {
			keyType: type,
			modelName,
			model: m,
			maxModelTokens: maxModelTokens,
			maxResponseTokens: maxResponseTokens.value,
			systemMessage: systemMessage?.value,
			topN: topN.value,
			deductType,
			deduct,
			maxRounds,
			rounds: rounds.value,
		},
		modelTypeInfo: getModelTypeInfo(type),
	};

	const params = {
		groupId: chatGroupId.value,
		config: JSON.stringify(config),
	};

	try {
		loading.value = true;
		await fetchUpdateGroupAPI(params);
		loading.value = false;
		message.success(t('updateConfigSuccess'));
		await chatStore.queryMyGroup();
		useGlobalStore.updateModelDialog(false);
	} catch (error) {
		loading.value = false;
	}
}

function renderLabel(option: { value?: string | number; label?: string }) {
	return () =>
		h(NTooltip, { placement: 'bottom', trigger: 'hover' }, [
			h('template', { slot: 'trigger' }, h('span', null, option.label)),
			h('span', null, option.label),
		]);
	// return `prefix ${option.label}`
}

function handleCloseDialog() {
	showResetBtn.value = false;
}
</script>

<template>
	<NModal
		:show="visible"
		style="width: 90%; max-width: 650px"
		:on-after-enter="openDialog"
		:on-after-leave="handleCloseDialog"
	>
		<div class="py-3 px-5 bg-white rounded dark:bg-slate-800">
			<div
				class="absolute top-3 right-3 cursor-pointer"
				@click="useGlobalStore.updateModelDialog(false)"
			>
				<NIcon size="20" color="#0e7a0d">
					<CloseOutline />
				</NIcon>
			</div>
			<div class="flex font-bold mb-[20px] bg-currentflex items-center">
				<NIcon size="24" color="#0e7a0d">
					<SettingsOutline />
				</NIcon>

				<span class="ml-[8px] mt-1 text-lg">{{ t('modelPersonalization') }}</span>
			</div>

			<div class="flex justify-between items-center mt-6 pb-4">
				<span class="font-bold">{{ t('modelSelection') }}</span>
				<div style="max-width: 70%">
					<n-cascader
						class="w-full"
						v-model:value="model"
						:placeholder="t('selectModelPlaceholder')"
						expand-trigger="click"
						:options="options"
						check-strategy="child"
						:show-path="true"
						:filterable="false"
					/>
				</div>
			</div>

			<div>
				<div class="pb-1">{{ t('customRolePreset') }}</div>
				<n-input
					v-model:value="systemMessage"
					type="textarea"
					:disabled="disabled"
					:placeholder="t('customRolePresetPlaceholder')"
				/>
			</div>

			<div class="mt-5 bg-[#fafbfc] px-2 py-2 dark:bg-[#243147]">
				<n-collapse default-expanded-names="" accordion :on-update:expanded-names="handleUpdate">
					<n-collapse-item name="1">
						<template #header>
							<div>
								{{ t('advancedSettings') }}
								<span class="text-xs text-neutral-500">{{ t('advancedSettingsDescription') }}</span>
							</div>
						</template>
						<template #header-extra>
							<div @click.stop="handleReset">
								<NButton text type="error" v-if="showResetBtn"> {{ t('reset') }} </NButton>
							</div>
						</template>
						<div class="mt-2">
							<div>
								<div class="w-full flex justify-between">
									<span class="w-[150px]">{{ t('topicRandomness') }}</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="topN" :step="0.1" :max="maxTemperature" />
										<span class="w-[55px] text-right">
											{{ topN }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
									{{ t('topicRandomnessDescription') }}
								</div>
							</div>
							<div class="mt-4">
								<div class="w-full flex justify-between">
									<span class="w-[150px]">{{ t('replyTokenCount') }}</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="maxResponseTokens" :step="100" :max="maxModelTokens" />
										<span class="w-[55px] text-right">
											{{ maxResponseTokens }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
									{{ t('replyTokenCountDescription') }}
								</div>
							</div>
							<div class="mt-4">
								<div class="w-full flex justify-between">
									<span class="w-[150px]">{{ t('contextCount') }}</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="rounds" :step="1" :max="maxRounds" />
										<span class="w-[55px] text-right">
											{{ rounds }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
									{{ t('contextCountDescription') }}
								</div>
							</div>
						</div>
					</n-collapse-item>
				</n-collapse>
			</div>
			<div class="mt-4 flex items-center justify-end space-x-4">
				<NButton @click="useGlobalStore.updateModelDialog(false)"> {{ t('cancel') }} </NButton>
				<NButton type="primary" @click="handleUpdateConfig" :loading="loading">
					{{ t('save') }}
				</NButton>
			</div>
		</div>
	</NModal>
</template>
