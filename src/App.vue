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
      <button v-for="item in nav" :key="item.key" :class="{ active: active === item.key }" @click="active = item.key">
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>{{ currentTitle }}</h1>
          <p>前后端分离 · Sa-Token 会话 · tenant_id 隔离</p>
        </div>
        <div v-if="loggedIn" class="session">
          <span>{{ username }}</span>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </header>

      <section v-if="!loggedIn" class="auth-panel">
        <el-tabs v-model="authTab">
          <el-tab-pane label="门店登录" name="login">
            <el-form :model="loginForm" label-position="top">
              <el-form-item label="用户名"><el-input v-model="loginForm.username" /></el-form-item>
              <el-form-item label="密码"><el-input v-model="loginForm.password" show-password /></el-form-item>
              <el-button type="primary" @click="login">登录</el-button>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="门店入驻" name="register">
            <el-form :model="registerForm" label-position="top">
              <el-form-item label="租户编码"><el-input v-model="registerForm.tenantCode" /></el-form-item>
              <el-form-item label="门店名称"><el-input v-model="registerForm.storeName" /></el-form-item>
              <el-form-item label="店主账号"><el-input v-model="registerForm.username" /></el-form-item>
              <el-form-item label="密码"><el-input v-model="registerForm.password" show-password /></el-form-item>
              <el-button type="primary" @click="register">创建门店</el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </section>

      <section v-else class="workspace">
        <div v-if="active === 'dashboard'" class="metric-grid">
          <article><span>商品数</span><strong>{{ products.length }}</strong></article>
          <article><span>总库存</span><strong>{{ totalStock }}</strong></article>
          <article><span>订单数</span><strong>{{ orders.length }}</strong></article>
          <article><span>销售额</span><strong>¥{{ totalSales }}</strong></article>
        </div>

        <div v-if="active === 'products'" class="panel">
          <div class="panel-head">
            <h2>商品管理</h2>
            <el-button type="primary" @click="createProduct">新增商品</el-button>
          </div>
          <el-form :model="productForm" inline>
            <el-form-item label="名称"><el-input v-model="productForm.name" /></el-form-item>
            <el-form-item label="价格"><el-input-number v-model="productForm.price" :min="0.01" /></el-form-item>
            <el-form-item label="库存"><el-input-number v-model="productForm.stock" :min="0" /></el-form-item>
          </el-form>
          <el-table :data="products" stripe>
            <el-table-column prop="name" label="商品" />
            <el-table-column prop="price" label="价格" />
            <el-table-column prop="stock" label="库存" />
            <el-table-column prop="status" label="状态" />
          </el-table>
        </div>

        <div v-if="active === 'inventory'" class="panel">
          <div class="panel-head">
            <h2>库存调整</h2>
            <el-button type="primary" @click="adjustStock">保存调整</el-button>
          </div>
          <el-form :model="stockForm" inline>
            <el-form-item label="商品">
              <el-select v-model="stockForm.productId" placeholder="选择商品" style="width: 180px">
                <el-option v-for="item in products" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="stockForm.flowType" style="width: 150px">
                <el-option label="采购入库" value="PURCHASE_IN" />
                <el-option label="报损出库" value="DAMAGE_OUT" />
                <el-option label="盘盈" value="CHECK_GAIN" />
                <el-option label="盘亏" value="CHECK_LOSS" />
              </el-select>
            </el-form-item>
            <el-form-item label="数量"><el-input-number v-model="stockForm.quantity" :min="1" /></el-form-item>
          </el-form>
          <el-table :data="flows" stripe>
            <el-table-column prop="productId" label="商品ID" />
            <el-table-column prop="flowType" label="类型" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="beforeStock" label="调整前" />
            <el-table-column prop="afterStock" label="调整后" />
          </el-table>
        </div>

        <div v-if="active === 'orders'" class="panel">
          <div class="panel-head">
            <h2>订单管理</h2>
            <el-button @click="loadAll">刷新</el-button>
          </div>
          <el-table :data="orders" stripe>
            <el-table-column prop="orderNo" label="订单号" min-width="180" />
            <el-table-column prop="status" label="状态" />
            <el-table-column prop="totalAmount" label="金额" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button v-if="row.status === 'PENDING_PAY'" size="small" type="primary" @click="mockPay(row.id)">模拟支付</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Goods, Menu, Tickets, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { api } from './api'

const nav = [
  { key: 'dashboard', label: '经营概览', icon: TrendCharts },
  { key: 'products', label: '商品管理', icon: Goods },
  { key: 'inventory', label: '库存管理', icon: Menu },
  { key: 'orders', label: '订单管理', icon: Tickets }
]

const active = ref('dashboard')
const authTab = ref('login')
const loggedIn = ref(Boolean(localStorage.getItem('store_saas_token')))
const username = ref(localStorage.getItem('store_saas_username') || '')
const loginForm = ref({ username: 'demo', password: 'demo123' })
const registerForm = ref({ tenantCode: 'demo', storeName: '示例门店', username: 'demo', password: 'demo123' })
const productForm = ref({ name: '拿铁咖啡', price: 18, stock: 20, status: 1 })
const stockForm = ref({ productId: null, flowType: 'PURCHASE_IN', quantity: 10, remark: '' })
const products = ref([])
const flows = ref([])
const orders = ref([])

const currentTitle = computed(() => nav.find((item) => item.key === active.value)?.label || '门店后台')
const totalStock = computed(() => products.value.reduce((sum, item) => sum + Number(item.stock || 0), 0))
const totalSales = computed(() => orders.value.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + Number(item.totalAmount || 0), 0).toFixed(2))

async function login() {
  const data = await api.post('/auth/store/login', loginForm.value)
  saveSession(data)
}

async function register() {
  const data = await api.post('/auth/tenant/register', registerForm.value)
  saveSession(data)
}

function saveSession(data) {
  localStorage.setItem('store_saas_token', data.tokenValue)
  localStorage.setItem('store_saas_username', data.username)
  username.value = data.username
  loggedIn.value = true
  ElMessage.success('登录成功')
  loadAll()
}

function logout() {
  localStorage.removeItem('store_saas_token')
  localStorage.removeItem('store_saas_username')
  loggedIn.value = false
}

async function loadAll() {
  products.value = await api.get('/store/products')
  flows.value = await api.get('/store/inventory/flows')
  orders.value = await api.get('/store/orders')
}

async function createProduct() {
  await api.post('/store/products', productForm.value)
  ElMessage.success('商品已创建')
  await loadAll()
}

async function adjustStock() {
  await api.post('/store/inventory/adjust', stockForm.value)
  ElMessage.success('库存已调整')
  await loadAll()
}

async function mockPay(orderId) {
  await api.post(`/store/payments/mock/${orderId}`)
  ElMessage.success('支付成功，库存已扣减')
  await loadAll()
}

onMounted(() => {
  if (loggedIn.value) loadAll()
})
</script>
