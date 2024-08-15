<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import {
	NAlert,
	NAvatar,
	NButton,
	NEllipsis,
	NEmpty,
	NIcon,
	NImage,
	NInput,
	NInputGroup,
	NTabPane,
	NTabs,
	NTooltip,
	useMessage,
	useNotification,
} from 'naive-ui';
import { ImagesOutline } from '@vicons/ionicons5';
import { Search, UpdateRotation, ZoomIn } from '@icon-park/vue-next';
import { fetchGetAllChatLogDraw, fetchGetChatLogDraw } from '@/api';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { TitleBar } from '@/components/base';
import { useAppStore } from '@/store';
import type { ResData } from '@/api/types';
import { fetchMjDtawAPI, fetchUpscaleSingleImgAPI, fetchVariationSingleImgAPI } from '@/api/mjDraw';
import { t } from '@/locales';
const notification = useNotification();
const { isMobile } = useBasicLayout();
const appStore = useAppStore();

const index = ref(0);
const loading = ref(false);
const ms = useMessage();
const mineDrawList: any = ref([]);
const allDrawList: any = ref([]);
const imagesRefs = ref<any>({});
const darkMode = computed(() => appStore.theme === 'dark');

const drawSize = ref(4);

const exampleList = [t('common.futuristicWorld'), t('common.handsome'), t('common.cuteRabbit')];

const promptList = [
	t('common.ancientStyle'),
	t('common.anime'),
	t('common.realisticPhoto'),
	t('common.oilPainting'),
	t('common.watercolorPainting'),
	t('common.inkPainting'),
	t('common.blackAndWhiteWoodcut'),
	t('common.sculpture'),
	'3D' + t('common.model'),
	t('common.handDrawnSketch'),
	t('common.charcoalDrawing'),
	t('common.minimalisticLineDrawing'),
	t('common.cinematicFeel'),
	t('common.mechanicalFeel'),
];

const form = ref({
	prompt: '',
});

function updateEx() {
	index.value = index.value + 1 >= exampleList.length ? 0 : index.value + 1;
}

async function queryMyDrawList() {
	const res: ResData = await fetchGetChatLogDraw({ model: 'mj' });
	if (!res.success) return;
	mineDrawList.value = res.data;
}

async function queryAllDrawList() {
	const res: ResData = await fetchGetAllChatLogDraw({ size: 999, rec: 1, model: 'mj' });
	if (!res.success) return ms.error(res.message);
	allDrawList.value = res.data.rows;
}

function hasChinese(str: string) {
	return /[\u4E00-\u9FA5]+/g.test(str);
}

function hasAllChinese(str: string) {
	return /^[\u4E00-\u9FA5]+$/.test(str);
}

/* 绘制图片 */
async function drawImage() {
	if (!form.value.prompt) return ms.error(t('common.enterDetailedImageDescription'));
	// const isHas = hasChinese(form.value.prompt)
	// const isAll = hasAllChinese(form.value.prompt)
	// if (isAll || isHas)
	//   return ms.error('描述词请使用纯英文、否则可能造成无法识别、请先翻译为英文再进行绘制可获得更好的体验！')

	try {
		notification.success({
			title: t('common.imageGenerationStarted'),
			duration: 10000,
			content: t('common.imageGenerationStarted2'),
		});
		drawSize.value = 4;
		loading.value = true;
		await fetchMjDtawAPI(form.value);
		notification.success({
			title: t('common.imageGenerationCompleted'),
			duration: 10000,
			content: t('common.imageGenerationCompleted3'),
		});
		await queryMyDrawList();
		loading.value = false;
	} catch (error) {
		loading.value = false;
	}
}

/* 变换单张图片 */
async function handlervariationSingleImg(item: any, orderId: number) {
	const { message_id } = item;
	if (loading.value) {
		return notification.warning({
			title: t('common.drawingInProgress'),
			duration: 3000,
			content: t('common.drawingInProgressWarning'),
		});
	}

	if (!message_id) return ms.error(t('common.currentImageNotSupportedForVariation'));
	const params = { message_id, orderId };
	try {
		drawSize.value = 4;
		form.value.prompt = t('common.imageVariationInProgress');
		loading.value = true;
		notification.success({
			title: t('common.imageVariationStarted'),
			duration: 10000,
			content: t('common.imageVariationStarted2'),
		});
		await fetchVariationSingleImgAPI(params);
		form.value.prompt = '';
		await queryMyDrawList();
		loading.value = false;
	} catch (error) {
		form.value.prompt = '';
		loading.value = false;
		notification.error({
			title: t('common.imageVariationFailed'),
			duration: 10000,
			content: t('common.imageVariationFailed2'),
		});
	}
}

