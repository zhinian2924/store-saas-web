<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>分类管理</h2>
          <p>商品可以不选分类，但建议先建分类方便后续维护</p>
        </div>
        <el-button v-if="canAddProduct" :icon="Plus" type="primary" @click="createCategory" :loading="categorySaving">新增分类</el-button>
      </div>

      <el-form v-if="canAddProduct" :model="categoryForm" class="inline-form" inline>
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="例如 咖啡饮品" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortNo" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="categoryActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <div class="tag-list">
        <el-tag v-for="item in categories" :key="item.id" :type="item.status === 1 ? 'success' : 'info'">
          {{ item.name }} · {{ item.sortNo || 0 }}
        </el-tag>
        <el-empty v-if="categories.length === 0" description="暂无分类" :image-size="72" />
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>商品档案</h2>
          <p>新增商品会写入当前租户，库存调整和下单都会引用这里的商品</p>
        </div>
        <el-button v-if="canAddProduct" :icon="Plus" type="primary" @click="createProduct" :loading="productSaving">新增商品</el-button>
      </div>

      <el-form v-if="canAddProduct" :model="productForm" class="product-form" label-position="top">
        <el-form-item label="商品名称">
          <el-input v-model="productForm.name" placeholder="例如 拿铁咖啡" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="productForm.categoryId" clearable placeholder="选择分类">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="售价">
          <el-input-number v-model="productForm.price" :precision="2" :step="1" :min="0.01" />
        </el-form-item>
        <el-form-item label="初始库存">
          <el-input-number v-model="productForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="图片 URL">
          <el-input v-model="productForm.imageUrl" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="productActive" active-text="在售" inactive-text="停用" />
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
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PERMISSIONS_KEY, productApi, showApiError } from '../api'
import { categoryName, dateText, money } from '../utils/format'

defineProps({
  categories: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const categorySaving = ref(false)
const productSaving = ref(false)
const canAddProduct = readPermissions().includes('product:add')
const categoryActive = ref(true)
const productActive = ref(true)
const categoryForm = ref({ name: '', sortNo: 0 })
const productForm = ref({
  categoryId: null,
  name: '',
  imageUrl: '',
  price: 18,
  stock: 0
})

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

async function createCategory() {
  if (!categoryForm.value.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  categorySaving.value = true
  try {
    await productApi.createCategory({
      ...categoryForm.value,
      status: categoryActive.value ? 1 : 0
    })
    ElMessage.success('分类已创建')
    categoryForm.value = { name: '', sortNo: 0 }
    emit('refresh')
  } catch (error) {
    showApiError(error)
  } finally {
    categorySaving.value = false
  }
}

async function createProduct() {
  if (!productForm.value.name.trim()) {
    ElMessage.warning('请填写商品名称')
    return
  }
  productSaving.value = true
  try {
    await productApi.createProduct({
      ...productForm.value,
      status: productActive.value ? 1 : 0
    })
    ElMessage.success('商品已创建')
    productForm.value = { categoryId: null, name: '', imageUrl: '', price: 18, stock: 0 }
    emit('refresh')
  } catch (error) {
    showApiError(error)
  } finally {
    productSaving.value = false
  }
}

</script>
