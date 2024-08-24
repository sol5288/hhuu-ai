// typescript:admin/src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useNProgress } from '@vueuse/integrations/useNProgress'
import '@/assets/styles/nprogress.scss'

// 라우팅 관련 데이터
import { asyncRoutes, asyncRoutesByFilesystem, constantRoutes, constantRoutesByFilesystem } from './routes'
import pinia from '@/store'
import useSettingsStore from '@/store/modules/settings'
import useKeepAliveStore from '@/store/modules/keepAlive'
import useUserStore from '@/store/modules/user'
import useMenuStore from '@/store/modules/menu'
import useRouteStore from '@/store/modules/route'

// NProgress 로딩 상태를 가져옵니다.
const { isLoading } = useNProgress()

// 라우터를 생성합니다.
const router = createRouter({
  history: createWebHashHistory(import.meta.env.VITE_BASE_PATH),
  // 라우팅 기반 설정에 따라 기본 라우팅 목록을 설정합니다.
  routes: useSettingsStore(pinia).settings.app.routeBaseOn === 'filesystem' ? constantRoutesByFilesystem : constantRoutes as RouteRecordRaw[],
})

// 라우터 전환 전에 실행되는 콜백 함수입니다.
router.beforeEach(async (to, from, next) => {
  // 설정, 사용자, 메뉴, 라우팅 스토어를 가져옵니다.
  const settingsStore = useSettingsStore()
  const userStore = useUserStore()
  const menuStore = useMenuStore()
  const routeStore = useRouteStore()

  // 진행 표시 여부에 따라 로딩 상태를 설정합니다.
  settingsStore.settings.app.enableProgress && (isLoading.value = true)
  // 사용자가 로그인 했는지 확인합니다.
  if (userStore.isLogin) {
    // 권한에 따라 동적으로 라우팅이 생성되었는지 확인합니다.
    if (routeStore.isGenerate) {
      // 탐색 모드가 single이 아니면 현재 경로에 따라 메뉴를 활성화합니다.
      settingsStore.settings.menu.menuMode !== 'single' && menuStore.setActived(to.path)
      // 로그인 상태에서 로그인 페이지로 이동하면 홈 페이지로 리디렉션합니다.
      if (to.name === 'login') {
        next({
          name: 'home',
          replace: true,
        })
      }
      // 홈 페이지가 비활성화되어 있고 홈 페이지로 이동하면 측면 메뉴의 첫 번째 모듈로 이동합니다.
      else if (!settingsStore.settings.home.enable && to.name === 'home') {
        if (menuStore.sidebarMenus.length > 0) {
          next({
            path: menuStore.sidebarMenusFirstDeepestPath,
            replace: true,
          })
        }
        // 측면 메뉴의 첫 번째 모듈을 찾을 수 없으면 홈 페이지로 이동합니다.
        else {
          next()
        }
      }
      // 일반적인 페이지 액세스입니다.
      else {
        next()
      }
    }
    else {
      // 동적 라우팅을 생성합니다.
      switch (settingsStore.settings.app.routeBaseOn) {
        case 'frontend':
          await routeStore.generateRoutesAtFront(asyncRoutes)
          break
        case 'backend':
          await routeStore.generateRoutesAtBack()
          break
        case 'filesystem':
          await routeStore.generateRoutesAtFilesystem(asyncRoutesByFilesystem)
          // 파일 시스템에서 생성된 라우팅은 수동으로 탐색 데이터를 생성해야 합니다.
          switch (settingsStore.settings.menu.baseOn) {
            case 'frontend':
              await menuStore.generateMenusAtFront()
              break
            case 'backend':
              await menuStore.generateMenusAtBack()
              break
          }
          break
      }
      // 라우팅을 등록하고 데이터를 기록합니다.
      // 기록된 데이터는 로그아웃 시 사용됩니다.
      // router.removeRoute를 사용하지 않는 이유는 구성된 라우팅에 name이 설정되지 않을 수 있기 때문입니다.
      // router.addRoute()를 호출하여 반환된 콜백을 통해 삭제합니다.
      const removeRoutes: Function[] = []
      routeStore.flatRoutes.forEach((route) => {
        if (!/^(https?:|mailto:|tel:)/.test(route.path)) {
          removeRoutes.push(router.addRoute(route as RouteRecordRaw))
        }
      })
      if (settingsStore.settings.app.routeBaseOn !== 'filesystem') {
        routeStore.flatSystemRoutes.forEach((route) => {
          removeRoutes.push(router.addRoute(route as RouteRecordRaw))
        })
      }
      routeStore.setCurrentRemoveRoutes(removeRoutes)
      // 동적 라우팅이 생성되고 등록된 후 현재 라우팅으로 다시 이동합니다.
      next({
        path: to.path,
        query: to.query,
        replace: true,
      })
    }
  }
  else {
    // 로그인하지 않은 경우 로그인 페이지로 리디렉션합니다.
    if (to.name !== 'login') {
      next({
        name: 'login',
        query: {
          redirect: to.fullPath !== '/' ? to.fullPath : undefined,
        },
      })
    }
    else {
      next()
    }
  }
})

// 라우터 전환 후에 실행되는 콜백 함수입니다.
router.afterEach((to, from) => {
  // 설정, keep-alive 스토어를 가져옵니다.
  const settingsStore = useSettingsStore()
  const keepAliveStore = useKeepAliveStore()
  // 진행 표시 여부에 따라 로딩 상태를 설정합니다.
  settingsStore.settings.app.enableProgress && (isLoading.value = false)
  // 페이지 제목을 설정합니다.
  if (settingsStore.settings.app.routeBaseOn !== 'filesystem') {
    settingsStore.setTitle(to.meta.breadcrumbNeste?.at(-1)?.title ?? to.meta.title)
  }
  else {
    settingsStore.setTitle(to.meta.title)
  }
  // 현재 페이지가 캐시 여부를 확인하고 캐시가 활성화되면 현재 페이지의 이름을 keep-alive 전역 상태에 저장합니다.
  if (to.meta.cache) {
    const componentName = to.matched.at(-1)?.components?.default.name
    if (componentName) {
      keepAliveStore.add(componentName)
    }
    else {

    }
  }
  // 이전 페이지가 캐시 여부를 확인하고 캐시가 활성화되면 캐시 규칙에 따라 keep-alive 전역 상태에서 이전 페이지의 이름을 삭제할지 여부를 판단합니다.
  if (from.meta.cache) {
    const componentName = from.matched.at(-1)?.components?.default.name
    if (componentName) {
    // meta.cache를 통해 어떤 페이지를 캐시할지 판단합니다.
      switch (typeof from.meta.cache) {
        case 'string':
          if (from.meta.cache !== to.name) {
            keepAliveStore.remove(componentName)
          }
          break
        case 'object':
          if (!from.meta.cache.includes(to.name as string)) {
            keepAliveStore.remove(componentName)
          }
          break
      }
      // reload 페이지로 이동하면 이전 페이지의 캐시도 삭제합니다.
      if (to.name === 'reload') {
        keepAliveStore.remove(componentName)
      }
    }
  }
  document.documentElement.scrollTop = 0
})

export default router
