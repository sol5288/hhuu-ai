import type { Settings } from '#/global'
import { atob, copyRight } from '@/constants/copyright'

// 이것은 기본 버전 데모 소스 코드의 사용자 지정 구성 예입니다.
const globalSettings: Settings.all = {
  app: {
    enablePermission: false,
    enableDynamicTitle: true,
    enableAppSetting: false,
    // colorScheme: 'dark',
    colorScheme: 'light',
    elementSize: 'default',
    iconifyOfflineUse: false,
    enableProgress: true,
    routeBaseOn: 'frontend',
    language : 'ko-KR', // 08.24 i18n-다국어처리
  },
  layout: {
    enableMobileAdaptation: true,
  },
  menu: {
    enableSubMenuCollapseButton: true,
    enableHotkeys: true,
    baseOn: 'frontend',
    menuMode: 'single',
    switchMainMenuAndPageJump: false,
    subMenuUniqueOpened: true,
    subMenuCollapse: false,
  },
  topbar: {
    mode: 'fixed',
  },
  toolbar: {
    enableFullscreen: true,
    enablePageReload: true,
    enableColorScheme: true,
  },
  home: {
    enable: true,
    title: '首页',
  },
  breadcrumb: {
    enable: true,
  },
  navSearch: {
    enable: true,
    enableHotkeys: true,
  },
  copyright: {
    enable: true,
    dates: atob(copyRight.name),
    company: atob(copyRight.qnum),
    website: atob(copyRight.website),
    beian: atob(copyRight.wex),
  },
}

export default globalSettings
