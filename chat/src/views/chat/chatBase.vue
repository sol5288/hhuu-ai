<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
	NButton,
	NCard,
	NCascader,
	NInput,
	NModal,
	NPopover,
	NProgress,
	NTooltip,
	useDialog,
	useMessage,
	NAlert,
	NSpace,
	NPopselect,
	NText,
} from 'naive-ui';
import type { MessageRenderMessage } from 'naive-ui';

import html2canvas from 'html2canvas';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { Message } from './components';
import { useScroll } from './hooks/useScroll';
import { useCopyCode } from './hooks/useCopyCode';
import { useChat } from './hooks/useChat';
import { useUsingContext } from './hooks/useUsingContext';
import { useUsingNetwork } from './hooks/useUsingNetwork';
import HeaderComponent from './components/Header/index.vue';
import AiBotComponent from './components/AiBot/index.vue';
import AppTips from './components/AppTips/index.vue';
import { SvgIcon } from '@/components/common';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import type { Theme } from '@/store/modules/app/helper';
import modelSvg from '@/assets/icons/modelSvg.svg';

import { useAppStore, useAuthStore, useChatStore, useGlobalStoreWithOut } from '@/store';
import { fetchQueryOneCatAPI } from '@/api/appStore';
import { fetchChatAPIProcess, fetchVideoAPIProcess } from '@/api';
import { t } from '@/locales';
import { router } from '@/router';
const uploadUrl = ref(`${import.meta.env.VITE_GLOB_API_URL}/upload/file`);
const useGlobalStore = useGlobalStoreWithOut();
const authStore = useAuthStore();
const route = useRoute();
let controller = new AbortController();

const dialog = useDialog();
const ms = useMessage();
const appStore = useAppStore();
const bottomContainer = ref();
const chatStore = useChatStore();
const isStreamIn = ref(false);
const typingStatusEnd = ref(true); // 타이핑 효과가 완료되었는지 여부
const appDetail: any = ref(null);
const chatPreVal = ref('');
const chatPreRef = ref(null);
const isShowChatPre = ref(false);
const showProgressModal = ref(false);
const themeOptions: {
	label: string;
	key: Theme;
	icon: string;
	color?: string;
}[] = [
	// {
	//   label: 'Auto',
	//   key: 'auto',
	//   icon: 'ri:contrast-line',
	//   color: '#5ac3f9',
	// },
	{
		label: 'Light',
		key: 'light',
		icon: 'twemoji:sun',
	},
	{
		label: 'Dark',
		key: 'dark',
		icon: 'noto-v1:last-quarter-moon-face',
	},
];

const videoOptions: {
	label: string;
	value: string;
}[] = [
	{
		value: 'alloy',
		label: 'alloy',
	},
	{
		value: 'echo',
		label: 'echo',
	},
	{
		value: 'fable',
		label: 'fable',
	},
	{
		value: 'nova',
		label: 'nova',
	},
	{
		value: 'onyx',
		label: 'onyx',
	},
	{
		value: 'shimmer',
		label: 'shimmer',
	},
];

let currentVideo = ref('alloy');
const theme = computed(() => appStore.theme);

const globaelConfig = computed(() => authStore.globalConfig);
const isSetBeian = computed(
	() => globaelConfig.value?.companyName && globaelConfig.value?.filingNumber
);
const { addGroupChat, updateGroupChat, updateGroupChatSome } = useChat();
const tradeStatus = computed(() => route.query.trade_status as string);
const token = computed(() => route.query.token as string);
useCopyCode();
const isLogin = computed(() => authStore.isLogin);
const { isMobile } = useBasicLayout();
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll();
const { usingContext, toggleUsingContext } = useUsingContext();
const { usingNetwork, toggleUsingNetwork } = useUsingNetwork();
const dataSources = computed(() => chatStore.chatList);

/* 현재 모든 AI 응답 메시지 리스트 - 컨텍스트를 쉽게 가져오기 위함 */
const conversationList = computed(() =>
	dataSources.value.filter((item) => !item.inversion && !item.error)
);

/* 현재 컨텍스트에서 ID가 있는 마지막 항목 - 응답 중지 시 이전 ID가 비어 있어 컨텍스트를 연결할 수 없는 문제 방지 */
const lastContext = computed(() => {
	const hasIdCoversationList = conversationList.value.filter(
		(item) => item.conversationOptions?.parentMessageId
	);
	return hasIdCoversationList[hasIdCoversationList.length - 1]?.conversationOptions;
});

