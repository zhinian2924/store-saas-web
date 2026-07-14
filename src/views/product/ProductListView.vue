<template>
  <div class="page-stack product-page">
    <section class="product-hero">
      <div>
        <span class="eyebrow">商品资料</span>
        <h2>商品增删改查</h2>
        <p>
          维护商品名称、分类、售价、图片和销售状态；库存数量只在库存管理中调整。
        </p>
      </div>
      <el-button
        v-if="canAddProduct"
        :icon="Plus"
        type="primary"
        @click="openCreate"
        :loading="saving"
      >
        新增商品
      </el-button>
    </section>

    <section class="product-metrics">
      <div>
        <span>商品总数</span>
        <strong>{{ products.length }}</strong>
      </div>
      <div>
        <span>在售商品</span>
        <strong>{{ activeCount }}</strong>
      </div>
      <div>
        <span>停用商品</span>
        <strong>{{ disabledCount }}</strong>
      </div>
    </section>

    <section class="panel product-list-panel">
      <div class="product-toolbar">
        <el-input
          v-model.trim="filters.keyword"
          clearable
          placeholder="搜索商品名称"
        />
        <el-select
          v-model="filters.categoryId"
          clearable
          placeholder="全部分类"
        >
          <el-option
            v-for="item in categories"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
        <el-select v-model="filters.status" placeholder="全部状态">
          <el-option label="全部状态" value="all" />
          <el-option
            v-for="item in productStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <el-table :data="pagedProducts" stripe empty-text="暂无商品">
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                v-if="row.imageUrl"
                class="product-thumb"
                :src="row.imageUrl"
                fit="cover"
              />
              <span v-else class="thumb">{{
                row.name?.slice(0, 1) || "商"
              }}</span>
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{
                  categoryName(categories, row.categoryId) || "未分类"
                }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="120">
          <template #default="{ row }">¥{{ money(row.price) }}</template>
        </el-table-column>
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            <el-tooltip content="库存请到库存管理调整" placement="top">
              <span class="stock-readonly">{{ row.stock ?? 0 }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="productStatusType(row.status)">{{
              productStatusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ dateText(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column
          v-if="canEditProduct"
          label="操作"
          width="150"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button link type="danger" @click="deleteProduct(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>

      <CommonPagination
        v-model:page="page"
        v-model:size="pageSize"
        :total="filteredProducts.length"
      />
    </section>

    <el-dialog
      v-model="drawerVisible"
      :title="editingProduct ? '编辑商品' : '新增商品'"
      width="min(760px, calc(100vw - 32px))"
      class="product-dialog"
      align-center
      destroy-on-close
    >
      <div class="product-dialog-body">
        <div class="product-dialog-header">
          <span class="dialog-kicker">商品档案</span>
          <div class="product-dialog-header-text">
            <h3>{{ editingProduct ? "编辑商品" : "新增商品" }}</h3>
            <p>维护名称、分类、售价、图片和售卖状态。库存数量请到库存管理中调整。</p>
          </div>
        </div>
        <el-form :model="form" class="product-dialog-form" label-position="top">
          <el-form-item label="商品名称">
            <el-input
              v-model.trim="form.name"
              maxlength="80"
              placeholder="例如 拿铁咖啡"
            />
          </el-form-item>
          <div class="form-row-3">
            <el-form-item label="分类">
              <el-select
                v-model="form.categoryId"
                clearable
                placeholder="选择分类"
              >
                <el-option
                  v-for="item in categories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="formStatus" placeholder="选择状态">
                <el-option
                  v-for="item in productStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="售价（元）">
              <el-input-number
                v-model="form.price"
                :precision="2"
                :step="1"
                :min="0.01"
                controls-position="right"
              />
            </el-form-item>
          </div>
          <el-form-item label="商品主图">
            <input ref="uploadInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="handleImageUpload" />
            <div class="product-image-upload">
              <div class="product-image-area">
                <template v-if="form.imageUrl">
                  <el-image :src="form.imageUrl" fit="cover" class="product-image-preview" />
                  <el-button type="primary" text :icon="Upload" :loading="uploading" @click="triggerImageUpload">
                    更换图片
                  </el-button>
                </template>
                <template v-else>
                  <div class="product-image-placeholder">
                    <span>点击上传商品图片</span>
                    <small>支持 JPG / PNG / WebP，建议比例 1:1</small>
                  </div>
                  <el-button type="primary" plain :icon="Upload" :loading="uploading" @click="triggerImageUpload">
                    上传图片
                  </el-button>
                </template>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer-actions">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveProduct"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Plus, Upload } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PERMISSIONS_KEY, productApi, showApiError } from "../../api";
import { categoryName, dateText, money } from "../../utils/format";
import CommonPagination from "../../components/CommonPagination.vue";

const props = defineProps({
  reloadKey: { type: Number, default: 0 },
});

const categories = ref([]);
const products = ref([]);
const saving = ref(false);
const uploading = ref(false);
const uploadInput = ref(null);
const drawerVisible = ref(false);
const editingProduct = ref(null);
const formStatus = ref(1);
const page = ref(1);
const pageSize = ref(10);
const filters = reactive({
  keyword: "",
  categoryId: null,
  status: "all",
});
const form = ref(defaultForm());
const permissions = readPermissions();
const canAddProduct = permissions.includes("product:add");
const canEditProduct = permissions.includes("product:update");

const filteredProducts = computed(() =>
  products.value.filter((item) => {
    const keywordMatched =
      !filters.keyword || item.name?.includes(filters.keyword);
    const categoryMatched =
      !filters.categoryId || item.categoryId === filters.categoryId;
    const statusMatched =
      filters.status === "all" || item.status === filters.status;
    return keywordMatched && categoryMatched && statusMatched;
  }),
);

const pagedProducts = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredProducts.value.slice(start, start + pageSize.value);
});

