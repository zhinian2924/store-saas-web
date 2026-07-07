<template>
  <div class="store-profile">
    <section class="panel store-profile-card">
      <div class="store-logo-preview">
        <el-image v-if="form.logoUrl" :src="form.logoUrl" fit="cover">
          <template #error>
            <div class="logo-fallback">{{ initials }}</div>
          </template>
        </el-image>
        <div v-else class="logo-fallback">{{ initials }}</div>
      </div>

      <div class="store-profile-main">
        <div class="panel-head">
          <div>
            <h2>门店资料</h2>
            <p>维护商家端展示的名称、地址、营业时间和 LOGO。</p>
          </div>
          <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存</el-button>
        </div>

        <el-form :model="form" label-position="top" class="store-profile-form">
          <el-form-item label="门店名称">
            <el-input v-model.trim="form.name" maxlength="128" show-word-limit placeholder="例如 拾味便利店" />
          </el-form-item>
          <el-form-item label="门店地址">
            <el-input v-model.trim="form.address" maxlength="255" show-word-limit placeholder="例如 上海市浦东新区示例路 100 号" />
          </el-form-item>
          <el-form-item label="营业时间">
            <el-input v-model.trim="form.businessHours" maxlength="64" show-word-limit placeholder="例如 09:00-22:00" />
          </el-form-item>
          <el-form-item label="LOGO URL">
            <el-input v-model.trim="form.logoUrl" maxlength="255" show-word-limit placeholder="https://example.com/logo.png" />
          </el-form-item>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { showApiError, storeApi } from '../api'

const props = defineProps({
  reloadKey: { type: Number, default: 0 }
})

const form = reactive({
  name: '',
  address: '',
  businessHours: '',
  logoUrl: ''
})
const saving = ref(false)

const initials = computed(() => form.name?.trim()?.slice(0, 1) || '店')

async function load() {
  try {
    const profile = await storeApi.profile()
    Object.assign(form, {
      name: profile?.name || '',
      address: profile?.address || '',
      businessHours: profile?.businessHours || '',
      logoUrl: profile?.logoUrl || ''
    })
  } catch (error) {
    showApiError(error)
  }
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写门店名称')
    return
  }
  saving.value = true
  try {
    const profile = await storeApi.updateProfile({ ...form })
    Object.assign(form, {
      name: profile?.name || '',
      address: profile?.address || '',
      businessHours: profile?.businessHours || '',
      logoUrl: profile?.logoUrl || ''
    })
    ElMessage.success('门店资料已保存')
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

watch(() => props.reloadKey, load)
onMounted(load)
</script>