const prompt = ref<string>('');
const loading = ref<boolean>(false);
const inputRef = ref<Ref | null>(null);
const firstScroll = ref<boolean>(true);
const tipsRef = ref<any>(null);
const tipText = ref('');
const tipsHeight = ref<any>(null);
let dataBase64 = ref(null);
const fileName = ref('');
const isImageFile = ref(false);
const showDeleteIcon = ref(false);

/* 현재 선택된 대화 그룹 */
const activeGroupId = computed(() => chatStore.active);
/* 현재 대화 그룹의 상세 정보 */
const activeGroupInfo = computed(() =>
	chatStore.groupList.find((item: any) => item.uuid === chatStore.active)
);
/* 현재 사용 중인 모델 유형 1: openai 2: 바이두 */
const activeModelKeyType = computed(() => Number(chatStore?.activeModelKeyType));
/* 현재 대화 그룹이 애플리케이션인지 여부 */
const activeAppId = computed(() => (activeGroupInfo?.value ? activeGroupInfo.value.appId : 0));
/* 클립보드 텍스트 */
const clipboardText = computed(() => useGlobalStore.clipboardText);

watch(clipboardText, (val) => {
	prompt.value = val;
	inputRef.value?.focus();
	inputRef.value.scrollTop = inputRef.value.scrollHeight;
});

watch(
	activeAppId,
	(val) => {
		if (val) queryAppDetail(val);
		else appDetail.value = null;
	},
	{ immediate: true }
);

watch(
	activeGroupId,
	(val) => {
		if (val) firstScroll.value = true;
		if (inputRef.value && !isMobile.value) inputRef.value?.focus();
	},
	{ immediate: true }
);

watch(
	dataSources,
	(val) => {
		if (val.length === 0) return;
		if (firstScroll.value) {
			firstScroll.value = false;
			scrollToBottom();
		}
	},
	{ immediate: true }
);

const modelName = computed(() => {
	if (!chatStore.activeConfig) return;
	const { modelTypeInfo, modelInfo } = chatStore.activeConfig;
	if (!modelTypeInfo || !modelInfo) return;
	return `${modelInfo.modelName}`;
});
function handleOpenModelDialog() {
	if (useGlobalStore.isChatIn) return ms.warning(t('common.waitForChatToEnd'));

	useGlobalStore.updateModelDialog(true);
}
function handleSignIn() {
	if (!isLogin.value) {
		authStore.setLoginDialog(true);
		return;
	}
	useGlobalStore.updateSignInDialog(true);
}

const audioRef = ref(null);
const audioState = ref('Play');
function hendleVideo(item) {
	var data = JSON.stringify({
		model: 'tts-1',
		input: item.text,
		voice: 'alloy',
	});
	axios({
		method: 'post',
		url: 'https://api.oneapi.dwyu.cn/v1/audio/speech',
		headers: {
			Authorization: 'Bearer sk-z726fTNvD1jzSBZ42e8dF919840b48A5820e4e5d9d4e70A4',
			'Content-Type': 'application/json',
		},
		data: data,
	})
		.then(function (response) {
			console.log('--response.data', response.data);
			const audio = audioRef.value;
			const blob = new Blob([response.data], { type: 'audio/mpeg' });
			if (!audio) return;
			audio.src = URL.createObjectURL(blob);
			console.log(audio);
			audio.load();
			audio.play();

			// if (audio.paused) {
			//   audio.play()
			//   audioState.value = 'Stop'
			// } else {
			//   audio.pause()
			//   audio.currentTime = 0
			//   audioState.value = 'Play'
			// }
		})
		.catch(function (error) {
			console.error('오디오 데이터를 가져오는 중 오류가 발생했습니다', error);
		});
}

// 파일 파싱 gpt-4-all 역변환
let curFile: File | null;

async function handleFileSelect(event: any) {
	const file = event?.target?.files[0];
	if (!file) return;
	if (file.size <= 10 * 1024 * 1024) {
		await handleSetFile(file);
	} else {
		return ms.error(t('common.fileSizeExceeded'));
	}
	let trimmedFileName = file.name;
	const maxLength = 8; // 최대 길이 제한
	const extension = trimmedFileName.split('.').pop(); // 파일 확장자 가져오기

	if (trimmedFileName.length > maxLength) {
		// 파일 이름을 자르고 생략 부호를 추가하면서 확장자 유지
		trimmedFileName =
			trimmedFileName.substring(0, maxLength - extension.length - 1) + '….' + extension;
	}

	fileName.value = trimmedFileName; // 파일 이름 업데이트
	console.log(file.type);
	// 파일 유형 확인
	if (file.type.startsWith('image/')) {
		// 이미지 파일 처리
		isImageFile.value = true;
		handleSetFile(file);
	} else if (file.type.startsWith('application/') || file.type.startsWith('text/')) {
		// 파일 유형 처리
		isImageFile.value = false;
		handleSetFile(file);
	} else {
		// 다른 유형의 파일 처리 또는 오류 메시지 표시
		ms.error(t('common.unsupportedFileType'));
		console.log('지원되지 않는 파일 유형');
	}
}

