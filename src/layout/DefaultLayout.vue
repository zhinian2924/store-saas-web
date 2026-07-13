<template>
  <div class="shell store-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">S</span>
        <div>
          <strong>Store SaaS</strong>
          <small>门店进销存</small>
        </div>
      </div>

      <div class="sidebar-divider" />

      <nav class="nav-list">
        <template v-for="item in nav" :key="item.key">
          <div v-if="item.children" class="nav-group">
            <button
              type="button"
              class="nav-group-toggle"
              :class="{ active: isGroupActive(item) }"
              @click="toggleGroup(item.key)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
              <svg
                class="nav-arrow"
                :class="{ open: openGroups.includes(item.key) }"
                viewBox="0 0 20 20"
                width="16"
              >
                <path fill="currentColor" d="M6 8l4 4 4-4" />
              </svg>
            </button>
            <div v-show="openGroups.includes(item.key)" class="nav-sub">
              <button
                v-for="child in item.children"
                :key="child.key"
                type="button"
                :class="{ active: active === child.key }"
                @click="navigate(child.key)"
              >
                <span>{{ child.label }}</span>
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            :class="{ active: active === item.key }"
            @click="navigate(item.key)"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-title">
          <h1>{{ currentTitle }}</h1>
          <p>{{ currentSubtitle }}</p>
        </div>
        <div class="session">
          <el-tooltip content="刷新当前页面" placement="bottom">
            <el-button
              class="session-action"
              :icon="Refresh"
              circle
              aria-label="刷新当前页面"
              @click="refreshCurrent"
              :loading="loading"
            />
          </el-tooltip>
          <el-dropdown trigger="click" popper-class="account-dropdown" @command="handleAccountCommand">
            <button class="session-account" type="button" aria-label="打开账号菜单">
              <el-avatar class="session-avatar" :size="36">{{ avatarInitial }}</el-avatar>
              <span class="session-account-meta">
                <span class="session-account-name">{{ nickname || "门店管理员" }}</span>
                <span class="session-account-label">门店管理员</span>
              </span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="account">账号设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <section v-loading="loading && firstLoaded" class="workspace">
        <DashboardView
          v-if="active === 'dashboard'"
          :products="products"
          :orders="orders"
          :flows="flows"
        />
        <CategoryView
          v-if="active === 'categories'"
          :reload-key="catalogReloadKey"
        />
        <ProductListView
          v-if="active === 'products'"
          :reload-key="catalogReloadKey"
        />
        <StoreProfileView
          v-if="active === 'store'"
          :reload-key="storeReloadKey"
        />
        <InventoryAdjustView
          v-if="active === 'inventory-adjust'"
          :products="products"
          @refresh="loadInventory"
        />
        <InventoryFlowView
          v-if="active === 'inventory-flows'"
          :products="products"
          :flows="flows"
        />
        <OrderCreateView
          v-if="active === 'order-create'"
          :products="products"
          @refresh="loadOrdersAndCatalog"
        />
        <OrderListView
          v-if="active === 'order-list'"
          :orders="orders"
          @refresh="loadOrdersAndCatalog"
        />
        <StaffView v-if="active === 'staff'" />
      </section>
    </main>

    <el-dialog v-model="accountDialogVisible" title="我的账号" width="460px">
      <el-form :model="accountForm" label-position="top">
        <el-form-item label="手机号">
          <el-input v-model="accountForm.mobile" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model.trim="accountForm.nickname" maxlength="64" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="accountForm.password"
            show-password
            placeholder="不修改可留空"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="accountSaving" @click="saveAccount"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  Box,
  Goods,
  Refresh,
  Shop,
  ShoppingCart,
  TrendCharts,
  User,
} from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ACCOUNT_TYPE_KEY,
  authApi,
  inventoryApi,
  orderApi,
  PERMISSIONS_KEY,
  productApi,
  showApiError,
  TOKEN_KEY,
  USERNAME_KEY,
} from "../api";
import DashboardView from "../views/dashboard/DashboardView.vue";
import InventoryAdjustView from "../views/inventory/InventoryAdjustView.vue";
import InventoryFlowView from "../views/inventory/InventoryFlowView.vue";
import OrderCreateView from "../views/order/OrderCreateView.vue";
import OrderListView from "../views/order/OrderListView.vue";
import CategoryView from "../views/product/CategoryView.vue";
import ProductListView from "../views/product/ProductListView.vue";
import StaffView from "../views/staff/StaffView.vue";
import StoreProfileView from "../views/store/StoreProfileView.vue";