/* 放大单张图片 */
async function handlerUpscaleImg(item: any, orderId: number) {
	const { message_id } = item;
	if (loading.value) {
		return notification.warning({
			title: t('common.drawingInProgress'),
			duration: 3000,
			content: t('common.drawingInProgressMessage'),
		});
	}

	if (!message_id) return ms.error(t('common.currentImageNotSupportedForDrawing'));
	const params = { message_id, orderId };
	try {
		notification.success({
			title: t('common.imageEnlargementInProgress'),
			duration: 5000,
			content: t('common.imageEnlargementStarted'),
		});
		drawSize.value = 1;
		form.value.prompt = t('common.singleImageDetailDrawing');
		loading.value = true;
		await fetchUpscaleSingleImgAPI(params);
		form.value.prompt = '';
		await queryMyDrawList();
		loading.value = false;
		notification.success({
			title: t('common.imageEnlargementCompleted'),
			duration: 10000,
			content: t('common.imageEnlargementCompleted2'),
		});
	} catch (error) {
		form.value.prompt = '';
		loading.value = false;
		notification.error({
			title: t('common.imageEnlargementFailed'),
			duration: 10000,
			content: t('common.imageEnlargementFailed2'),
		});
	}
}

function tips() {
	notification.create({
		title: t('common.freeTrialInProgress'),
		duration: 0,
		content: t('common.freeTrialMessage'),
		meta: '2023-5-11',
		avatar: () =>
			h(NAvatar, {
				size: 'small',
				round: true,
				src: 'https://public-1300678944.cos.ap-shanghai.myqcloud.com/blog/1683784443724logo.png',
			}),
	});
}

function updateTabs(name: string) {
	name === 'mine' && queryMyDrawList();
	name === 'all' && queryAllDrawList();
}

function handlerPreImg(id: number) {
	imagesRefs.value[id].click();
}

function setItemRefs(el, item) {
	imagesRefs.value[item.id] = el;
}

onMounted(() => {
	queryAllDrawList();
});
</script>

