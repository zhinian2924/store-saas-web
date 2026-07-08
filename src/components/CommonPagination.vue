<template>
  <div v-if="total > 0" class="common-pagination">
    <span>共 {{ total }} 条</span>
    <el-pagination
      background
      layout="sizes, prev, pager, next"
      :current-page="page"
      :page-size="size"
      :page-sizes="pageSizes"
      :total="total"
      @update:current-page="emit('update:page', $event)"
      @update:page-size="emit('update:size', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50] }
})

const emit = defineEmits(['update:page', 'update:size'])
</script>
