<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">S</span>
        <div>
          <strong>Store SaaS</strong>
          <small>门店进销存</small>
        </div>
      </div>

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
        <div>
          <h1>{{ currentTitle }}</h1>
          <p>{{ currentSubtitle }}</p>
        </div>
        <div class="session">
          <el-button :icon="Refresh" @click="loadAll" :loading="loading">刷新</el-button>
          <span>{{ username }}</span>
          <el-button :icon="SwitchButton" @click="logout">退出</el-button>
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
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Box, Goods, Refresh, ShoppingCart, SwitchButton, TrendCharts } from '@element-plus/icons-vue'
import { authApi, inventoryApi, orderApi, productApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'
import DashboardView from '../views/DashboardView.vue'
import InventoryView from '../views/InventoryView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProductsView from '../views/ProductsView.vue'

const nav = [
  { key: 'dashboard', label: '经营概览', subtitle: '门店商品、库存、订单的实时经营视图', icon: TrendCharts },
  { key: 'products', label: '商品管理', subtitle: '维护分类、商品档案、售价和初始库存', icon: Goods },
  { key: 'inventory', label: '库存管理', subtitle: '处理入库、报损、盘点和库存流水追踪', icon: Box },
  { key: 'orders', label: '订单管理', subtitle: '创建门店订单、查看明细并完成模拟支付', icon: ShoppingCart }
]

const active = ref('dashboard')
const username = ref(localStorage.getItem(USERNAME_KEY) || '')
const loading = ref(false)
const firstLoaded = ref(false)
const categories = ref([])
const products = ref([])
const flows = ref([])
const orders = ref([])

const currentNav = computed(() => nav.find((item) => item.key === active.value) || nav[0])
const currentTitle = computed(() => currentNav.value.label)
const currentSubtitle = computed(() => currentNav.value.subtitle)

async function logout() {
  try {
    await authApi.logout()
  } catch (error) {
    showApiError(error)
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    username.value = ''
    active.value = 'dashboard'
    window.location.href = '/login'
  }
}

async function loadCatalog() {
  loading.value = true
  try {
    const [nextCategories, nextProducts] = await Promise.all([
      productApi.listCategories(),
      productApi.listProducts()
    ])
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
      productApi.listProducts(),
      inventoryApi.listFlows()
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
      productApi.listProducts(),
      orderApi.listOrders()
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
      productApi.listCategories(),
      productApi.listProducts(),
      inventoryApi.listFlows(),
      orderApi.listOrders()
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

onMounted(loadAll)
</script>
