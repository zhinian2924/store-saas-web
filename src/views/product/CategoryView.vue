<template>
  <div class="page-stack category-page">
    <section class="product-hero">
      <div>
        <span class="eyebrow">商品分类</span>
        <h2>分类列表</h2>
        <p>用分类整理商品资料，排序值越小越靠前；商品本身仍在商品列表维护。</p>
      </div>
      <el-button v-if="canAddProduct" :icon="Plus" type="primary" @click="openCreate" :loading="saving">
        新增分类
      </el-button>
    </section>

    <section class="product-metrics">
      <div>
        <span>分类总数</span>
        <strong>{{ categories.length }}</strong>
      </div>
      <div>
        <span>启用分类</span>
        <strong>{{ enabledCount }}</strong>
      </div>
      <div>
        <span>停用分类</span>
        <strong>{{ disabledCount }}</strong>
      </div>
    </section>

    <section class="panel product-list-panel">
      <div class="category-toolbar">
        <el-input v-model.trim="filters.keyword" clearable placeholder="搜索分类名称" />
        <el-select v-model="filters.status" placeholder="全部状态">
          <el-option label="全部状态" value="all" />
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </div>

      <el-table :data="pagedCategories" stripe empty-text="暂无分类">
        <el-table-column label="分类" min-width="220">
          <template #default="{ row }">
            <div class="category-cell">
              <span>{{ row.name?.slice(0, 1) || '分' }}</span>
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{ productCount(row.id) }} 个商品</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sortNo" label="排序" width="120">
          <template #default="{ row }">{{ row.sortNo || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column v-if="canEditProduct" label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              :loading="statusChangingId === row.id"
              @click="setCategoryStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <CommonPagination
        v-model:page="page"
        v-model:size="pageSize"
        :total="filteredCategories.length"
      />
    </section>

    <el-drawer v-model="drawerVisible" title="新增分类" size="380px">
      <el-form :model="form" class="product-drawer-form" label-position="top">
        <el-form-item label="分类名称">
          <el-input v-model.trim="form.name" maxlength="40" placeholder="例如 咖啡饮品" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortNo" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createCategory">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PERMISSIONS_KEY, productApi, showApiError } from '../../api'
import { dateText } from '../../utils/format'
import CommonPagination from '../../components/CommonPagination.vue'

const props = defineProps({
  reloadKey: { type: Number, default: 0 }
})

const categories = ref([])
const products = ref([])
const saving = ref(false)
const drawerVisible = ref(false)
const formActive = ref(true)
const statusChangingId = ref(null)
const page = ref(1)
const pageSize = ref(10)
const filters = reactive({
  keyword: '',
  status: 'all'
})
const form = ref(defaultForm())
const permissions = readPermissions()
const canAddProduct = permissions.includes('product:add')
const canEditProduct = permissions.includes('product:update')

const filteredCategories = computed(() => categories.value.filter((item) => {
  const keywordMatched = !filters.keyword || item.name?.includes(filters.keyword)
  const statusMatched = filters.status === 'all' || item.status === filters.status
  return keywordMatched && statusMatched
}))

const pagedCategories = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredCategories.value.slice(start, start + pageSize.value)
})

const enabledCount = computed(() => categories.value.filter(item => item.status === 1).length)
const disabledCount = computed(() => categories.value.filter(item => item.status !== 1).length)

function defaultForm() {
  return { name: '', sortNo: 0 }
}

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function productCount(categoryId) {
  return products.value.filter(item => item.categoryId === categoryId).length
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

function openCreate() {
  formActive.value = true
  form.value = defaultForm()
  drawerVisible.value = true
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
    drawerVisible.value = false
    form.value = defaultForm()
    await loadData()
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

async function setCategoryStatus(category) {
  const nextStatus = category.status === 1 ? 0 : 1
  try {
    if (nextStatus === 0) {
      await ElMessageBox.confirm(
        `禁用分类「${category.name}」后，该分类下的商品状态将全部改为停售。确认继续？`,
        '禁用分类',
        { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' }
      )
    }
    statusChangingId.value = category.id
    await productApi.setCategoryStatus(category.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '分类已启用' : '分类已禁用，商品已停售')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') showApiError(error)
  } finally {
    statusChangingId.value = null
  }
}

watch(() => props.reloadKey, loadData)
watch(filters, () => { page.value = 1 })
watch(pageSize, () => { page.value = 1 })
watch(() => filteredCategories.value.length, (total) => {
  const maxPage = Math.max(1, Math.ceil(total / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

onMounted(loadData)
</script>
