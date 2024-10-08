<route lang="yaml">
meta:
  title: 九宫格预设分类
</route>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import ApiChatgpt from '@/api/modules/chatgpt'
import IconifyIcon from '@/components/IconifyIcon/index.vue'

const loadingChatType = ref(false)
const loadingChatBox = ref(false)
const formPackageChatBoxTypeRef = ref<FormInstance>()
const formPackageChatBoxRef = ref<FormInstance>()

const activeChatBoxTypeId = ref(0)
const activeChatBoxId = ref(0)

const formPackageChatBoxType = reactive({
  status: true,
  name: '',
  order: 100,
  icon: '',
})

const formPackageChatBox = reactive({
  typeId: '',
  status: true,
  title: '',
  order: 100,
  prompt: '',
})

const rulesChatBoxType = reactive<FormRules>({
  status: [{ required: true, message: '请选择开启状态', trigger: 'change' }],
  name: [{ required: true, message: '请填写分类名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请填写分类图标', trigger: 'blur' }],
  order: [{ required: true, message: '请填写排序id 越大越靠前', trigger: 'blur' }],
})

const rulesChatBox = reactive<FormRules>({
  typeId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择开启状态', trigger: 'change' }],
  title: [{ required: true, message: '请填写标题名称', trigger: 'blur' }],
  order: [{ required: true, message: '请填写排序id 越大越靠前', trigger: 'blur' }],
  prompt: [{ required: false, message: '请填写快捷描述语', trigger: 'blur' }],
})

function handlerCloseDialogChatBoxType(formEl: FormInstance | undefined) {
  activeChatBoxTypeId.value = 0
  formEl?.resetFields()
}

function handlerCloseDialogChatBox(formEl: FormInstance | undefined) {
  activeChatBoxId.value = 0
  formEl?.resetFields()
}
const visibleChatBoxType = ref(false)
const visibleChatBox = ref(false)
const typeName = ref('chatBoxType')
const dialogTitleChatBoxType = computed(() => activeChatBoxTypeId.value ? '更新分类' : '新增分类')
const dialogTitleChatBox = computed(() => activeChatBoxId.value ? '更新子项' : '新增子项')

const dialogButtonChatBoxType = computed(() => {
  return activeChatBoxTypeId.value ? '确认更新' : '确认新增'
})

const chatBoxTypeData = ref([])
const chatBoxData = ref([])

/* 查询所有内容 */
async function queryAllChatBoxType() {
  try {
    loadingChatType.value = true
    const res = await ApiChatgpt.queryChatPreTypes()
    loadingChatType.value = false
    chatBoxTypeData.value = res.data
  }
  catch (error) {
    loadingChatType.value = false
  }
}

async function queryAllChatBox() {
  try {
    loadingChatBox.value = true
    const res = await ApiChatgpt.queryChatPres()
    loadingChatBox.value = false
    chatBoxData.value = res.data
  }
  catch (error) {
    loadingChatBox.value = false
  }
}

async function handleDeleteChatBoxType(row: any) {
  const { id } = row
  await ApiChatgpt.delChatPreType({ id })
  ElMessage({ type: 'success', message: '操作完成' })
  queryAllChatBoxType()
}

async function handleDeleteChatBox(row: any) {
  const { id } = row
  await ApiChatgpt.delChatPre({ id })
  ElMessage({ type: 'success', message: '操作完成' })
  queryAllChatBox()
}

function handleEditChatboxType(row: any) {
  activeChatBoxTypeId.value = row.id
  const { status, name, icon, order } = row
  nextTick(() => {
    Object.assign(formPackageChatBoxType, { status, name, icon, order })
  })
  visibleChatBoxType.value = true
}

function handleEditChatbox(row: any) {
  activeChatBoxId.value = row.id
  const { title, order, status, typeId, prompt } = row
  nextTick(() => {
    Object.assign(formPackageChatBox, { title, order, status, typeId, prompt })
  })
  visibleChatBox.value = true
}

function changeTab(name: string) {
  if (name === 'chatBoxType') {
    queryAllChatBoxType()
  }
  else {
    queryAllChatBox()
  }
}

async function handlerSubmitChatBoxType(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      const params: any = JSON.parse(JSON.stringify(formPackageChatBoxType))
      delete params.id
      activeChatBoxTypeId.value && (params.id = activeChatBoxTypeId.value)
      await ApiChatgpt.setChatPreType(params)
      ElMessage({ type: 'success', message: '操作成功' })
      activeChatBoxTypeId.value = 0
      visibleChatBoxType.value = false
      queryAllChatBoxType()
    }
  })
}

async function handlerSubmitChatBox(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      const params: any = JSON.parse(JSON.stringify(formPackageChatBox))
      console.log('params: ', params)
      delete params.id
      activeChatBoxId.value && (params.id = activeChatBoxId.value)
      await ApiChatgpt.setChatPre(params)
      ElMessage({ type: 'success', message: '操作成功' })
      activeChatBoxId.value = 0
      visibleChatBox.value = false
      queryAllChatBox()
    }
  })
}

const addBtnText = computed(() => typeName.value === 'chatBoxType' ? '添加快问分类' : '添加预设问题')

function handleAdd() {
  if (typeName.value === 'chatBoxType') {
    visibleChatBoxType.value = true
  }
  else {
    visibleChatBox.value = true
  }
}

onMounted(() => {
  queryAllChatBoxType()
})
</script>

