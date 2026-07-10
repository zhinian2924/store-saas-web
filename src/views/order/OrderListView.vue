<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head compact">
        <div>
          <h2>订单列表</h2>
          <p>可查看订单商品明细；有订单处理权限时可执行模拟支付</p>
        </div>
      </div>

      <el-table :data="orders" stripe empty-text="暂无订单">
        <el-table-column prop="orderNo" label="订单号" min-width="200" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PAID' ? 'success' : 'warning'">{{ statusText[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">¥{{ money(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button size="small" @click="openItems(row)">明细</el-button>
              <el-button
                v-if="canUpdateOrder && row.status === 'PENDING_PAY'"
                size="small"
                type="primary"
                :loading="payingId === row.id"
                @click="mockPay(row.id)"
              >
                模拟支付
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="itemsDrawer" title="订单明细" size="420px">
      <div v-if="selectedOrder" class="drawer-summary">
        <strong>{{ selectedOrder.orderNo }}</strong>
        <span>{{ statusText[selectedOrder.status] || selectedOrder.status }} · ¥{{ money(selectedOrder.totalAmount) }}</span>
      </div>
      <el-table :data="orderItems" stripe empty-text="暂无明细">
        <el-table-column prop="productName" label="商品" min-width="140" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ money(row.amount) }}</template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { orderApi, paymentApi, PERMISSIONS_KEY, showApiError } from '../../api'
import { dateText, money, statusText } from '../../utils/format'

defineProps({
  orders: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const payingId = ref(null)
const itemsDrawer = ref(false)
const selectedOrder = ref(null)
const orderItems = ref([])
const canUpdateOrder = readPermissions().includes('order:update')

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

async function mockPay(orderId) {
  payingId.value = orderId
  try {
    await paymentApi.mockPay(orderId)
    ElMessage.success('支付成功，库存已扣减')
    emit('refresh')
  } catch (error) {
    showApiError(error)
  } finally {
    payingId.value = null
  }
}

async function openItems(order) {
  selectedOrder.value = order
  itemsDrawer.value = true
  try {
    orderItems.value = (await orderApi.listItems(order.id)) || []
  } catch (error) {
    showApiError(error)
  }
}
</script>