const allNav = [
  {
    key: "dashboard",
    label: "经营概览",
    subtitle: "门店商品、库存、订单的实时经营视图",
    icon: TrendCharts,
    any: ["product:view", "inventory:view", "order:view"],
  },
  {
    key: "store",
    label: "门店信息",
    subtitle: "维护门店名称、地址、营业时间和 LOGO",
    icon: Shop,
    permission: "store:view",
  },
  {
    key: "product-mgr",
    label: "商品管理",
    icon: Goods,
    permission: "product:view",
    children: [
      { key: "categories", label: "分类管理", subtitle: "商品分类维护" },
      {
        key: "products",
        label: "商品列表",
        subtitle: "商品档案、售价和库存管理",
      },
    ],
  },
  {
    key: "inventory-mgr",
    label: "库存管理",
    icon: Box,
    permission: "inventory:view",
    children: [
      { key: "inventory-adjust", label: "库存调整", subtitle: "采购入库、报损出库、盘盈和盘亏" },
      { key: "inventory-flows", label: "库存流水", subtitle: "按最新流水倒序展示" },
    ],
  },
  {
    key: "orders-mgr",
    label: "订单管理",
    icon: ShoppingCart,
    permission: "order:view",
    children: [
      { key: "order-create", label: "创建订单", subtitle: "创建门店订单，支持多商品" },
      { key: "order-list", label: "订单列表", subtitle: "查看订单明细并模拟支付" },
    ],
  },
  {
    key: "staff",
    label: "员工管理",
    subtitle: "创建店员账号，按岗位授权并控制启停状态",
    icon: User,
    permission: "staff:view",
  },
];

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

const permissions = ref(readPermissions());
const nav = computed(() => allNav.filter((item) => canOpen(item)));
const openGroups = ref(["product-mgr"]);

function findItem(key) {
  for (const item of nav.value) {
    if (item.key === key) return item;
    if (item.children) {
      const child = item.children.find((c) => c.key === key);
      if (child) return child;
    }
  }
  return null;
}

function isGroupActive(item) {
  return item.children?.some((c) => c.key === active.value);
}

function toggleGroup(key) {
  const idx = openGroups.value.indexOf(key);
  if (idx >= 0) {
    openGroups.value.splice(idx, 1);
  } else {
    openGroups.value.push(key);
  }
}

const route = useRoute();
const router = useRouter();

const active = ref(route.params.view || "dashboard");

watch(
  () => route.params.view,
  (view) => {
    if (view && findItem(view)) {
      active.value = view;
    } else if (!view) {
      active.value = "dashboard";
    }
  },
  { immediate: true },
);

watch(active, (key) => {
  for (const item of nav.value) {
    if (item.children && item.children.some((c) => c.key === key)) {
      if (!openGroups.value.includes(item.key)) {
        openGroups.value.push(item.key);
      }
    }
  }
});

const currentNav = computed(
  () => findItem(active.value) || nav.value[0] || allNav[0],
);
const currentTitle = computed(() => currentNav.value?.label || "");
const currentSubtitle = computed(() => currentNav.value?.subtitle || "");

function navigate(key) {
  if (key === "dashboard") {
    router.push({ name: "home" });
  } else {
    router.push({ params: { view: key } });
  }
}

