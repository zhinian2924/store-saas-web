<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>员工账号</h2>
          <p>店主可创建店员账号，按岗位带出默认权限后再微调授权。</p>
        </div>
        <el-button v-if="canAddStaff" :icon="Plus" type="primary" @click="openCreate">新增员工</el-button>
      </div>

      <el-table v-loading="loading" :data="staff" stripe empty-text="暂无员工">
        <el-table-column label="员工" min-width="180">
          <template #default="{ row }">
            <div class="staff-cell">
              <span>{{ row.nickname?.slice(0, 1) || '员' }}</span>
              <div>
                <strong>{{ row.nickname || '店员' }}</strong>
                <small>{{ row.mobile }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位" width="140">
          <template #default="{ row }">{{ roleText[row.staffRole] || row.staffRole }}</template>
        </el-table-column>
        <el-table-column label="授权" min-width="220">
          <template #default="{ row }">
            <div class="permission-tags">
              <el-tag v-for="code in row.permissions" :key="code" size="small">{{ permissionText[code] || code }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-if="canUpdateStaff" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="canDisableStaff" size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑员工' : '新增员工'" width="680px">
      <el-form :model="form" label-position="top" class="staff-form">
        <el-form-item label="手机号">
          <el-input v-model.trim="form.mobile" :disabled="Boolean(editingId)" placeholder="员工登录手机号" />
        </el-form-item>
        <el-form-item :label="editingId ? '新密码' : '登录密码'">
          <el-input v-model="form.password" show-password :placeholder="editingId ? '不修改可留空' : '请输入登录密码'" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model.trim="form.nickname" placeholder="例如 小王" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="form.staffRole" @change="applyRolePermissions">
            <el-option label="订单专员" value="CASHIER" />
            <el-option label="库管" value="WAREHOUSE" />
            <el-option label="助理" value="MANAGER_ASSISTANT" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions" class="permission-grid">
            <el-checkbox v-for="item in permissionOptions" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveStaff">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PERMISSIONS_KEY, showApiError, staffApi } from '../../api'

const roleText = {
  CASHIER: '订单专员',
  WAREHOUSE: '库管',
  MANAGER_ASSISTANT: '助理'
}

const roleDefaults = {
  CASHIER: ['order:view', 'order:update'],
  WAREHOUSE: ['product:view', 'product:add', 'product:update', 'inventory:view', 'inventory:adjust'],
  MANAGER_ASSISTANT: ['store:view', 'product:view', 'inventory:view', 'order:view', 'staff:view', 'statistics:view']
}

const permissionOptions = [
  { value: 'store:view', label: '查看门店资料' },
  { value: 'store:update', label: '修改门店信息' },
  { value: 'product:view', label: '查看商品' },
  { value: 'product:add', label: '新增商品' },
  { value: 'product:update', label: '维护商品' },
  { value: 'inventory:view', label: '查看库存' },
  { value: 'inventory:adjust', label: '调整库存' },
  { value: 'order:view', label: '查看订单' },
  { value: 'order:update', label: '处理订单' },
  { value: 'staff:view', label: '查看员工' },
  { value: 'statistics:view', label: '经营概览' }
]

const permissionText = Object.fromEntries(permissionOptions.map((item) => [item.value, item.label]))
const permissions = readPermissions()
const canAddStaff = permissions.includes('staff:add')
const canUpdateStaff = permissions.includes('staff:update')
const canDisableStaff = permissions.includes('staff:disable')

const staff = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  mobile: '',
  password: '',
  nickname: '',
  staffRole: 'CASHIER',
  permissions: [...roleDefaults.CASHIER]
})

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

async function loadStaff() {
  loading.value = true
  try {
    staff.value = await staffApi.list() || []
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    mobile: '',
    password: '',
    nickname: '',
    staffRole: 'CASHIER',
    permissions: [...roleDefaults.CASHIER]
  })
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    mobile: row.mobile,
    password: '',
    nickname: row.nickname || '',
    staffRole: row.staffRole,
    permissions: [...(row.permissions || [])]
  })
  dialogVisible.value = true
}

function applyRolePermissions() {
  form.permissions = [...(roleDefaults[form.staffRole] || [])]
}

async function saveStaff() {
  if (!form.mobile || (!editingId.value && !form.password)) {
    ElMessage.warning('请填写手机号和登录密码')
    return
  }
  saving.value = true
  try {
    const payload = {
      password: form.password,
      nickname: form.nickname,
      staffRole: form.staffRole,
      permissions: form.permissions
    }
    if (editingId.value) {
      await staffApi.update(editingId.value, payload)
    } else {
      await staffApi.create({ ...payload, mobile: form.mobile })
    }
    ElMessage.success('员工已保存')
    dialogVisible.value = false
    loadStaff()
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  try {
    await staffApi.setStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('状态已更新')
    loadStaff()
  } catch (error) {
    showApiError(error)
  }
}

onMounted(loadStaff)
</script>
