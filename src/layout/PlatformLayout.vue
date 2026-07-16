<template>
  <div class="shell platform-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">P</span>
        <div>
          <strong>Store SaaS</strong>
          <small>平台管理</small>
        </div>
      </div>

      <nav class="nav-list">
        <button type="button" :class="{ active: section === 'review' }" @click="navigate('review')">
          <OfficeBuilding />
          <span>入驻审核</span>
        </button>
        <button type="button" :class="{ active: section === 'tenants' }" @click="navigate('tenants')">
          <OfficeBuilding />
          <span>租户管理</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>{{ section === 'review' ? '入驻审核' : '租户管理' }}</h1>
          <p>{{ section === 'review' ? '处理商户提交的门店入驻申请。' : '管理租户资料和商户后台访问权限。' }}</p>
        </div>
        <div class="session">
          <el-button :icon="Refresh" @click="loadTenants" :loading="loading">刷新</el-button>
          <span>{{ username }}</span>
          <el-button :icon="SwitchButton" @click="logout">退出</el-button>
        </div>
      </header>

      <section class="workspace">
        <div class="metric-grid platform-metrics">
          <article class="metric-card">
            <span>{{ section === 'review' ? '待审核' : '租户总数' }}</span>
            <strong>{{ section === 'review' ? pendingCount : tenants.length }}</strong>
            <small>{{ section === 'review' ? '需要平台管理员处理' : '当前筛选结果总数' }}</small>
          </article>
          <article class="metric-card">
            <span>已启用</span>
            <strong>{{ activeCount }}</strong>
            <small>商户可登录门店后台</small>
          </article>
          <article class="metric-card">
            <span>{{ section === 'review' ? '已拒绝' : '已停用' }}</span>
            <strong>{{ section === 'review' ? rejectedCount : disabledCount }}</strong>
            <small>账号保持不可登录</small>
          </article>
          <article class="metric-card">
            <span>全部</span>
            <strong>{{ tenants.length }}</strong>
            <small>{{ section === 'review' ? '按提交时间倒序展示' : '按创建时间倒序展示' }}</small>
          </article>
        </div>

        <section class="panel">
          <div class="panel-head">
            <div>
                <h2>{{ section === 'review' ? '入驻申请' : '租户列表' }}</h2>
                <p>{{ section === 'review' ? '优先处理待审核的商户申请。' : '租户删除后仅从平台列表隐藏，历史业务数据保留。' }}</p>
            </div>
            <el-segmented v-model="statusFilter" :options="currentStatusOptions" @change="loadTenants" />
          </div>

            <el-table v-loading="loading" :data="tenants" empty-text="暂无租户">
            <el-table-column prop="name" label="门店名称" min-width="180">
              <template #default="{ row }">
                <div class="tenant-cell">
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.tenantCode }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" min-width="170">
              <template #default="{ row }">{{ dateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="170">
              <template #default="{ row }">{{ dateTime(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="430" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <el-button
                    v-if="section === 'review'"
                    size="small"
                    type="primary"
                    :disabled="row.status !== TENANT_STATUS.PENDING"
                    :loading="workingId === row.id && workingAction === 'approve'"
                    @click="approve(row)"
                  >
                    通过
                  </el-button>
                  <el-button
                    v-if="section === 'review'"
                    size="small"
                    :disabled="row.status !== TENANT_STATUS.PENDING"
                    :loading="workingId === row.id && workingAction === 'reject'"
                    @click="reject(row)"
                  >
                    拒绝
                  </el-button>
                  <el-button
                    v-if="section === 'tenants'"
                    size="small"
                    :icon="Edit"
                    @click="openEdit(row)"
                  >编辑</el-button>
                  <el-button
                    v-if="section === 'tenants'"
                    size="small"
                    :icon="Setting"
                    @click="openMiniappConfig(row)"
                  >小程序</el-button>
                  <el-button
                    v-if="section === 'tenants' && row.status === TENANT_STATUS.ACTIVE"
                    size="small"
                    type="warning"
                    :loading="workingId === row.id && workingAction === 'disable'"
                    @click="setStatus(row, TENANT_STATUS.DISABLED)"
                  >停用</el-button>
                  <el-button
                    v-if="section === 'tenants' && row.status === TENANT_STATUS.DISABLED"
                    size="small"
                    type="success"
                    :loading="workingId === row.id && workingAction === 'enable'"
                    @click="setStatus(row, TENANT_STATUS.ACTIVE)"
                  >启用</el-button>
                  <el-button v-if="section === 'tenants'" size="small" type="danger" :icon="Delete" @click="remove(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </section>
    </main>

    <el-dialog v-model="editVisible" title="编辑租户" width="420px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="租户编码">
          <el-input :model-value="editForm.tenantCode" disabled />
        </el-form-item>
        <el-form-item label="租户名称" required>
          <el-input v-model="editForm.name" maxlength="128" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="workingAction === 'edit'" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="miniappVisible" title="小程序技术配置" width="500px" :close-on-click-modal="false">
      <el-form :model="miniappForm" label-position="top">
        <el-form-item label="绑定租户">
          <el-input :model-value="miniappForm.tenantName" disabled />
        </el-form-item>
        <el-form-item label="AppID" required>
          <el-input v-model.trim="miniappForm.appId" maxlength="18" placeholder="wx..." />
        </el-form-item>
        <el-form-item label="AppSecret" :required="!miniappForm.secretConfigured">
          <el-input
            v-model.trim="miniappForm.appSecret"
            show-password
            autocomplete="new-password"
            :placeholder="miniappForm.secretConfigured ? '已配置，留空保持不变' : '请输入AppSecret'"
          />
        </el-form-item>
        <el-alert
          :title="miniappForm.secretConfigured ? 'AppSecret 已加密保存，平台端不可查看原文' : '尚未配置 AppSecret'"
          :type="miniappForm.secretConfigured ? 'success' : 'warning'"
          :closable="false"
          show-icon
        />
        <el-form-item v-if="miniappForm.status !== null" label="配置状态" class="miniapp-status-field">
          <el-switch
            :model-value="miniappForm.status === MINIAPP_STATUS.ENABLED"
            inline-prompt
            active-text="启"
            inactive-text="停"
            :loading="miniappStatusSaving"
            @change="changeMiniappStatus"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="miniappVisible = false">取消</el-button>
        <el-button type="primary" :loading="miniappSaving" @click="saveMiniappConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, OfficeBuilding, Refresh, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ACCOUNT_TYPE_KEY, authApi, platformApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'

