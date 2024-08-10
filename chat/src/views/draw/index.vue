<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
	NAlert,
	NButton,
	NEmpty,
	NIcon,
	NImage,
	NInput,
	NInputGroup,
	NTabPane,
	NTabs,
	useMessage,
} from 'naive-ui';
import { ImagesOutline } from '@vicons/ionicons5';
import { fetchChatDraw, fetchGetAllChatLogDraw, fetchGetChatLogDraw } from '@/api';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { TitleBar } from '@/components/base';
import { useAppStore, useAuthStore } from '@/store';
import OldGridManager from '@/components/common/OldGridManager/index.vue';
import { t } from '@/locales';

import Loading from '@/components/base/Loading.vue';
const theme = computed(() => appStore.theme);
import type { ResData } from '@/api/types';
const authStore = useAuthStore();
const loadingTextColor = computed(() => (theme.value === 'dark' ? '#fff' : '#000'));
const { isMobile } = useBasicLayout();
const appStore = useAppStore();
const isLogin = computed(() => authStore.isLogin);

const index = ref(0);
const loading = ref(false);
const ms = useMessage();
const mineDrawList: any = ref([]);
const allDrawList: any = ref([]);

const darkMode = computed(() => appStore.theme === 'dark');
import { t } from '@/locales';
watch(isLogin, async (newVal, oldVal) => {
	if (newVal && !oldVal) queryMyDrawList();
});

const exampleList = [t('common.futuristicWorld'), t('common.handsome'), t('common.cuteRabbit')];

const imageSizeList = [
	{ label: '1024x1024', value: '1024x1024' },
	{ label: '1024x1792', value: '1024x1792' },
	{ label: '1792x1024', value: '1792x1024' },
];

const qualityList = [
	{ label: t('common.standard'), value: 'standard' },
	{ label: t('common.premium'), value: 'hd' },
];

// const imageNumList = [
//   { label: '1张', value: 1 },
//   { label: '2张', value: 2 },
//   { label: '3张', value: 3 },
//   { label: '4张', value: 4 },
//   { label: '5张', value: 5 },
//   { label: '6张', value: 6 },
//   { label: '7张', value: 7 },
//   { label: '8张', value: 8 },
//   { label: '9张', value: 9 },
// ]

const promptList = [
	t('common.ancientStyle'),
	t('common.anime'),
	t('common.realisticPhoto'),
	t('common.oilPainting'),
	t('common.watercolorPainting'),
	t('common.inkPainting'),
	t('common.blackAndWhiteWoodcut'),
	t('common.sculpture'),
	t('common.model'),
	t('common.handDrawnSketch'),
	t('common.charcoalDrawing'),
	t('common.minimalisticLineDrawing'),
	t('common.cinematicFeel'),
	t('common.mechanicalFeel'),
];

const form = ref({
	prompt: '',
	n: 1,
	size: '1024x1024',
	quality: 'standard',
});

function updateEx() {
	index.value = index.value + 1 >= exampleList.length ? 0 : index.value + 1;
}

async function queryMyDrawList() {
	const res: ResData = await fetchGetChatLogDraw({ model: 'dall-e-3' });
	if (!res.success) return;
	mineDrawList.value = formatFileInfo(res.data);
}

async function queryAllDrawList() {
	const res: ResData = await fetchGetAllChatLogDraw({ size: 999, rec: 1, model: 'dall-e-3' });
	if (!res.success) return ms.error(res.message);
	allDrawList.value = formatFileInfo(res.data.rows);
}

function loadMore() {}

function usePropmptDraw(str) {
	form.value.prompt = str;
}

/* 格式化为组件需要的 */
function formatFileInfo(data: any) {
	if (!data) return [];
	const res: any = [];
	data.forEach((item: any) => {
		const { id, fileInfo, prompt, thumbImg } = item;
		let file = null;
		if (typeof fileInfo === 'string') {
			try {
				file = JSON.parse(fileInfo);
			} catch (error) {
				file = {};
			}
		} else {
			file = fileInfo || {};
		}
		const { width, height, cosUrl } = file;
		res.push({
			id,
			prompt,
			fullPrompt: prompt,
			fileInfo: {
				thumbImg,
				width,
				height,
				cosUrl,
			},
		});
	});

	return res.filter((t) => t.fileInfo && t.fileInfo.width);
}

async function drawImage() {
	if (!form.value.prompt) return ms.error(t('common.enterImageDescription'));
	try {
		loading.value = true;
		await fetchChatDraw(form.value);
		ms.success(t('common.imageGenerationCompleted2'));
		await queryMyDrawList();
		loading.value = false;
	} catch (error) {
		loading.value = false;
	}
}

function updateTabs(name: string) {
	name === 'mine' && queryMyDrawList();
	name === 'all' && queryAllDrawList();
}

onMounted(() => {
	queryAllDrawList();
});
</script>

