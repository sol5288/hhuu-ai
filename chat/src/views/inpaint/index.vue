<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import CanvasMask from '@/components/common/CanvasMask/index.vue';
import ImageEditorCanvas from '@/components/common/ImageEditorCanvas/index.vue';
import { fetchProxyImgAPI } from '@/api/mjDraw';
import { NButton } from 'naive-ui';
import { t } from '@/locales';

const proxyImgBase = ref('');

const mode1Url = '';
const mode2Url = '';

const canvasRef = ref<any>(null);
const drawImg = ref('');
const mode = ref(1); // 1 局部绘制  2：点击选取

const isEraserEnabled = ref(false);
const fileInfo = ref<any>({});
const testBtn = computed(() =>
	mode.value === 1 ? t('common.moduleSelection') : t('common.freeDrawing')
);
const testModeTip = computed(() =>
	mode.value === 2 ? t('common.moduleSelectionMode') : t('common.freeDrawingMode')
);

async function getBase() {
	const base = await canvasRef.value?.getBase();
	proxyImgBase.value = base;
}

async function getProxyData() {
	const url = mode.value === 1 ? mode1Url : mode2Url;
	const response: any = await fetchProxyImgAPI({ url: url });
	const data = 'data:image/png;base64,' + response.data;
	drawImg.value = data;
}

const eraserTip = computed(() =>
	isEraserEnabled.value ? t('common.eraserMode') : t('common.brushMode')
);

function checkMode() {
	drawImg.value = null;
	mode.value = mode.value === 1 ? 2 : 1;
}

watch(
	mode,
	() => {
		getProxyData();
	},
	{ immediate: true }
);

function undo() {
	canvasRef.value?.undo();
}

function clear() {
	canvasRef.value?.clear();
}

function updateFileInfo(data) {
	fileInfo.value = data;
}

function toggleEraser() {
	canvasRef.value?.toggleEraser();
	isEraserEnabled.value = !isEraserEnabled.value;
}
</script>

<template>
	<div class="w-full h-full bg-gray-100">
		<div class="h-[80px] w-full flex justify-center items-center space-x-5">
			<span class="text-2xl font-bold"> {{ t('common.currentTestMode') }}：{{ testModeTip }} </span>
			<NButton type="primary" @click="checkMode">切换至{{ testBtn }}模式</NButton>
		</div>
		<div class="bg-gray-100 flex-1 h-full w-full flex" v-if="mode === 1">
			<div class="w-[50%] flex flex-col border-r">
				<span class="text-2xl w-full text-center">{{ t('common.operationArea') }}</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="undo">{{ t('common.goBack') }}</NButton>
					<NButton type="primary" @click="clear">{{ t('common.clearCanvas') }}</NButton>
					<NButton type="primary" @click="toggleEraser">{{ t('common.switchEraserMode') }}</NButton>
					{{ t('common.currentMode') }}: {{ eraserTip }}
				</div>
				<div class="mt-10 ml-10">
					<div>
						<CanvasMask
							ref="canvasRef"
							:updateFileInfo="updateFileInfo"
							:max="700"
							v-if="drawImg && mode === 1"
							:src="drawImg"
						/>
					</div>
				</div>
			</div>
			<div class="w-[50%] flex flex-col">
				<span class="text-2xl w-full text-center">{{ t('common.previewArea') }}</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="getBase">{{ t('common.getMask') }}</NButton>
				</div>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<span>{{ t('common.originalImageInfo') }}：</span>
					<span>{{ t('common.width') }}： {{ fileInfo.width }}</span>
					<span>{{ t('common.height') }}： {{ fileInfo.height }}</span>
					<span>{{ t('common.zoomRatio') }}： {{ fileInfo.scaleRatio }}</span>
				</div>
				<div>
					<img v-if="proxyImgBase" :src="proxyImgBase" alt="" />
				</div>
			</div>
		</div>

		<div class="bg-gray-100 flex-1 h-full w-full flex" v-if="mode === 2">
			<div class="w-[50%] flex flex-col border-r">
				<span class="text-2xl w-full text-center">{{ t('common.operationArea') }}</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="undo">{{ t('common.goBack') }}</NButton>
					<NButton type="primary" @click="clear">{{ t('common.clearCanvas') }}</NButton>
					t('common.currentMode'): {{ eraserTip }}
				</div>
				<div class="mt-10 ml-10">
					<div>
						<ImageEditorCanvas
							selectColor="#fff"
							ref="canvasRef"
							:updateFileInfo="updateFileInfo"
							:max="500"
							v-if="drawImg && mode === 2"
							:src="drawImg"
						/>
					</div>
				</div>
			</div>
			<div class="w-[50%] flex flex-col">
				<span class="text-2xl w-full text-center">{{ t('common.previewArea') }}</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="getBase">{{ t('common.getMask') }}</NButton>
				</div>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<span>{{ t('common.originalImageInfo') }}：</span>
					<span>{{ t('common.width') }}： {{ fileInfo.width }}</span>
					<span>{{ t('common.height') }}： {{ fileInfo.height }}</span>
					<span>{{ t('common.zoomRatio') }}： {{ fileInfo.scaleRatio }}</span>
				</div>
				<div>
					<img v-if="proxyImgBase" :src="proxyImgBase" alt="" />
				</div>
			</div>
		</div>
	</div>
</template>