const TENANT_STATUS = {
  DISABLED: 0,
  ACTIVE: 1,
  PENDING: 2,
  REJECTED: 3
}
const MINIAPP_STATUS = { DISABLED: 0, ENABLED: 1 }

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: TENANT_STATUS.PENDING },
  { label: '已通过', value: TENANT_STATUS.ACTIVE },
  { label: '已停用', value: TENANT_STATUS.DISABLED },
  { label: '已拒绝', value: TENANT_STATUS.REJECTED }
]
const managementStatusOptions = [
  { label: '全部', value: '' },
  { label: '已启用', value: TENANT_STATUS.ACTIVE },
  { label: '已停用', value: TENANT_STATUS.DISABLED }
]

const route = useRoute()
const router = useRouter()
const section = ref(route.query.section === 'tenants' ? 'tenants' : 'review')
const username = ref(localStorage.getItem(USERNAME_KEY) || '')
const tenants = ref([])
const loading = ref(false)
const workingId = ref(null)
const workingAction = ref('')
const statusFilter = ref('')
const editVisible = ref(false)
const editForm = ref({ id: null, name: '', tenantCode: '' })
const miniappVisible = ref(false)
const miniappSaving = ref(false)
const miniappStatusSaving = ref(false)
const miniappForm = ref({ tenantId: null, tenantName: '', appId: '', appSecret: '', secretConfigured: false, status: null })
const currentStatusOptions = computed(() => section.value === 'review' ? statusOptions : managementStatusOptions)

const pendingCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.PENDING).length)
const activeCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.ACTIVE).length)
const rejectedCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.REJECTED).length)
const disabledCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.DISABLED).length)

function navigate(nextSection) {
  router.push({ query: nextSection === 'review' ? {} : { section: nextSection } })
}

function statusLabel(status) {
  return {
    [TENANT_STATUS.DISABLED]: '停用',
    [TENANT_STATUS.ACTIVE]: '已通过',
    [TENANT_STATUS.PENDING]: '待审核',
    [TENANT_STATUS.REJECTED]: '已拒绝'
  }[status] || '未知'
}

function statusType(status) {
  return {
    [TENANT_STATUS.DISABLED]: 'info',
    [TENANT_STATUS.ACTIVE]: 'success',
    [TENANT_STATUS.PENDING]: 'warning',
    [TENANT_STATUS.REJECTED]: 'danger'
  }[status] || 'info'
}

function dateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