<template>
  <div>
    <page-main class="header">
      <el-alert show-icon title="快问说明"
        description="此处设置用于对话窗口的左下角、点击可以快速打开我们创建的分类、每个分类下我们可以预设一些提问、只需要在提问的地方 补充其他内容即可完成快速提问" type="success" />
      <el-button type="success" class="ml-3" size="large" @click="handleAdd">
        {{ addBtnText }}
        <el-icon class="ml-3">
          <Plus />
        </el-icon>
      </el-button>
    </page-main>
    <page-main style="width: 100%;">
      <el-tabs v-model="typeName" type="border-card" @tab-change="changeTab">
        <el-tab-pane name="chatBoxType" label="分类管理">
          <el-table v-loading="loadingChatType" border :data="chatBoxTypeData" style="width: 100%;" size="large">
            <el-table-column prop="status" align="center" label="分类状态">
              <template #default="scope">
                <el-tag :type="scope.row.status ? 'success' : 'danger'">
                  {{ scope.row.status ? '开启中' : '已关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="分类名称" />
            <el-table-column prop="order" label="排序ID" />
            <el-table-column prop="icon" label="分类图标">
              <template #default="scope">
                <IconifyIcon style="font-size: 24px;" :icon="scope.row.icon" />
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" align="center" width="180">
              <template #default="scope">
                <el-button link type="primary" size="small" @click="handleEditChatboxType(scope.row)">
                  变更
                </el-button>
                <el-popconfirm title="确认删除此提示词么?" width="180" icon-color="red"
                  @confirm="handleDeleteChatBoxType(scope.row)">
                  <template #reference>
                    <el-button link type="danger" size="small">
                      删除分类
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane name="chatBox" label="子类管理">
          <el-table v-loading="loadingChatBox" border :data="chatBoxData" style="width: 100%;" size="large">
            <el-table-column prop="typeInfo.name" label="所属分类" width="120" align="center" />
            <el-table-column prop="status" label="开启状态" width="120" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status ? 'success' : 'danger'">
                  {{ scope.row.status ? '开启中' : '已关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题名称" width="180" align="center" />
            <el-table-column prop="order" label="排序ID" width="90" align="center" />
            <el-table-column prop="prompt" label="快捷预问题" />
            <el-table-column fixed="right" label="操作" align="center" width="180">
              <template #default="scope">
                <el-button link type="primary" size="small" @click="handleEditChatbox(scope.row)">
                  变更
                </el-button>
                <el-popconfirm title="确认删除此提示词么?" width="180" icon-color="red"
                  @confirm="handleDeleteChatBox(scope.row)">
                  <template #reference>
                    <el-button link type="danger" size="small">
                      删除分类
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </page-main>

    <!-- type -->
    <el-dialog v-model="visibleChatBoxType" :close-on-click-modal="false" :title="dialogTitleChatBoxType" width="770"
      @close="handlerCloseDialogChatBoxType(formPackageChatBoxTypeRef)">
      <el-form ref="formPackageChatBoxTypeRef" label-position="right" label-width="120px"
        :model="formPackageChatBoxType" :rules="rulesChatBoxType">
        <el-form-item label="分类启用状态" prop="status">
          <el-switch v-model="formPackageChatBoxType.status" />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px;">
                关闭当前分类、用户端将不再展示
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="排序Order" prop="order">
          <el-input v-model="formPackageChatBoxType.order" placeholder="排序id越大越靠前" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formPackageChatBoxType.name" placeholder="请填写提示词名称（用户看到的名称）" />
        </el-form-item>
        <!-- <el-form-item label="分类图标" prop="proxyUrl">
          <el-input  v-model="formPackageChatBoxType.icon" placeholder="请填写分类图标" />
        </el-form-item> -->
      </el-form>
      <template #footer>
        <span class="flex justify-end mr-5">
          <el-button @click="visibleChatBoxType = false">取消</el-button>
          <el-button type="primary" @click="handlerSubmitChatBoxType(formPackageChatBoxTypeRef)">
            {{ dialogButtonChatBoxType }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- box -->
    <el-dialog v-model="visibleChatBox" :close-on-click-modal="false" :title="dialogTitleChatBox" width="770"
      @close="handlerCloseDialogChatBox(formPackageChatBoxRef)">
      <el-form ref="formPackageChatBoxTypeRef" label-position="right" label-width="120px" :model="formPackageChatBox"
        :rules="rulesChatBox">
        <el-form-item label="启用状态" prop="status">
          <el-switch v-model="formPackageChatBoxType.status" />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px;">
                关闭当前子项、用户端将不再展示
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="选择分类" prop="typeId">
          <el-select v-model="formPackageChatBox.typeId" placeholder="请选择分类状态" clearable style="width: 100%;">
            <el-option v-for="item in chatBoxTypeData" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题名称" prop="title">
          <el-input v-model="formPackageChatBox.title" placeholder="请填写子项标题名称" />
        </el-form-item>
        <el-form-item label="排序Order" prop="order">
          <el-input v-model="formPackageChatBox.order" placeholder="排序id越大越靠前" />
        </el-form-item>
        <el-form-item label="预设问题" prop="prompt">
          <el-input v-model="formPackageChatBox.prompt" type="textarea" :rows="5"
            placeholder="请填写预设问题、如果设置了应用、那么点击优先跳转应用、如果未设置、点击则会直接在对话中发当前填写预设内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="flex justify-end mr-5">
          <el-button @click="visibleChatBox = false">取消</el-button>
          <el-button type="primary" @click="handlerSubmitChatBox(formPackageChatBoxTypeRef)">
            {{ dialogButtonChatBoxType }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
