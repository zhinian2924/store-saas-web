<template>
  <div class="page-stack">
    <section class="metric-grid">
      <article class="metric-card">
        <span>商品数</span>
        <strong>{{ products.length }}</strong>
        <small>{{ activeProducts }} 个在售</small>
      </article>
      <article class="metric-card">
        <span>总库存</span>
        <strong>{{ totalStock }}</strong>
        <small>{{ lowStock.length }} 个低库存</small>
      </article>
      <article class="metric-card">
        <span>待支付订单</span>
        <strong>{{ pendingOrders.length }}</strong>
        <small>共 {{ orders.length }} 笔订单</small>
      </article>
      <article class="metric-card">
        <span>已支付销售额</span>
        <strong>¥{{ money(totalSales) }}</strong>
        <small>{{ paidOrders.length }} 笔已支付</small>
      </article>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-head compact">
          <div>
            <h2>低库存商品</h2>
            <p>库存小于 10 的商品优先补货</p>
          </div>
        </div>
        <el-table :data="lowStock" stripe empty-text="暂无低库存商品">
          <el-table-column prop="name" label="商品" min-width="140" />
          <el-table-column prop="stock" label="库存" width="90" />
          <el-table-column label="售价" width="110">
            <template #default="{ row }">¥{{ money(row.price) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-head compact">
          <div>
            <h2>最近库存流水</h2>
            <p>订单扣减和手动调整都会进入流水</p>
          </div>
        </div>
        <el-table :data="recentFlows" stripe empty-text="暂无库存流水">
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.quantity >= 0 ? 'success' : 'warning'">{{ flowText[row.flowType] || row.flowType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="90" />
          <el-table-column label="时间" min-width="150">
            <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { dateText, flowText, money } from '../utils/format'

const props = defineProps({
  products: { type: Array, default: () => [] },
  orders: { type: Array, default: () => [] },
  flows: { type: Array, default: () => [] }
})

const totalStock = computed(() => props.products.reduce((sum, item) => sum + Number(item.stock || 0), 0))
const activeProducts = computed(() => props.products.filter((item) => item.status === 1).length)
const lowStock = computed(() => props.products.filter((item) => Number(item.stock || 0) < 10).slice(0, 8))
const pendingOrders = computed(() => props.orders.filter((item) => item.status === 'PENDING_PAY'))
const paidOrders = computed(() => props.orders.filter((item) => item.status === 'PAID'))
const totalSales = computed(() => paidOrders.value.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0))
const recentFlows = computed(() => props.flows.slice(0, 8))
</script>