<template>
	<div
		class="main min-h-screen bg-center dark:bg-[#2F2E34]"
		:class="[!darkMode ? 'lightBg' : 'darkBg', isMobile ? 'px-3' : 'px-10']"
	>
		<TitleBar
			:title="t('common.drawingProVersion')"
			des="专业版绘画时间预计60~80S、请耐心等待、您的描述词将会被我们转化为英文、请知悉、请合理绘图、触发敏感词将直接封禁账户、请合理使用工具！"
			:padding="isMobile ? 2 : 20"
		/>
		<div :class="isMobile ? ['px-2'] : ['px-20']" class="pb-5">
			<NAlert :show-icon="false" type="success" class="mt-5">
				<span class="text-[#67c23a]">{{ t('common.drawingConsumptionMessage') }}</span>
			</NAlert>
			<div class="flex my-5">
				<b class="text-primary cursor-pointer select-none flex-shrink-0" @click="updateEx">{{
					t('common.changeExample')
				}}</b>
				<p class="mx-2 text-[#707384] select-none flex-shrink-0">
					Prompt{{ t('common.example') }}：
				</p>
				<p class="text-[#707384]">
					{{ exampleList[index] }}
				</p>
			</div>

			<NInputGroup>
				<NInput
					v-model:value="form.prompt"
					size="large"
					clearable
					:disabled="loading"
					:placeholder="t('common.enterPromptWord')"
					@keyup.enter="drawImage"
				/>
				<NButton
					type="success"
					size="large"
					:loading="loading"
					:disabled="loading"
					@click="drawImage"
				>
					<template #icon>
						<NIcon>
							<ImagesOutline />
						</NIcon>
					</template>
					{{ t('common.generateImage') }}
				</NButton>
			</NInputGroup>
			<div class="mt-5 p-4 bg-[#e7eaf380] dark:bg-[#2c2c32] rounded-lg">
				<div class="flex">
					<h4 class="text-base mr-2 w-20 flex-shrink-0">{{ t('common.modifierReference') }}</h4>
					<p class="text-[#707384]">
						{{ t('common.modifierReference2') }}
					</p>
				</div>
				<div class="flex mt-5">
					<h4 class="text-base mr-2 w-20 flex-shrink-0">{{ t('common.imageType') }}</h4>
					<div>
						<span
							v-for="(item, i) in promptList"
							:key="item"
							class="cursor-pointer hover:text-primary"
							@click="form.prompt += form.prompt ? `，${item}` : item"
							>{{ `${item} ${i + 1 === promptList.length ? '' : '、'}` }}</span
						>
					</div>
				</div>
			</div>
			<div v-if="loading" class="mt-8 pb-10">
				<div class="flex justify-center">
					{{ t('common.generatingImage15s') }}
				</div>
				<div class="flex flex-wrap mt-8">
					<img
						v-for="i in drawSize"
						:key="i"
						class="w-60 rounded ml-1 mt-1"
						src="https://public-1300678944.cos.ap-shanghai.myqcloud.com/blog/16816463869037208e40df8ceb5ff.gif"
					/>
				</div>
			</div>
			<NTabs type="line" animated class="mt-5" @update:value="updateTabs">
				<NTabPane name="all" :tab="t('common.publicGeneration')">
					<div
						v-if="allDrawList.length"
						class="flex flex-wrap mt-8"
						:class="[isMobile ? 'justify-center' : '']"
					>
						<div
							v-for="item in allDrawList"
							:key="item.thumbImg"
							class="rounded ml-3 mt-3 flex flex-col"
							:class="[isMobile ? 'w-full items-center ml-0' : 'w-64']"
						>
							<NImage :src="item.thumbImg" lazy :preview-src="item.answer" />
							<NEllipsis expand-trigger="click" line-clamp="1" :tooltip="true">
								{{ item.prompt }}
							</NEllipsis>
						</div>
					</div>
					<NEmpty v-else size="huge" class="mt-20" :description="t('common.noData')" />
				</NTabPane>
				<NTabPane name="mine" :tab="t('common.myGeneration')">
					<div
						v-if="mineDrawList.length"
						class="flex flex-wrap mt-8"
						:class="[isMobile ? 'justify-center' : '']"
					>
						<div
							v-for="item in mineDrawList"
							:key="item.thumbImg"
							class="w-64 rounded ml-3 mt-3 relative img-container"
							:class="[isMobile ? 'w-full' : 'w-64']"
						>
							<div v-if="item.isGroup" class="parent absolute">
								<div v-for="orderId in 4" :key="orderId" class="child">
									<NTooltip trigger="hover">
										<template #trigger>
											<Search
												theme="multi-color"
												class="icon"
												size="28"
												:fill="['#ebebeb', '#2cb976', '#FFF', '#1fc0ee']"
												@click="handlerUpscaleImg(item, orderId)"
											/>
										</template>
										{{ t('common.drawSingleCompleteImage') }}
									</NTooltip>
									<NTooltip trigger="hover">
										<template #trigger>
											<UpdateRotation
												theme="multi-color"
												class="icon ml-3"
												size="24"
												:fill="['#ebebeb', '#2cb976', '#FFF', '#1fc0ee']"
												@click="handlervariationSingleImg(item, orderId)"
											/>
										</template>
										{{ t('common.imageVariationDescription') }}
									</NTooltip>
								</div>
								<div class="circle">
									<NTooltip trigger="hover">
										<template #trigger>
											<ZoomIn
												theme="multi-color"
												size="24"
												class="zoom"
												:fill="['#333', '#2F88FF', '#FFF', '#43CCF8']"
												@click="handlerPreImg(item.id)"
											/>
										</template>
										{{ t('common.clickToPreviewEnlargedImage') }}
									</NTooltip>
								</div>
							</div>
							<NImage
								:ref="(el) => setItemRefs(el, item)"
								class="w-full flex justify-center"
								:src="item.thumbImg"
								:preview-src="item.answer"
								lazy
							/>
							<NEllipsis line-clamp="1" :tooltip="true">
								{{ item.prompt }}
							</NEllipsis>
						</div>
					</div>
					<NEmpty v-else size="huge" class="mt-20" :description="t('common.noData')" />
				</NTabPane>
			</NTabs>
		</div>
	</div>
</template>

<style lang="less">
.img-container {
	&:hover {
		.parent {
			opacity: 1;
		}
	}
}
.parent {
	user-select: none;
	transition: all 0.18s;
	width: 100%;
	opacity: 1;
	height: calc(100% - 35px);
	display: flex;
	flex-wrap: wrap;
	.child {
		width: 50%;
		height: 50%;
		outline: 1px solid #ccc;
		display: flex;
		justify-content: center;
		align-items: center;
		&:hover {
			.icon {
				opacity: 1;
			}
		}
		.icon {
			transition: all 0.3s;
			opacity: 0;
			&:hover {
				cursor: pointer;
				transform: scale(1.5);
			}
		}
	}
	.circle {
		width: 45px;
		height: 45px;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background-color: #e8f1f5;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		.zoom {
			transition: all 0.3s;
			&:hover {
				cursor: pointer;
				transform: scale(1.5);
			}
		}
	}
}
</style>