async function handleSetFile(file: File) {
	curFile = file;
	const reader = new FileReader();
	reader.onload = (event: any) => {
		dataBase64.value = event.target?.result as string;
	};
	reader.readAsDataURL(file);
}

function uploadBtn() {
	document.getElementById('upload-file').click();
}

const progress = ref<Number>(0);
async function uploadFile() {
	showProgressModal.value = true;
	const form = new FormData();
	curFile && form.append('file', curFile);
	try {
		const res = await axios.post(uploadUrl.value, form, {
			headers: { 'Content-Type': 'multipart/form-data' },
			onUploadProgress: (event) => {
				progress.value = Math.round((event.loaded * 100) / event.total);
				if (progress.value === 100) {
					setTimeout(() => {
						showProgressModal.value = false;
					}, 1000);
				}
			},
		});
		return res?.data?.data;
	} catch (error) {
		ms.error(t('common.networkError'));
		return null;
	} finally {
		dataBase64.value = null;
		curFile = null;
	}
}

function openChatPre() {
	isShowChatPre.value = true;
}

function updateChatPreData(val: string) {
	tipText.value = val;
	tipsHeight.value = 'auto';
	isShowChatPre.value = false;
	nextTick(() => getTipsRefHeight());
}

/* 현재 앱 세부 정보를 쿼리하여 사용자에게 사용 방법 안내 */
async function queryAppDetail(id: number) {
	const res: any = await fetchQueryOneCatAPI({ id });
	appDetail.value = res.data;
}

/* 빠른 대화 주제 클릭 시 직접 대화 시작 */
function handlePrompt(val: string) {
	prompt.value = val;
	handleSubmit();
}

function handleScrollBtm() {
	bottomContainer.value.scrollIntoView({ behavior: 'smooth' });
}

/* 메시지 전송 */
async function handleSubmit(index?: number) {
	if (chatStore.groupList.length === 0 || loading.value || !typingStatusEnd.value) return;
	let message = '';
	/* index가 있으면 재생성 */
	if (index && typeof index === 'number') {
		const { requestOptions } = dataSources.value[index];
		message = requestOptions?.prompt ?? '';
	}
	onConversation(message);
}

function parseTextToJSON(input: string) {
	const startIndex = input.indexOf(',"text":"') + 10;
	if (startIndex === -1) return { text: '' };

	let endIndex = input.indexOf('","delta"', startIndex);
	if (endIndex === -1) endIndex = input.length - 1;
	else endIndex = endIndex - 10;

	const text = input.substring(startIndex, endIndex);
	return { text };
}

