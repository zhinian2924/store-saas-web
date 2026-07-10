<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head compact">
        <div>
          <h2>库存流水</h2>
          <p>按最新流水倒序展示</p>
        </div>
      </div>

      <el-table :data="flows" stripe empty-text="暂无库存流水">
        <el-table-column label="商品" min-width="150">
          <template #default="{ row }">{{
            productName(products, row.productId)
          }}</template>
        </el-table-column>
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.quantity >= 0 ? 'success' : 'warning'">{{
              flowText[row.flowType] || row.flowType
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            <span :class="row.quantity >= 0 ? 'positive' : 'negative'">{{
              row.quantity
            }}</span>
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
import { dateText, flowText, productName } from "../../utils/format";

defineProps({
  products: { type: Array, default: () => [] },
  flows: { type: Array, default: () => [] },
});
</script>
