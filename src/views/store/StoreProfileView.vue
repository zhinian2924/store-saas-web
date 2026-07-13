<template>
  <div class="store-profile">
    <section class="panel store-hero-card">
      <div class="store-hero-bg" />
      <div class="store-hero-content">
        <div class="store-hero-logo">
          <div class="store-logo-box" :class="{ 'is-empty': !form.logoUrl }">
            <el-image v-if="form.logoUrl" :src="form.logoUrl" fit="cover">
              <template #error>
                <div class="logo-fallback">{{ initials }}</div>
              </template>
            </el-image>
            <div v-else class="logo-fallback">{{ initials }}</div>
          </div>
        </div>
        <div class="store-hero-info">
          <div class="store-hero-top">
            <h1 class="store-hero-name">{{ form.name || '门店名称' }}</h1>
            <el-tag type="success" effect="dark" size="small" round>营业中</el-tag>
          </div>
          <div class="store-hero-meta">
            <div v-if="form.address" class="store-hero-meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ form.address }}</span>
            </div>
            <div v-if="form.businessHours" class="store-hero-meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ form.businessHours }}</span>
            </div>
          </div>
          <div v-if="!form.address && !form.businessHours" class="store-hero-meta-empty">
            暂无门店信息
          </div>
        </div>
        <div class="store-hero-actions">
          <el-button v-if="canUpdateStore" type="primary" :icon="Edit" @click="openDialog">编辑</el-button>
        </div>
      </div>
    </section>
  </div>

  <el-dialog
    v-model="dialogVisible"
    title="编辑门店信息"
    width="520px"
    class="store-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form :model="dialogForm" label-position="top" class="store-dialog-form">
      <div class="store-dialog-logo">
        <div class="store-logo-box store-dialog-logo-box" :class="{ 'is-empty': !dialogForm.logoUrl }" @click="triggerUpload">
          <el-image v-if="dialogForm.logoUrl" :src="dialogForm.logoUrl" fit="cover">
            <template #error>
              <div class="logo-fallback">{{ dialogInitials }}</div>
            </template>
          </el-image>
          <div v-else class="logo-fallback">{{ dialogInitials }}</div>
          <div class="store-logo-overlay">
            <el-icon :size="20"><Camera /></el-icon>
            <span>{{ dialogForm.logoUrl ? '更换图片' : '上传图片' }}</span>
          </div>
        </div>
        <p class="store-logo-hint">支持 JPG/PNG，建议 512×512px</p>
      </div>
      <div class="store-dialog-grid">
        <el-form-item label="门店名称">
          <el-input
            v-model.trim="dialogForm.name"
            maxlength="128"
            show-word-limit
            placeholder="例如 拾味便利店"
          />
        </el-form-item>
        <el-form-item label="营业时间">
          <el-input
            v-model.trim="dialogForm.businessHours"
            maxlength="64"
            show-word-limit
            placeholder="例如 09:00-22:00"
          />
        </el-form-item>
      </div>
      <el-form-item label="门店地址">
        <el-input
          v-model.trim="dialogForm.address"
          maxlength="255"
          show-word-limit
          placeholder="例如 上海市浦东新区示例路 100 号"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Check, Camera, Edit, Location, Clock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { PERMISSIONS_KEY, showApiError, storeApi } from "../../api";

const props = defineProps({
  reloadKey: { type: Number, default: 0 },
});

const form = reactive({
  name: "",
  address: "",
  businessHours: "",
  logoUrl: "",
});
const dialogForm = reactive({
  name: "",
  address: "",
  businessHours: "",
  logoUrl: "",
});
const saving = ref(false);
const uploading = ref(false);
const dialogVisible = ref(false);
const canUpdateStore = readPermissions().includes("store:update");

const initials = computed(() => form.name?.trim()?.slice(0, 1) || "店");
const dialogInitials = computed(() => dialogForm.name?.trim()?.slice(0, 1) || "店");

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function triggerUpload() {
  if (!canUpdateStore) return;
}

function openDialog() {
  Object.assign(dialogForm, {
    name: form.name,
    address: form.address,
    businessHours: form.businessHours,
    logoUrl: form.logoUrl,
  });
  dialogVisible.value = true;
}

async function load() {
  try {
    const profile = await storeApi.profile();
    Object.assign(form, {
      name: profile?.name || "",
      address: profile?.address || "",
      businessHours: profile?.businessHours || "",
      logoUrl: profile?.logoUrl || "",
    });
  } catch (error) {
    showApiError(error);
  }
}

async function save() {
  if (!dialogForm.name.trim()) {
    ElMessage.warning("请填写门店名称");
    return;
  }
  saving.value = true;
  try {
    const profile = await storeApi.updateProfile({ ...dialogForm });
    Object.assign(form, {
      name: profile?.name || "",
      address: profile?.address || "",
      businessHours: profile?.businessHours || "",
      logoUrl: profile?.logoUrl || "",
    });
    dialogVisible.value = false;
    ElMessage.success("门店资料已保存");
  } catch (error) {
    showApiError(error);
  } finally {
    saving.value = false;
  }
}

watch(() => props.reloadKey, load);
onMounted(load);
</script>