/* 버튼으로 메시지 전송 */
async function onConversation(msg?: string) {
	let imageUrl = null;
	if (dataBase64.value || curFile) {
		imageUrl = await uploadFile();
	}
	let message = msg || prompt.value;
	if (tipText.value && !message.includes(tipText.value)) message = `${tipText.value}\n${message}`;

	if (loading.value) return;

	if (!message || message.trim() === '') return;

	controller = new AbortController();

	/* 가상의 사용자 기록 추가 */
	addGroupChat({
		dateTime: new Date().toLocaleString(),
		text: message,
		inversion: true,
		error: false,
		imageUrl,
		conversationOptions: null,
		requestOptions: { prompt: message, options: null },
	});

	scrollToBottom();

	loading.value = true;
	prompt.value = '';

	let options: any = {
		groupId: +activeGroupId.value,
		usingNetwork: usingNetwork.value,
	};

	if (lastContext.value && usingContext.value && !usingNetwork.value)
		options = { ...lastContext.value, ...options };

	/* 가상의 AI 기록 추가 */
	addGroupChat({
		dateTime: new Date().toLocaleString(),
		text: t('common.aiThinking'),
		loading: true,
		inversion: false,
		error: false,
		conversationOptions: null,
		requestOptions: { prompt: message, options: { ...options } },
	});

	scrollToBottom();
	const timer: any = null;
	let cacheResText = '';
	let data: any = null;
	isStreamIn.value = true;
	let userBanance: any = {};

	useGlobalStore.updateIsChatIn(true);
	/* 균일한 속도로 출력 */
	try {
		const fetchChatAPIOnce = async () => {
			let i = 0;
			let shouldContinue = true;
			let currentText = '';
			async function update() {
				if (shouldContinue) {
					if (cacheResText && cacheResText[i]) {
						typingStatusEnd.value = false;
						/* 캐시된 글자 수가 너무 많으면 한 번에 모두 추가 */
						if (cacheResText.length - i > 150) {
							currentText += cacheResText.substring(i, i + 10);
							i += 10;
						} else if (cacheResText.length - i > 200) {
							currentText += cacheResText.substring(i);
							i += cacheResText.length - i;
						} else {
							currentText += cacheResText[i];
							i++;
						}
						updateGroupChat(dataSources.value.length - 1, {
							dateTime: new Date().toLocaleString(),
							text: currentText,
							inversion: false,
							usage: data?.detail?.usage,
							error: false,
							loading: true,
							imageUrl: data?.imageUrl,
							conversationOptions: {
								conversationId: data?.conversationId,
								parentMessageId: data?.id,
							},
							requestOptions: { prompt: message, options: { ...options } },
						});
						scrollToBottomIfAtBottom();
					}
					const curLen = currentText ? currentText.length : 0;
					const cacheResLen = cacheResText ? cacheResText.length : 0;
					if (!isStreamIn.value && (curLen === cacheResLen || curLen > cacheResLen)) {
						typingStatusEnd.value = true;
						updateGroupChatSome(dataSources.value.length - 1, {
							loading: false,
							conversationOptions: {
								conversationId: data?.conversationId,
								parentMessageId: data?.id,
							},
							requestOptions: { prompt: message, options: { ...options } },
						});
						useGlobalStore.updateIsChatIn(false);
						if (Object.keys(userBanance).length) authStore.updateUserBanance(userBanance);

						if (dataSources.value.length === 2 && !activeGroupInfo?.value?.appId) {
							const lengthStr = isMobile.value ? 20 : 20;
							const title =
								dataSources.value[1].text.length > lengthStr
									? dataSources.value[1].text.slice(0, lengthStr)
									: dataSources.value[1].text;
							chatStore.updateGroupInfo({ groupId: +activeGroupId.value, title }).then(() => {
								chatStore.queryMyGroup();
							});
						}
						shouldContinue = false; // 애니메이션 루프 종료
					}

					/* 남은 내용이 있으면 다음 프레임 요청 */
					if (cacheResText.length && cacheResText.length > currentText.length) {
						requestAnimationFrame(update);
					} else {
						setTimeout(() => {
							requestAnimationFrame(update);
						}, 1000);
					}
				}
			}
			requestAnimationFrame(update); // 애니메이션 루프 시작

			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				appId: activeGroupInfo.value ? activeGroupInfo.value.appId : 0,
				options,
				imageUrl,
				model: chatStore?.activeModelName,
				signal: controller.signal,
				onDownloadProgress: ({ event }) => {
					const xhr = event.target;
					const { responseText } = xhr;

					/* 이 파싱은 openai에만 유효하며 다른 모델은 앞부분의 글자를 놓칠 수 있음 */
					if ([1].includes(activeModelKeyType.value)) {
						const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2);
						let chunk = responseText;
						if (lastIndex !== -1) chunk = responseText.substring(lastIndex);

						try {
							data = JSON.parse(chunk);
						} catch (error) {
							/* 이차 파싱 */
							// const parseData = parseTextToJSON(responseText)
							// TODO 시간 초과 오류와 같은 경우 이전 내용과 함께 전송되어 파싱할 수 없게 됨 - 백엔드에서 처리 필요
							console.log('openai에서 데이터 파싱 오류: ');
							if (chunk.includes('OpenAI timed out waiting for response'))
								ms.warning(t('common.sessionTimeout'));
						}
					}

					/* 바이두와 유사한 형식의 모델 메시지 파싱 처리 */
					if ([2, 3].includes(activeModelKeyType.value)) {
						const lines = responseText
							.toString()
							.split('\n')
							.filter((line: string) => line.trim() !== '');

						let cacheResult = ''; // 이번 라운드에 입력된 모든 필드 정보 가져오기
						let tem: any = {};
						for (const line of lines) {
							try {
								const parseData = JSON.parse(line);
								cacheResult += parseData.result;
								tem = parseData;
							} catch (error) {
								console.log('Json parse 2 3 유형 오류: ');
							}
						}
						tem.result = cacheResult;
						data = tem;
					}

					try {
						/* 출력 내용이 일치하지 않으면 처리 필요 */
						if (activeModelKeyType.value === 1) {
							cacheResText = data.text;
							if (data?.userBanance) userBanance = data?.userBanance;
						}

						if ([2, 3].includes(activeModelKeyType.value)) {
							const { result, is_end } = data;
							cacheResText = result;
							isStreamIn.value = !is_end;
							data?.userBanance && (userBanance = data?.userBanance);
						}
					} catch (error) {}
				},
			});
		};
		await fetchChatAPIOnce();
	} catch (error: any) {
		useGlobalStore.updateIsChatIn(false);
		clearInterval(timer);
		isStreamIn.value = false;
		if (
			error.code === 402 ||
			error?.message.includes(t('common.insufficientBalance')) ||
			error?.message.includes(t('common.freeQuotaExhausted'))
		) {
			if (isLogin.value) useGlobalStore.updateGoodsDialog(true);
			else authStore.setLoginDialog(true);
		}

		let errorMessage = error?.message ?? t('common.wrong');
		if (errorMessage === 'Request failed with status code 401')
			errorMessage = t('common.unauthorized');

		if (error?.message.includes('canceled')) {
			updateGroupChatSome(dataSources.value.length - 1, { loading: false });
			scrollToBottomIfAtBottom();
			setTimeout(() => {
				authStore.getUserBalance();
			}, 200);
			return;
		}

		const currentChat = dataSources.value[dataSources.value.length - 1];

		if (currentChat?.text && currentChat.text !== '') {
			updateGroupChatSome(dataSources.value.length - 1, {
				text: `${currentChat.text === t('common.aiThinking') ? '' : currentChat.text}\n[${errorMessage}]`,
				error: false,
				loading: false,
			});
			return;
		}
		updateGroupChat(dataSources.value.length - 1, {
			imageUrl: data.imageUrl,
			dateTime: new Date().toLocaleString(),
			text: errorMessage,
			inversion: false,
			error: true,
			loading: false,
			conversationOptions: null,
			requestOptions: { prompt: message, options: { ...options } },
		});
		scrollToBottomIfAtBottom();
	} finally {
		loading.value = false;
		isStreamIn.value = false;
		imageUrl = null;
		typingStatusEnd.value = true;
		scrollToBottom();
	}
}