const activeCount = computed(
  () => products.value.filter((item) => item.status === 1).length,
);
const disabledCount = computed(
  () => products.value.filter((item) => item.status !== 1).length,
);
const productStatusOptions = [
  { value: 1, label: "在售" },
  { value: 2, label: "售罄" },
  { value: 0, label: "下架" },
  { value: 3, label: "停售" },
];

function defaultForm() {
  return {
    categoryId: null,
    name: "",
    imageUrl: "",
    price: 18,
  };
}

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

async function loadData() {
  try {
    const [nextCategories, nextProducts] = await Promise.all([
      productApi.listCategories(),
      productApi.listProducts(),
    ]);
    categories.value = nextCategories || [];
    products.value = nextProducts || [];
  } catch (error) {
    showApiError(error);
  }
}

function openCreate() {
  editingProduct.value = null;
  formStatus.value = 1;
  form.value = defaultForm();
  drawerVisible.value = true;
}

function openEdit(product) {
  editingProduct.value = product;
  formStatus.value = product.status ?? 1;
  form.value = {
    categoryId: product.categoryId || null,
    name: product.name || "",
    imageUrl: product.imageUrl || "",
    price: Number(product.price || 0),
  };
  drawerVisible.value = true;
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  uploading.value = true;
  try {
    const result = await productApi.uploadImage(file);
    form.value.imageUrl = result?.url || "";
    ElMessage.success("图片上传成功");
  } catch (error) {
    showApiError(error);
  } finally {
    uploading.value = false;
  }
}

function triggerImageUpload() {
  uploadInput.value?.click();
}

async function saveProduct() {
  if (!form.value.name.trim()) {
    ElMessage.warning("请填写商品名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      status: formStatus.value,
    };
    if (editingProduct.value) {
      await productApi.updateProduct(editingProduct.value.id, payload);
      ElMessage.success("商品已更新");
    } else {
      await productApi.createProduct(payload);
      ElMessage.success("商品已创建");
    }
    drawerVisible.value = false;
    await loadData();
  } catch (error) {
    showApiError(error);
  } finally {
    saving.value = false;
  }
}

function productStatusLabel(status) {
  return (
    productStatusOptions.find((item) => item.value === status)?.label || "未知"
  );
}

function productStatusType(status) {
  return (
    {
      1: "success",
      2: "warning",
      0: "info",
      3: "danger",
    }[status] || "info"
  );
}

async function deleteProduct(product) {
  try {
    await ElMessageBox.confirm(
      `确认删除商品「${product.name}」？`,
      "删除商品",
      { type: "warning" },
    );
    await productApi.deleteProduct(product.id);
    ElMessage.success("商品已删除");
    await loadData();
  } catch (error) {
    if (error !== "cancel") showApiError(error);
  }
}

watch(() => props.reloadKey, loadData);
watch(filters, () => {
  page.value = 1;
});
watch(pageSize, () => {
  page.value = 1;
});
watch(
  () => filteredProducts.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize.value));
    if (page.value > maxPage) page.value = maxPage;
  },
);

onMounted(loadData);
</script>
