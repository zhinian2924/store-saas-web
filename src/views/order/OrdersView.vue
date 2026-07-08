<template>
  <div class="page-stack">
    <section v-if="canUpdateOrder" class="panel">
      <div class="panel-head">
        <div>
          <h2>创建订单</h2>
          <p>订单创建后进入待支付状态，模拟支付成功后才扣减库存</p>
        </div>
        <el-button :icon="Plus" type="primary" :loading="creating" @click="createOrder">提交订单</el-button>
      </div>

      <div class="order-lines">
        <div v-for="(line, index) in orderLines" :key="line.key" class="order-line">
          <el-select v-model="line.productId" filterable placeholder="选择商品" @change="syncLineProduct(line)">
            <el-option
            v-for="item in sellableProducts"
              :key="item.id"
              :label="`${item.name} · ¥${money(item.price)} · 库存 ${item.stock}`"
              :value="item.id"
            />
          </el-select>
          <el-input-number v-model="line.quantity" :min="1" />
          <strong>¥{{ money(lineAmount(line)) }}</strong>
          <el-button :icon="Delete" circle plain @click="removeLine(index)" :disabled="orderLines.length === 1" />
        </div>
      </div>

      <div class="order-actions">
        <el-button :icon="Plus" @click="addLine">增加商品</el-button>
        <span>预计金额：<strong>¥{{ money(orderTotal) }}</strong></span>
      </div>
    </section>

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
import { computed, ref } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { orderApi, paymentApi, PERMISSIONS_KEY, showApiError } from '../../api'
import { dateText, money, statusText } from '../../utils/format'

const props = defineProps({
  products: { type: Array, default: () => [] },
  orders: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const creating = ref(false)
const payingId = ref(null)
const itemsDrawer = ref(false)
const selectedOrder = ref(null)
const orderItems = ref([])
const orderLines = ref([newLine()])
const canUpdateOrder = readPermissions().includes('order:update')

const orderTotal = computed(() => orderLines.value.reduce((sum, line) => sum + lineAmount(line), 0))
const sellableProducts = computed(() => props.products.filter(item => item.status === 1))

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function newLine() {
  return { key: `${Date.now()}-${Math.random()}`, productId: null, quantity: 1, price: 0 }
}

function syncLineProduct(line) {
  const product = props.products.find((item) => item.id === line.productId)
  line.price = Number(product?.price || 0)
}

function lineAmount(line) {
  const product = props.products.find((item) => item.id === line.productId)
  return Number(product?.price || line.price || 0) * Number(line.quantity || 0)
}

function addLine() {
  orderLines.value.push(newLine())
}

function removeLine(index) {
  orderLines.value.splice(index, 1)
}

async function createOrder() {
  const items = orderLines.value
    .filter((line) => line.productId && line.quantity > 0)
    .map((line) => ({ productId: line.productId, quantity: line.quantity }))
  if (items.length === 0) {
    ElMessage.warning('请至少选择一个商品')
    return
  }
  creating.value = true
  try {
    await orderApi.createOrder({ items })
    ElMessage.success('订单已创建')
    orderLines.value = [newLine()]
    emit('refresh')
  } catch (error) {
    showApiError(error)
  } finally {
    creating.value = false
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
