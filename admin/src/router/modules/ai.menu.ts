import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/ai',
  component: Layout,
  redirect: '/ai/chat-key-list',
  name: 'AiMenu',
  meta: {
    title: 'common.modelManagement',
    icon: 'sidebar-ai',
  },
  children: [
    // {
    //   path: 'models',
    //   name: 'AiMenuModels',
    //   component: () => import('@/views/models/index.vue'),
    //   meta: { title: '模型设置', icon: 'menu-model', },
    // },
    {
      path: 'keys',
      name: 'AiMenuKeys',
      component: () => import('@/views/models/key.vue'),
      meta: { title: 'common.poolSettings', icon: 'menu-key', },
    },
    {
      path: 'model',
      name: 'AiMenuInterface',
      component: () => import('@/views/system/interface.vue'),
      meta: {
        title: 'common.globalModelConfig',
        icon: 'menu-model',
      },
    },
    // {
    //   path: 'chat-key-list',
    //   name: 'AiMenuChatKeyList',
    //   component: () => import('@/views/keys/list.vue'),
    //   meta: {
    //     title: 'key列表[废弃]',
    //     icon: 'menu-key',
    //   },
    // },
    {
      path: 'model-pre',
      name: 'AiMenuModelPre',
      component: () => import('@/views/ai/globalPre.vue'),
      meta: { title: 'common.headerPreset', icon: 'menu-header', },
    },
  ],
}

export default routes
