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
        <button type="button" class="active">
          <OfficeBuilding />
          <span>入驻审核</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>商户入驻审核</h1>
          <p>处理商户提交的门店入驻申请，审核通过后账号才可登录。</p>
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
            <span>待审核</span>
            <strong>{{ pendingCount }}</strong>
            <small>需要平台管理员处理</small>
          </article>
          <article class="metric-card">
            <span>已通过</span>
            <strong>{{ activeCount }}</strong>
            <small>商户可登录门店后台</small>
          </article>
          <article class="metric-card">
            <span>已拒绝</span>
            <strong>{{ rejectedCount }}</strong>
            <small>账号保持不可登录</small>
          </article>
          <article class="metric-card">
            <span>全部申请</span>
            <strong>{{ tenants.length }}</strong>
            <small>按提交时间倒序展示</small>
          </article>
        </div>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>申请列表</h2>
              <p>优先处理“待审核”的商户申请。</p>
            </div>
            <el-segmented v-model="statusFilter" :options="statusOptions" @change="loadTenants" />
          </div>

          <el-table v-loading="loading" :data="tenants" empty-text="暂无入驻申请">
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
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="row.status !== TENANT_STATUS.PENDING"
                    :loading="workingId === row.id && workingAction === 'approve'"
                    @click="approve(row)"
                  >
                    通过
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="row.status !== TENANT_STATUS.PENDING"
                    :loading="workingId === row.id && workingAction === 'reject'"
                    @click="reject(row)"
                  >
                    拒绝
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, Refresh, SwitchButton } from '@element-plus/icons-vue'
import { ACCOUNT_TYPE_KEY, authApi, platformApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'

const TENANT_STATUS = {
  DISABLED: 0,
  ACTIVE: 1,
  PENDING: 2,
  REJECTED: 3
}

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: TENANT_STATUS.PENDING },
  { label: '已通过', value: TENANT_STATUS.ACTIVE },
  { label: '已拒绝', value: TENANT_STATUS.REJECTED }
]

const username = ref(localStorage.getItem(USERNAME_KEY) || '')
const tenants = ref([])
const loading = ref(false)
const workingId = ref(null)
const workingAction = ref('')
const statusFilter = ref('')

const pendingCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.PENDING).length)
const activeCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.ACTIVE).length)
const rejectedCount = computed(() => tenants.value.filter((item) => item.status === TENANT_STATUS.REJECTED).length)

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

onMounted(loadTenants)
</script>
