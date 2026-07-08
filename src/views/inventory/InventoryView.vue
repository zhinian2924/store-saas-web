<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>库存调整</h2>
          <p>支持采购入库、报损出库、盘盈和盘亏，后端会拒绝负库存</p>
        </div>
        <el-button v-if="canAdjustStock" :icon="Check" type="primary" :loading="saving" @click="adjustStock">保存调整</el-button>
      </div>

      <el-form v-if="canAdjustStock" :model="stockForm" class="inventory-form" label-position="top">
        <el-form-item label="商品">
          <el-select v-model="stockForm.productId" filterable placeholder="选择商品">
            <el-option
              v-for="item in products"
              :key="item.id"
              :label="`${item.name}（库存 ${item.stock}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变更类型">
          <el-select v-model="stockForm.flowType">
            <el-option label="采购入库" value="PURCHASE_IN" />
            <el-option label="报损出库" value="DAMAGE_OUT" />
            <el-option label="盘盈" value="CHECK_GAIN" />
            <el-option label="盘亏" value="CHECK_LOSS" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="stockForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockForm.remark" placeholder="例如 本日补货" />
        </el-form-item>
      </el-form>
    </section>

    <section class="panel">
      <div class="panel-head compact">
        <div>
          <h2>库存流水</h2>
          <p>按最新流水倒序展示</p>
        </div>
      </div>

      <el-table :data="flows" stripe empty-text="暂无库存流水">
        <el-table-column label="商品" min-width="150">
          <template #default="{ row }">{{ productName(products, row.productId) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.quantity >= 0 ? 'success' : 'warning'">{{ flowText[row.flowType] || row.flowType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            <span :class="row.quantity >= 0 ? 'positive' : 'negative'">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeStock" label="调整前" width="100" />
        <el-table-column prop="afterStock" label="调整后" width="100" />
        <el-table-column prop="remark" label="备注" min-width="180" />
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inventoryApi, PERMISSIONS_KEY, showApiError } from '../../api'
import { dateText, flowText, productName } from '../../utils/format'

defineProps({
  products: { type: Array, default: () => [] },
  flows: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const saving = ref(false)
const canAdjustStock = readPermissions().includes('inventory:adjust')
const stockForm = ref({
  productId: null,
  flowType: 'PURCHASE_IN',
  quantity: 10,
  remark: ''
})

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

async function adjustStock() {
  if (!stockForm.value.productId) {
    ElMessage.warning('请选择商品')
    return
  }
  saving.value = true
  try {
    await inventoryApi.adjust(stockForm.value)
    ElMessage.success('库存已调整')
    stockForm.value = { productId: null, flowType: 'PURCHASE_IN', quantity: 10, remark: '' }
    emit('refresh')
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}
</script>
