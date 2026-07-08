<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>商品档案</h2>
          <p>新增商品会写入当前租户，库存调整和下单都会引用这里的商品</p>
        </div>
        <el-button v-if="canAddProduct" :icon="Plus" type="primary" @click="createProduct" :loading="saving">新增商品</el-button>
      </div>

      <el-form v-if="canAddProduct" :model="form" class="product-form" label-position="top">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" placeholder="例如 拿铁咖啡" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" clearable placeholder="选择分类">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="售价">
          <el-input-number v-model="form.price" :precision="2" :step="1" :min="0.01" />
        </el-form-item>
        <el-form-item label="初始库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="图片 URL">
          <el-input v-model="form.imageUrl" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formActive" active-text="在售" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <el-table :data="products" stripe empty-text="暂无商品">
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <div class="product-cell">
              <span class="thumb">{{ row.name?.slice(0, 1) || '商' }}</span>
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{ categoryName(categories, row.categoryId) }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="120">
          <template #default="{ row }">¥{{ money(row.price) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '在售' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PERMISSIONS_KEY, productApi, showApiError } from '../../api'
import { categoryName, dateText, money } from '../../utils/format'

const props = defineProps({
  reloadKey: { type: Number, default: 0 }
})

const categories = ref([])
const products = ref([])
const saving = ref(false)
const formActive = ref(true)
const form = ref({
  categoryId: null,
  name: '',
  imageUrl: '',
  price: 18,
  stock: 0
})
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
    const [nextCategories, nextProducts] = await Promise.all([
      productApi.listCategories(),
      productApi.listProducts()
    ])
    categories.value = nextCategories || []
    products.value = nextProducts || []
  } catch (error) {
    showApiError(error)
  }
}

async function createProduct() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写商品名称')
    return
  }
  saving.value = true
  try {
    await productApi.createProduct({
      ...form.value,
      status: formActive.value ? 1 : 0
    })
    ElMessage.success('商品已创建')
    form.value = { categoryId: null, name: '', imageUrl: '', price: 18, stock: 0 }
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