const nickname = ref("");
const avatarInitial = computed(
  () => nickname.value.trim().slice(0, 1).toUpperCase() || "店",
);
const loading = ref(false);
const firstLoaded = ref(false);
const products = ref([]);
const flows = ref([]);
const orders = ref([]);
const storeReloadKey = ref(0);
const catalogReloadKey = ref(0);
const accountDialogVisible = ref(false);
const accountSaving = ref(false);
const accountForm = reactive({
  mobile: "",
  nickname: "",
  password: "",
});

function hasPermission(permission) {
  return permissions.value.includes(permission);
}

function canOpen(item) {
  if (item.permission) return hasPermission(item.permission);
  if (item.any) return item.any.some(hasPermission);
  return true;
}

function handleAccountCommand(command) {
  if (command === "account") {
    openAccount();
    return;
  }
  logout();
}

async function logout() {
  try {
    await authApi.logout();
  } catch (error) {
    showApiError(error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ACCOUNT_TYPE_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    nickname.value = "";
    active.value = "dashboard";
    window.location.href = "/login";
  }
}

async function openAccount() {
  accountDialogVisible.value = true;
  accountForm.password = "";
  try {
    const profile = await authApi.me();
    Object.assign(accountForm, {
      mobile: profile?.mobile || "",
      nickname: profile?.nickname || profile?.username || "",
      password: "",
    });
    nickname.value = profile?.nickname || "";
  } catch (error) {
    showApiError(error);
  }
}

async function saveAccount() {
  if (!accountForm.nickname.trim()) {
    ElMessage.warning("请填写昵称");
    return;
  }
  accountSaving.value = true;
  try {
    const profile = await authApi.updateMe({
      nickname: accountForm.nickname,
      password: accountForm.password,
    });
    nickname.value = profile?.nickname || "";
    accountDialogVisible.value = false;
    ElMessage.success("账号信息已更新");
  } catch (error) {
    showApiError(error);
  } finally {
    accountSaving.value = false;
  }
}

async function loadInventory() {
  loading.value = true;
  try {
    const [nextProducts, nextFlows] = await Promise.all([
      hasPermission("product:view")
        ? productApi.listProducts()
        : Promise.resolve([]),
      hasPermission("inventory:view")
        ? inventoryApi.listFlows()
        : Promise.resolve([]),
    ]);
    products.value = nextProducts || [];
    flows.value = nextFlows || [];
  } catch (error) {
    showApiError(error);
  } finally {
    loading.value = false;
  }
}

async function loadOrdersAndCatalog() {
  loading.value = true;
  try {
    const [nextProducts, nextOrders] = await Promise.all([
      hasPermission("product:view")
        ? productApi.listProducts()
        : Promise.resolve([]),
      hasPermission("order:view") ? orderApi.listOrders() : Promise.resolve([]),
    ]);
    products.value = nextProducts || [];
    orders.value = nextOrders || [];
  } catch (error) {
    showApiError(error);
  } finally {
    loading.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  try {
    const [nextProducts, nextFlows, nextOrders] = await Promise.all([
      hasPermission("product:view")
        ? productApi.listProducts()
        : Promise.resolve([]),
      hasPermission("inventory:view")
        ? inventoryApi.listFlows()
        : Promise.resolve([]),
      hasPermission("order:view") ? orderApi.listOrders() : Promise.resolve([]),
    ]);
    products.value = nextProducts || [];
    flows.value = nextFlows || [];
    orders.value = nextOrders || [];
    firstLoaded.value = true;
  } catch (error) {
    showApiError(error);
  } finally {
    loading.value = false;
  }
}

function refreshCurrent() {
  if (active.value === "store") {
    storeReloadKey.value += 1;
    return;
  }
  if (active.value === "categories" || active.value === "products") {
    catalogReloadKey.value += 1;
    return;
  }
  loadAll();
}

onMounted(() => {
  if (!findItem(active.value) && nav.value.length > 0) {
    const first = nav.value[0];
    active.value = first.children?.[0]?.key || first.key;
  }
  loadNickname();
  loadAll();
});

async function loadNickname() {
  try {
    const profile = await authApi.me();
    nickname.value = profile?.nickname || "";
  } catch {}
}
</script>
