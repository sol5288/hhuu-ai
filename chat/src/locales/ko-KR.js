"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    common: {
        add: '추가',
        addSuccess: '추가 성공',
        edit: '편집',
        editSuccess: '편집 성공',
        delete: '삭제',
        deleteSuccess: '삭제 성공',
        save: '저장',
        update: '수정',
        saveSuccess: '저장 성공',
        updateUserSuccess: '사용자 정보 수정 성공',
        reset: '초기화',
        action: '작업',
        export: '내보내기',
        exportSuccess: '내보내기 성공',
        import: '가져오기',
        importSuccess: '가져오기 성공',
        clear: '지우기',
        clearSuccess: '지우기 성공',
        yes: '예',
        no: '아니오',
        confirm: '확인',
        download: '다운로드',
        noData: '데이터가 없습니다',
        wrong: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        success: '작업 성공',
        failed: '작업 실패',
        verify: '인증',
        unauthorizedTips: '권한이 없습니다. 먼저 인증을 진행해 주세요.',
    },
    chat: {
        newChatButton: '새로운 채팅',
        copy: '복사',
        copied: '복사 성공',
        copyCode: '코드 복사',
        usingContext: '컨텍스트 모드',
        turnOnContext: '현재 모드에서 메시지를 보내면 이전 채팅 기록이 포함됩니다.',
        turnOffContext: '현재 모드에서 메시지를 보내면 이전 채팅 기록이 포함되지 않습니다.',
        deleteHistoryConfirm: '이 기록을 삭제하시겠습니까?',
        clearHistoryConfirm: '채팅 기록을 모두 지우시겠습니까?',
        preview: '미리보기',
        showRawText: '원본 텍스트 표시',
        uploadFailed: '네트워크 오류로 인해 전송에 실패했습니다.',
        deleteCurrentPageDialog: '현재 페이지 대화 삭제 완료',
        uploadingFile: '파일 업로드 중',
        voiceOptions: '음성 옵션',
        sendingMessage: '전송',
        switchModel: '모델 전환',
        copyright: '저작권',
        previewImage: '이미지 미리보기',
        networkAccess: '네트워크 액세스',
        closeNetworkAccess: '인터넷 연결 끄기',
        openNetworkAccess: '인터넷 연결 켜기',
        contextStatus: '컨텍스트 상태',
        academicQuickAsk: '학술 빠른 질문',
        upload: '업로드',
        thinking: 'AI가 생각 중입니다',
        networkError: '네트워크 오류로 인해 전송에 실패했습니다.',
        loginSuccess: '계정 로그인 성공! 지금 바로 경험해 보세요!',
        purchaseSuccess: '구매해 주셔서 감사합니다. 즐겁게 사용하세요!',
        purchaseFailed: '아직 구매가 완료되지 않았습니다.',
        stopOutput: '출력 중지',
        exportImage: '이미지 내보내기',
        exportImageConfirm: '이미지를 내보내시겠습니까?',
        exportSuccess: '내보내기 성공',
        exportFailed: '내보내기 실패',
        deleteMessage: '메시지 삭제',
        deleteMessageConfirm: '이 메시지를 삭제하시겠습니까?',
        clearChat: '대화 지우기',
        clearChatConfirm: '현재 페이지의 대화를 지우시겠습니까?',
        placeholderMobile: '메시지를 입력하세요...',
        placeholder: '메시지를 입력하고 Enter 키를 눌러 보내세요.. (Shift + Enter = 줄 바꿈)',
    },
    setting: {
        setting: '설정',
        general: '개요',
        advanced: '고급',
        // config: '설정',
        personalInfo: '개인 정보',
        avatarLink: '아바타 링크',
        // name: '이름',
        name: '사용자 이름',
        sign: '사용자 서명',
        role: '역할 설정',
        resetUserInfo: '사용자 정보 초기화',
        chatHistory: '채팅 기록',
        theme: '테마',
        language: '언어',
        api: 'API',
        reverseProxy: '역방향 프록시',
        timeout: '시간 초과',
        socks: 'Socks',
        httpsProxy: 'HTTPS 프록시',
        balance: 'API 잔액',
    },
    error: {
        insufficientBalance: '잔액이 부족합니다',
        freeQuotaExhausted: '무료 할당량이 모두 소진되었습니다',
        unauthorized: '잘못된 작업입니다. 로그인 후 다시 시도해 주세요!',
        networkError: '네트워크 오류로 인해 전송에 실패했습니다.',
    },
    success: {
        purchaseThankYou: '구매해 주셔서 감사합니다. 즐겁게 사용하세요!',
        accountLoginSuccess: '계정 로그인 성공! 지금 바로 경험해 보세요!',
        deleteCurrentPageDialogComplete: '현재 페이지 대화 삭제 완료',
    },
    button: {
        stopOutput: '출력 중지',
        send: '전송',
        upload: '업로드',
    },
    tooltip: {
        contextStatus: '컨텍스트 모드',
        quickQuestion: '학술 빠른 질문',
        shop: '상점',
        networkAccess: '네트워크 액세스',
        switchModel: '모델 전환',
        closeNetworkAccess: '인터넷 연결 끄기',
        openNetworkAccess: '인터넷 연결 켜기',
    },
    label: {
        prompt: '프롬프트:',
    },
    modal: {
        uploadingFile: '파일 업로드 중',
    },
    store: {
        siderButton: '프롬프트 상점',
        local: '로컬',
        online: '온라인',
        title: '제목',
        description: '설명',
        clearStoreConfirm: '데이터를 지우시겠습니까?',
        importPlaceholder: 'JSON 데이터를 여기에 붙여넣으세요',
        addRepeatTitleTips: '제목이 중복됩니다. 다시 입력해 주세요.',
        addRepeatContentTips: '내용이 중복됩니다: {msg}. 다시 입력해 주세요.',
        editRepeatTitleTips: '제목이 충돌합니다. 다시 수정해 주세요.',
        editRepeatContentTips: '내용이 충돌합니다: {msg}. 다시 수정해 주세요.',
        importError: '키 값이 일치하지 않습니다.',
        importRepeatTitle: '제목이 중복되어 건너뜁니다: {msg}',
        importRepeatContent: '내용이 중복되어 건너뜁니다: {msg}',
        onlineImportWarning: '주의: JSON 파일 출처를 확인해 주세요!',
        downloadError: '네트워크 상태와 JSON 파일 유효성을 확인해 주세요.',
    },
    sidebar: {
        signInReward: '로그인 보상',
        themeSwitch: '테마 전환',
        personalCenter: '개인 정보',
        loginAccount: '로그인 계정',
        loginFirst: '로그인 후 이용해 주세요!',
    },
};