async function loadTenants() {
  loading.value = true
  try {
    const params = statusFilter.value === '' ? {} : { status: statusFilter.value }
    tenants.value = await platformApi.listTenants(params) || []
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

watch(() => route.query.section, (value) => {
  section.value = value === 'tenants' ? 'tenants' : 'review'
  statusFilter.value = ''
  loadTenants()
}, { immediate: true })

async function approve(row) {
  workingId.value = row.id
  workingAction.value = 'approve'
  try {
    await platformApi.approveTenant(row.id)
    ElMessage.success('已审核通过，商户现在可以登录')
    await loadTenants()
  } catch (error) {
    showApiError(error)
  } finally {
    workingId.value = null
    workingAction.value = ''
  }
}

async function reject(row) {
  try {
    await ElMessageBox.confirm(`确认拒绝“${row.name}”的入驻申请？`, '拒绝申请', {
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  workingId.value = row.id
  workingAction.value = 'reject'
  try {
    await platformApi.rejectTenant(row.id)
    ElMessage.success('已拒绝该入驻申请')
    await loadTenants()
  } catch (error) {
    showApiError(error)
  } finally {
    workingId.value = null
    workingAction.value = ''
  }
}

function openEdit(row) {
  editForm.value = { id: row.id, name: row.name, tenantCode: row.tenantCode }
  editVisible.value = true
}

async function saveEdit() {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('请输入租户名称')
    return
  }
  workingAction.value = 'edit'
  try {
    await platformApi.updateTenant(editForm.value.id, { name: editForm.value.name })
    editVisible.value = false
    ElMessage.success('租户信息已更新')
    await loadTenants()
  } catch (error) {
    showApiError(error)
  } finally {
    workingAction.value = ''
  }
}

async function openMiniappConfig(row) {
  miniappForm.value = { tenantId: row.id, tenantName: row.name, appId: '', appSecret: '', secretConfigured: false, status: null }
  miniappVisible.value = true
  try {
    const config = await platformApi.miniappConfig(row.id)
    Object.assign(miniappForm.value, {
      appId: config?.appId || '',
      secretConfigured: !!config?.secretConfigured,
      status: config?.status ?? null
    })
  } catch (error) {
    showApiError(error)
  }
}

async function saveMiniappConfig() {
  const form = miniappForm.value
  if (!/^wx[a-zA-Z0-9]{16}$/.test(form.appId)) {
    ElMessage.warning('请输入正确的18位小程序AppID')
    return
  }
  if (!form.secretConfigured && !form.appSecret) {
    ElMessage.warning('首次配置必须填写AppSecret')
    return
  }
  miniappSaving.value = true
  try {
    const config = await platformApi.saveMiniappConfig(form.tenantId, {
      appId: form.appId,
      appSecret: form.appSecret
    })
    Object.assign(form, {
      appSecret: '',
      secretConfigured: !!config?.secretConfigured,
      status: config?.status ?? MINIAPP_STATUS.ENABLED
    })
    ElMessage.success('小程序配置已保存')
  } catch (error) {
    showApiError(error)
  } finally {
    miniappSaving.value = false
  }
}

async function changeMiniappStatus(enabled) {
  const previous = miniappForm.value.status
  miniappStatusSaving.value = true
  try {
    const status = enabled ? MINIAPP_STATUS.ENABLED : MINIAPP_STATUS.DISABLED
    const config = await platformApi.setMiniappConfigStatus(miniappForm.value.tenantId, status)
    miniappForm.value.status = config?.status ?? status
    ElMessage.success(enabled ? '小程序配置已启用' : '小程序配置已停用')
  } catch (error) {
    miniappForm.value.status = previous
    showApiError(error)
  } finally {
    miniappStatusSaving.value = false
  }
}

async function setStatus(row, status) {
  const label = status === TENANT_STATUS.ACTIVE ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确认${label}“${row.name}”？`, `${label}租户`, {
      confirmButtonText: label,
      cancelButtonText: '取消',
      type: status === TENANT_STATUS.ACTIVE ? 'success' : 'warning'
    })
  } catch {
    return
  }
  workingId.value = row.id
  workingAction.value = status === TENANT_STATUS.ACTIVE ? 'enable' : 'disable'
  try {
    await platformApi.setTenantStatus(row.id, status)
    ElMessage.success(`已${label}租户`)
    await loadTenants()
  } catch (error) {
    showApiError(error)
  } finally {
    workingId.value = null
    workingAction.value = ''
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`删除后将从列表隐藏，确认删除“${row.name}”？`, '删除租户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  workingId.value = row.id
  workingAction.value = 'delete'
  try {
    await platformApi.deleteTenant(row.id)
    ElMessage.success('租户已删除')
    await loadTenants()
  } catch (error) {
    showApiError(error)
  } finally {
    workingId.value = null
    workingAction.value = ''
  }
}

async function logout() {
  try {
    await authApi.logout()
  } catch (error) {
    showApiError(error)
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(ACCOUNT_TYPE_KEY)
    window.location.href = '/platform/login'
  }
}

</script>
