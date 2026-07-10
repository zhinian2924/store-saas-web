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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { orderApi, PERMISSIONS_KEY, showApiError } from '../../api'
import { money } from '../../utils/format'

const props = defineProps({
  products: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const creating = ref(false)
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
</script>