/* 타사 연동 리디렉션 처리 */
async function otherLoginByToken(token: string) {
	authStore.setToken(token);
	router.replace({ name: 'Chat', query: {} });
	ms.success(t('common.accountLoginSuccess'));
	authStore.getUserInfo();
}

/* 결제 콜백 처리 */
function handleRefresh() {
	if (tradeStatus.value.toLowerCase().includes('success')) {
		ms.success(t('common.purchaseThankYou'), { duration: 5000 });
		authStore.getUserInfo();
		router.replace({ name: 'Chat', query: {} });
	} else {
		ms.error(t('common.purchaseNotSuccessful'));
	}
}

/* 내보내기 */
function handleExport() {
	if (loading.value) return;

	const d = dialog.warning({
		title: t('common.exportImage'),
		content: t('common.exportImageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: async () => {
			try {
				d.loading = true;
				const ele = document.getElementById('image-wrapper');
				const canvas = await html2canvas(ele as HTMLDivElement, {
					useCORS: true,
				});
				const imgUrl = canvas.toDataURL('image/png');
				const tempLink = document.createElement('a');
				tempLink.style.display = 'none';
				tempLink.href = imgUrl;
				tempLink.setAttribute('download', 'chat-shot.png');
				if (typeof tempLink.download === 'undefined') tempLink.setAttribute('target', '_blank');

				document.body.appendChild(tempLink);
				tempLink.click();
				document.body.removeChild(tempLink);
				window.URL.revokeObjectURL(imgUrl);
				d.loading = false;
				ms.success(t('common.exportSuccess'));
				Promise.resolve();
			} catch (error: any) {
				ms.error(t('common.exportFailed'));
			} finally {
				d.loading = false;
			}
		},
	});
}

/* 삭제 */
function handleDelete({ chatId }: Chat.Chat) {
	if (loading.value) return;

	dialog.warning({
		title: t('common.deleteMessage'),
		content: t('common.deleteMessageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			chatStore.deleteChatById(chatId);
		},
	});
}

function handleClear() {
	if (loading.value) return;

	dialog.warning({
		title: t('common.clearChat'),
		content: t('common.clearChatConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: async () => {
			await chatStore.clearChatByGroupId();
			ms.success(t('common.deleteCurrentPageDialogComplete'));
		},
	});
}

