<template>
  <div class="shell store-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">S</span>
        <div>
          <strong>Store SaaS</strong>
          <small>门店进销存</small>
        </div>
      </div>

      <div class="sidebar-divider" />

      <nav class="nav-list">
        <button
          v-for="item in nav"
          :key="item.key"
          type="button"
          :class="{ active: active === item.key }"
          @click="active = item.key"
        >
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-title">
          <h1>{{ currentTitle }}</h1>
          <p>{{ currentSubtitle }}</p>
        </div>
        <div class="session">
          <el-button class="session-action" :icon="Refresh" @click="refreshCurrent" :loading="loading">刷新</el-button>
          <span class="session-divider" />
          <button class="session-account" type="button" @click="openAccount">
            <span class="session-account-name">{{ username }}</span>
            <span class="session-account-label">账号设置</span>
          </button>
          <span class="session-divider" />
          <el-button class="session-logout" :icon="SwitchButton" @click="logout">退出</el-button>
        </div>
      </header>

      <section v-loading="loading && firstLoaded" class="workspace">
        <DashboardView
          v-if="active === 'dashboard'"
          :products="products"
          :orders="orders"
          :flows="flows"
        />
        <ProductsView
          v-if="active === 'products'"
          :categories="categories"
          :products="products"
          @refresh="loadCatalog"
        />
        <StoreProfileView
          v-if="active === 'store'"
          :reload-key="storeReloadKey"
        />
        <InventoryView
          v-if="active === 'inventory'"
          :products="products"
          :flows="flows"
          @refresh="loadInventory"
        />
        <OrdersView
          v-if="active === 'orders'"
          :products="products"
          :orders="orders"
          @refresh="loadOrdersAndCatalog"
        />
        <StaffView v-if="active === 'staff'" />
      </section>
    </main>

    <el-dialog v-model="accountDialogVisible" title="我的账号" width="460px">
      <el-form :model="accountForm" label-position="top">
        <el-form-item label="手机号">
          <el-input v-model="accountForm.mobile" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model.trim="accountForm.nickname" maxlength="64" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="accountForm.password" show-password placeholder="不修改可留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="accountSaving" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Box, Goods, Refresh, Shop, ShoppingCart, SwitchButton, TrendCharts, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ACCOUNT_TYPE_KEY, authApi, inventoryApi, orderApi, PERMISSIONS_KEY, productApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'
import DashboardView from '../views/DashboardView.vue'
import InventoryView from '../views/InventoryView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProductsView from '../views/ProductsView.vue'
import StaffView from '../views/StaffView.vue'
import StoreProfileView from '../views/StoreProfileView.vue'

const allNav = [
  { key: 'dashboard', label: '经营概览', subtitle: '门店商品、库存、订单的实时经营视图', icon: TrendCharts, any: ['product:view', 'inventory:view', 'order:view'] },
  { key: 'store', label: '门店信息', subtitle: '维护门店名称、地址、营业时间和 LOGO', icon: Shop, permission: 'store:view' },
  { key: 'products', label: '商品管理', subtitle: '维护分类、商品档案、售价和初始库存', icon: Goods, permission: 'product:view' },
  { key: 'inventory', label: '库存管理', subtitle: '处理入库、报损、盘点和库存流水追踪', icon: Box, permission: 'inventory:view' },
  { key: 'orders', label: '订单管理', subtitle: '创建门店订单、查看明细并完成模拟支付', icon: ShoppingCart, permission: 'order:view' },
  { key: 'staff', label: '员工管理', subtitle: '创建店员账号，按岗位授权并控制启停状态', icon: User, permission: 'staff:view' }
]

const active = ref('dashboard')
const username = ref(localStorage.getItem(USERNAME_KEY) || '')
const permissions = ref(readPermissions())
const loading = ref(false)
const firstLoaded = ref(false)
const categories = ref([])
const products = ref([])
const flows = ref([])
const orders = ref([])
const storeReloadKey = ref(0)
const accountDialogVisible = ref(false)
const accountSaving = ref(false)
const accountForm = reactive({
  mobile: '',
  nickname: '',
  password: ''
})