<template>
	<!-- <div class="main  h-full overflow-auto bg-custom-background-image bg-repeat-y bg-cover bg-center dark:bg-[#24272e]" :class="isMobile ? ['px-0'] : ['px-10']" :style="{ backgroundImage: !darkMode ? `url('https://seek.yesongit.com/_nuxt/bg.0b4507a9.png')` : '' }"> -->
	<div
		class="main min-h-screen bg-center dark:bg-[#2F2E34]"
		:class="[!darkMode ? 'lightBg' : 'darkBg', isMobile ? 'px-3' : 'px-10']"
	>
		<TitleBar
			title="DALL-E绘画"
			:des="t('common.dalleDrawingMessage')"
			:padding="isMobile ? 2 : 20"
		/>
		<div :class="isMobile ? ['px-2'] : ['px-20']">
			<!-- <NAlert :show-icon="false" type="success" class="mt-5">
        <span class="text-[#67c23a]">每生成一张图片需要扣除您的两个基础绘画积分、我们建议您输入转为英文！</span>
      </NAlert> -->
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
					:disabled="loading"
					clearable
					:placeholder="t('common.enterImageDescriptionExtended')"
				/>
				<NButton type="success" :loading="loading" :disabled="loading" @click="drawImage">
					<template #icon>
						<NIcon>
							<ImagesOutline />
						</NIcon>
					</template>
					{{ t('common.generateImage') }}
				</NButton>
			</NInputGroup>
			<div
				class="mt-5 py-4 bg-[#e7eaf380] dark:bg-[#2c2c32] rounded-lg"
				:class="isMobile ? 'px-0' : 'px-4'"
			>
				<h4 class="text-base mb-2">{{ t('common.parameterSettings') }}</h4>
				<div class="flex items-center mt-5">
					<span class="mr-2 inline-block w-20 flex-shrink-0">{{ t('common.imageSize') }}:</span>
					<div>
						<span
							v-for="item in imageSizeList"
							:key="item.value"
							class="rounded ml-2 select-none cursor-pointer inline-block mb-2"
							:class="[
								item.value === form.size ? ['text-primary', 'bg-[#0d6efd1c]'] : ['bg-[#bfc4d033]'],
								isMobile ? 'px-1.5 py-0.5' : 'px-3 py-1',
							]"
							@click="form.size = item.value"
							>{{ item.label }}</span
						>
					</div>
				</div>
				<div class="flex items-center mt-5">
					<span class="mr-2 inline-block w-20 flex-shrink-0">{{ t('common.imageQuality') }}:</span>
					<div>
						<span
							v-for="item in qualityList"
							:key="item.value"
							class="py-0.5 px-2.5 rounded ml-2 select-none cursor-pointer inline-block mb-2"
							:class="
								item.value === form.quality
									? ['text-primary', 'bg-[#0d6efd1c]']
									: ['bg-[#bfc4d033]']
							"
							@click="form.quality = item.value"
							>{{ item.label }}</span
						>
					</div>
				</div>
				<!-- <div class="flex mt-6 pb-8 border-b border-[#000c3f1a]">
          <span class="mr-2  w-16 flex-shrink-0">图片张数:</span>
          <div>
            <span v-for="item in imageNumList" :key="item.value" class=" py-2 px-5 rounded ml-2 select-none cursor-pointer mb-2 inline-block" :class="item.value === form.n ? ['text-primary', 'bg-[#0d6efd1c]'] : ['bg-[#bfc4d033]']" @click="form.n = item.value">{{ item.label }}</span>
          </div>
        </div> -->
				<div class="flex mt-5">
					<h4 class="text-base mr-2 w-20 flex-shrink-0">{{ t('common.modifierReference') }}</h4>
					<p class="text-[#707384]">
						您可参考或选用下列各类修饰词丰富您的输入文本，尝试生成更加多样的图像，更多修饰词可参考
						Prompt指南 或 自由输入 探索大模型作画更多未知能力
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
				<div class="flex justify-center">{{ t('common.generatingImage25s') }}</div>
				<div class="flex flex-wrap mt-8">
					<div class="w-44 h-44 border rounded-md relative ml-4 mt-4" v-for="i in form.n" :key="i">
						<Loading
							:text-color="loadingTextColor"
							:words="[
								'图',
								t('common.piece'),
								t('common.draw'),
								t('common.make'),
								t('common.medium'),
							]"
						/>
					</div>
					<!-- <img v-for="i in 5" :key="i" class="w-40 rounded ml-4 mt-4" src="https://public-1300678944.cos.ap-shanghai.myqcloud.com/blog/16816463869037208e40df8ceb5ff.gif"> -->
				</div>
			</div>
			<NTabs type="line" animated class="mt-5" @update:value="updateTabs">
				<NTabPane name="all" :tab="t('common.publicGeneration')">
					<div v-if="allDrawList.length" class="min-h-screen">
						<OldGridManager
							@loadMore="loadMore"
							usePropmpt
							:gap="8"
							preOrigin
							@usePropmptDraw="usePropmptDraw"
							:dataList="allDrawList"
							:scaleWidth="50"
						/>
					</div>
					<NEmpty v-else size="huge" class="mt-20" :description="t('common.noData')哟~" />
				</NTabPane>
				<NTabPane name="mine" :tab="t('common.myGeneration')">
					<div v-if="mineDrawList.length" class="min-h-screen">
						<OldGridManager
							@loadMore="loadMore"
							usePropmpt
							:gap="8"
							preOrigin
							@usePropmptDraw="usePropmptDraw"
							:dataList="mineDrawList"
							:scaleWidth="50"
						/>
					</div>
					<NEmpty v-else size="huge" class="mt-20" :description="t('common.noData')哟~" />
				</NTabPane>
			</NTabs>
		</div>
	</div>
</template>
