<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>分类管理</h2>
          <p>商品可以不选分类，但建议先建分类方便后续维护</p>
        </div>
        <el-button v-if="canAddProduct" :icon="Plus" type="primary" @click="createCategory" :loading="saving">新增分类</el-button>
      </div>

      <el-form v-if="canAddProduct" :model="form" class="inline-form" inline>
        <el-form-item label="分类名称">
          <el-input v-model="form.name" placeholder="例如 咖啡饮品" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortNo" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <div class="tag-list">
        <el-tag v-for="item in categories" :key="item.id" :type="item.status === 1 ? 'success' : 'info'">
          {{ item.name }} · {{ item.sortNo || 0 }}
        </el-tag>
        <el-empty v-if="categories.length === 0" description="暂无分类" :image-size="72" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PERMISSIONS_KEY, productApi, showApiError } from '../../api'

const props = defineProps({
  reloadKey: { type: Number, default: 0 }
})

const categories = ref([])
const saving = ref(false)
const formActive = ref(true)
const form = ref({ name: '', sortNo: 0 })
const canAddProduct = readPermissions().includes('product:add')

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

async function loadData() {
  try {
    categories.value = (await productApi.listCategories()) || []
  } catch (error) {
    showApiError(error)
  }
}

async function createCategory() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  saving.value = true
  try {
    await productApi.createCategory({
      ...form.value,
      status: formActive.value ? 1 : 0
    })
    ElMessage.success('分类已创建')
    form.value = { name: '', sortNo: 0 }
    await loadData()
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

watch(() => props.reloadKey, loadData)

onMounted(loadData)
</script>