const nav = computed(() => allNav.filter((item) => canOpen(item)))
const currentNav = computed(() => nav.value.find((item) => item.key === active.value) || nav.value[0] || allNav[0])
const currentTitle = computed(() => currentNav.value.label)
const currentSubtitle = computed(() => currentNav.value.subtitle)

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function hasPermission(permission) {
  return permissions.value.includes(permission)
}

function canOpen(item) {
  if (item.permission) return hasPermission(item.permission)
  if (item.any) return item.any.some(hasPermission)
  return true
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
    localStorage.removeItem(PERMISSIONS_KEY)
    username.value = ''
    active.value = 'dashboard'
    window.location.href = '/login'
  }
}

async function openAccount() {
  accountDialogVisible.value = true
  accountForm.password = ''
  try {
    const profile = await authApi.me()
    Object.assign(accountForm, {
      mobile: profile?.mobile || '',
      nickname: profile?.nickname || profile?.username || '',
      password: ''
    })
  } catch (error) {
    showApiError(error)
  }
}

async function saveAccount() {
  if (!accountForm.nickname.trim()) {
    ElMessage.warning('请填写昵称')
    return
  }
  accountSaving.value = true
  try {
    const profile = await authApi.updateMe({
      nickname: accountForm.nickname,
      password: accountForm.password
    })
    username.value = profile?.nickname || profile?.username || username.value
    localStorage.setItem(USERNAME_KEY, username.value)
    accountDialogVisible.value = false
    ElMessage.success('账号信息已更新')
  } catch (error) {
    showApiError(error)
  } finally {
    accountSaving.value = false
  }
}

async function loadCatalog() {
  loading.value = true
  try {
    if (!hasPermission('product:view')) return
    const [nextCategories, nextProducts] = await Promise.all([productApi.listCategories(), productApi.listProducts()])
    categories.value = nextCategories || []
    products.value = nextProducts || []
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

async function loadInventory() {
  loading.value = true
  try {
    const [nextProducts, nextFlows] = await Promise.all([
      hasPermission('product:view') ? productApi.listProducts() : Promise.resolve([]),
      hasPermission('inventory:view') ? inventoryApi.listFlows() : Promise.resolve([])
    ])
    products.value = nextProducts || []
    flows.value = nextFlows || []
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

async function loadOrdersAndCatalog() {
  loading.value = true
  try {
    const [nextProducts, nextOrders] = await Promise.all([
      hasPermission('product:view') ? productApi.listProducts() : Promise.resolve([]),
      hasPermission('order:view') ? orderApi.listOrders() : Promise.resolve([])
    ])
    products.value = nextProducts || []
    orders.value = nextOrders || []
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  loading.value = true
  try {
    const [nextCategories, nextProducts, nextFlows, nextOrders] = await Promise.all([
      hasPermission('product:view') ? productApi.listCategories() : Promise.resolve([]),
      hasPermission('product:view') ? productApi.listProducts() : Promise.resolve([]),
      hasPermission('inventory:view') ? inventoryApi.listFlows() : Promise.resolve([]),
      hasPermission('order:view') ? orderApi.listOrders() : Promise.resolve([])
    ])
    categories.value = nextCategories || []
    products.value = nextProducts || []
    flows.value = nextFlows || []
    orders.value = nextOrders || []
    firstLoaded.value = true
  } catch (error) {
    showApiError(error)
  } finally {
    loading.value = false
  }
}

function refreshCurrent() {
  if (active.value === 'store') {
    storeReloadKey.value += 1
    return
  }
  loadAll()
}

onMounted(() => {
  if (!nav.value.some((item) => item.key === active.value) && nav.value.length > 0) {
    active.value = nav.value[0].key
  }
  loadAll()
})
</script>