function handleEnter(event: KeyboardEvent) {
	if (!isMobile.value) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	} else {
		if (event.key === 'Enter' && event.ctrlKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
}

function handleStop() {
	if (loading.value) {
		controller.abort();
		loading.value = false;
		isStreamIn.value = false;
		typingStatusEnd.value = true;
	}
}

const placeholder = computed(() => {
	if (isMobile.value) return t('common.placeholderMobile');
	return t('common.placeholder');
});

const buttonDisabled = computed(() => {
	return loading.value || !prompt.value || prompt.value.trim() === '' || !typingStatusEnd.value;
});
// 변경: 전송 후 로딩 원 추가
const buttonLoading = computed(() => {
	return loading.value || !typingStatusEnd.value;
});
function getTipsRefHeight() {
	if (tipsRef.value) tipsHeight.value = `${tipsRef.value.getBoundingClientRect()?.height}px`;
}

function onInputeTip() {
	tipsHeight.value = 'auto';
	if (!tipText.value) tipsHeight.value = 0;

	nextTick(() => getTipsRefHeight());
}

onMounted(async () => {
	chatStore.queryChatPre();

	if (token.value) otherLoginByToken(token.value);

	if (tradeStatus.value) handleRefresh();

	nextTick(async () => {
		await chatStore.queryActiveChatLogList();
		scrollToBottom();
		if (inputRef.value && !isMobile.value) inputRef.value?.focus();
	});
});
const darkMode = computed(() => appStore.theme === 'dark');

onUnmounted(() => {
	if (loading.value) controller.abort();
});
</script>

<template>
	<div class="h-full flex flex-col bg-white dark:bg-[#111114]">
		<HeaderComponent
			:using-context="usingContext"
			:dark-mode="darkMode"
			@export="handleExport"
			@toggle-using-context="toggleUsingContext"
			@clear="handleClear"
			@scroll-btn="handleScrollBtm"
		/>
		<main class="flex-1 overflow-hidden" style="padding-bottom: 5px">
			<div
				id="scrollRef"
				ref="scrollRef"
				class="relative h-full overflow-hidden overflow-y-auto scroll-smooth"
			>
				<div
					id="image-wrapper"
					class="w-full max-w-screen-4xl m-auto dark:bg-[#101014] h-full"
					:class="[isMobile ? 'p-2' : 'p-4']"
				>
					<template v-if="!dataSources.length && !activeAppId">
						<div
							class="flex justify-center items-center text-center"
							:class="[isMobile ? 'h-full' : 'h-4/5 ']"
						>
							<AiBotComponent @prompt="handlePrompt" />
						</div>
					</template>
					<template v-if="!dataSources.length && activeAppId">
						<div class="flex justify-center items-center">
							<AppTips :app-info="appDetail" @prompt="handlePrompt" />
						</div>
					</template>
					<template v-if="dataSources.length">
						<div>
							<Message
								v-for="(item, index) of dataSources"
								:key="item.chatId"
								:date-time="item.dateTime"
								:text="item.text"
								:inversion="item.inversion"
								:error="item.error"
								:loading="item.loading"
								:imageUrl="item.imageUrl"
								@regenerate="handleSubmit(index)"
								@delete="handleDelete(item)"
								@video="hendleVideo(item)"
							/>
							<div class="sticky bottom-1 left-0 flex justify-center">
								<NButton v-if="loading" @click="handleStop">
									<template #icon>
										<SvgIcon icon="ri:stop-circle-line" />
									</template>
									{{ t('common.stopOutput') }}
								</NButton>
							</div>
							<div ref="bottomContainer" class="bottom" />
						</div>
					</template>
				</div>
			</div>
		</main>
		<footer>
			<div :class="[isMobile ? 'px-2' : 'px-4']">
				<div class="scrollBtn space-x-2">
					<NTooltip trigger="hover" placement="bottom-end" :disabled="isMobile">
						<template #trigger>
							<button
								class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition dark:border-neutral-700"
								:class="{ 'bg-[#5782f4]': !usingContext }"
								@click="toggleUsingContext"
							>
								<span
									class=""
									:class="{
										'text-[#3076fd]': usingContext,
										'text-[#ffffff]': !usingContext,
									}"
									><SvgIcon
										class="text-lg"
										style="width: 1em; height: 1em"
										icon="ri:chat-history-line"
								/></span>
							</button>
						</template>
						{{ t('common.contextStatus') }}
					</NTooltip>
					<NPopover
						v-if="chatStore.chatPreList?.length"
						placement="top-start"
						style="width: 200px"
						raw
						:show-arrow="false"
					>
						<template #trigger>
							<NTooltip trigger="hover" placement="bottom-end" :disabled="isMobile">
								<template #trigger>
									<button
										class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
										@click="openChatPre"
									>
										<span
											><SvgIcon
												class="text-lg"
												style="width: 1em; height: 1em"
												icon="noto:open-book"
										/></span>
									</button>
								</template>
								{{ t('common.quickQuestion') }}
							</NTooltip>
						</template>
						<div class="w-0 h-0 opacity-0">
							<NCascader
								id="chatPreRef"
								ref="chatPreRef"
								v-model="chatPreVal"
								:show="isShowChatPre"
								placement="top"
								class="w-0 h-0 opacity-0 overflow-hidden"
								:placeholder="t('common.selectModelPlaceholder')"
								expand-trigger="click"
								:options="chatStore.chatPreList"
								check-strategy="child"
								:on-update:value="updateChatPreData"
							/>
						</div>
					</NPopover>
					<div v-if="isMobile">
						<div
							class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
							@click="useGlobalStore.updateGoodsDialog(true)"
						>
							<SvgIcon
								icon="flat-color-icons:shop"
								class="text-lg"
								style="width: 1em; height: 1em"
							/>
						</div>
					</div>
					<NTooltip trigger="hover" :disabled="isMobile">
						<template #trigger>
							<button
								class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition dark:border-neutral-700"
								@click="toggleUsingNetwork"
								:class="{ 'bg-[#5782f4]': usingNetwork }"
							>
								<span class="text-base text-slate-500 dark:text-slate-400">
									<SvgIcon
										icon="zondicons:network"
										class="cursor-pointer mb-0.5"
										:class="{
											'text-[#3076fd]': !usingNetwork,
											'text-[#fff]': usingNetwork,
										}"
									/>
								</span>
							</button>
						</template>
						{{ usingNetwork ? t('common.closeNetworkAccess') : t('common.openNetworkAccess') }}
					</NTooltip>
					<button
						v-show="isMobile"
						@click="appStore.setTheme(theme === 'dark' ? 'light' : 'dark')"
						class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition dark:border-neutral-700 dark:hover:bg-[#33373c]"
					>
						<span class="text-base text-slate-500 dark:text-slate-400">
							<SvgIcon
								:icon="theme === 'dark' ? 'noto-v1:last-quarter-moon-face' : 'twemoji:sun'"
							/>
						</span>
					</button>
					<NTooltip trigger="hover" :disabled="isMobile" placement="bottom">
						<template #trigger>
							<NButton
								icon-placement="left"
								class="shrink0 flex h-8 w-8 items-center justify-center rounded border transition dark:border-neutral-700 dark:hover:bg-[#33373c]"
								style="height: 2rem; padding: 0 8px"
								@click="handleOpenModelDialog"
							>
								<template #icon>
									<span class="text-base text-slate-500 dark:text-slate-400">
										<!-- <SvgIcon icon="streamline-emojis:wrapped-gift-1" /> -->
										<img :src="modelSvg" class="h-8" alt="" />
									</span>
								</template>
								<span style="color: #3076fd">{{ modelName }}</span>
							</NButton>
						</template>
						{{ t('common.switchModel') }}
					</NTooltip>
				</div>
			</div>
			<div class="m-auto max-w-screen-4xl" :class="[isMobile ? 'px-2 py-1' : 'px-4 py-2']">
				<div class="flex items-stretch space-x-2">
					<div class="relative flex-1">
						<NInput
							ref="inputRef"
							v-model:value="prompt"
							type="textarea"
							clearable
							:style="{ paddingTop: tipsHeight }"
							class="pb-10"
							autofocus
							:placeholder="placeholder"
							:autosize="{
								minRows: isMobile ? 1 : 2,
								maxRows: isMobile ? 3 : 4,
							}"
							@keypress="handleEnter"
						/>
						<div
							v-if="tipText"
							ref="tipsRef"
							class="absolute h-auto top-0 w-full px-3 pt-1 flex justify-between"
							:style="tipsHeight && { height: tipsHeight }"
						>
							<div class="flex w-full flex-col mb-1">
								<span class="text-neutral-400 mb-1">{{ t('common.prompt') }}</span>
								<NInput
									v-model:value="tipText"
									class="border-none"
									type="textarea"
									clearable
									:autosize="{
										minRows: 1,
									}"
									:on-input="onInputeTip"
								/>
							</div>
						</div>
						<div class="absolute bottom-1 left-2 right-2">
							<div class="flex items-center justify-between">
								<div class="flex space-x-2">
									<NTooltip
										v-if="
											!dataBase64 &&
											(chatStore.activeConfig.modelInfo.model === 'gpt-4-all' ||
												chatStore.activeConfig.modelInfo.model === 'gpt-4-vision-preview')
										"
										trigger="hover"
										placement="bottom-end"
										:disabled="isMobile"
									>
										<template #trigger>
											<button
												class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
												@click="uploadBtn"
											>
												<span class="text-[#3076fd]">
													<input
														id="upload-file"
														ref="upload"
														:multiple="false"
														type="file"
														style="display: none"
														:accept="
															chatStore.activeConfig.modelInfo.model === 'gpt-4-vision-preview'
																? 'image/*'
																: 'text/plain,image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf'
														"
														@change="handleFileSelect($event)" />
													<SvgIcon icon="mingcute:upload-line"
												/></span>
											</button>
										</template>
										{{ t('common.upload') }}
									</NTooltip>
									<!-- 미리보기 컨테이너 -->
									<div v-if="dataBase64" class="relative flex items-start justify-start">
										<div
											class="group"
											@mouseover="showDeleteIcon = true"
											@mouseleave="showDeleteIcon = false"
										>
											<!-- isImageFile 값에 따라 다른 콘텐츠 표시 -->
											<template v-if="isImageFile">
												<!-- 이미지 미리보기 -->
												<img
													:src="dataBase64"
													class="max-w-full max-h-10 border border-gray-300 rounded-lg"
													alt="미리보기 이미지"
												/>
												<!-- 삭제 아이콘 -->
												<SvgIcon
													class="close-icon"
													icon="gg:close-o"
													@click="(dataBase64 = null), (curFile = null)"
												/>
											</template>
											<template v-else>
												<!-- 비이미지 파일 미리보기 (예: 파일 아이콘) -->
												<div
													style="white-space: nowrap; padding: 0.25rem"
													class="flex items-center justify-center border border-gray-300 rounded-lg h-8 hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-400"
												>
													<span>{{ fileName }}</span>
													<!-- 삭제 아이콘 -->
													<SvgIcon
														class="close-icon"
														icon="gg:close-o"
														@click="(dataBase64 = null), (curFile = null)"
													/>
													<!-- 적절한 파일 아이콘으로 대체 -->
												</div>
											</template>
										</div>
									</div>
								</div>
								<div class="flex justify-between items-center">
									<NButton
										type="primary"
										size="small"
										style="padding: 0px; width: 80px; height: 28px; border: 0px"
										:disabled="buttonDisabled"
										round
										@click="handleSubmit"
									>
										<template #icon>
											<span class="dark:text-black">
												<SvgIcon v-if="!buttonLoading" icon="icon-park-outline:send" />
												<SvgIcon v-else icon="line-md:loading-twotone-loop" />
											</span>
										</template>
										{{ t('common.send') }}
									</NButton>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
		<div
			v-if="isSetBeian && !isMobile"
			class="w-full flex justify-center items-center py-2 text-xs text-[#aeaeae]"
		>
			{{ t('common.copyrightNotice', { companyName: globaelConfig?.companyName }) }}
			<a
				class="ml-2 transition-all text-[#aeaeae] hover:text-[#60606d]"
				href="https://beian.miit.gov.cn"
				target="_blank"
				>{{ globaelConfig?.filingNumber }}</a
			>
		</div>
		<NModal v-model:show="showProgressModal" :mask-closable="false">
			<NCard
				style="width: 80%"
				:title="t('common.uploadingFile')"
				:bordered="false"
				size="small"
				role="dialog"
				aria-modal="true"
			>
				<NProgress type="line" :percentage="progress" indicator-placement="inside" processing />
			</NCard>
		</NModal>

		<!-- <audio ref="audioRef" controls>
      <source type="audio/mpeg" />
    </audio> -->
	</div>
</template>

<style scoped lang="less">
.scrollBtn {
	display: flex;
	flex-shrink: 0 !important;
	overflow-x: auto;
	overflow: -moz-scrollbars-none;
	-ms-overflow-style: none; /* IE와 Edge */
	&::-webkit-scrollbar {
		display: none;
	}
}
.shrink0 {
	flex-shrink: 0 !important;
}

.close-icon {
	position: absolute;
	top: -0;
	right: 0;
	color: #ff6347;
	font-size: 1rem;
	width: 1rem;
	height: 1rem;
	animation: scaleAnim 2s infinite ease-in-out;
	cursor: pointer;
	&:hover {
		font-weight: 800;
		color: red;
	}
}

@keyframes scaleAnim {
	0%,
	100% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.2);
	}
}
</style>
