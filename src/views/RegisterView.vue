<template>
  <section class="auth-screen">
    <div class="auth-copy">
      <span class="eyebrow">STORE SAAS</span>
      <h1>开通门店空间</h1>
      <p>创建独立租户和默认门店，完成后直接进入经营后台。</p>
      <div class="auth-points">
        <span>独立租户编码</span>
        <span>默认门店初始化</span>
        <span>店主账号开通</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-head">
        <span class="eyebrow">STORE ONBOARDING</span>
        <h2>门店入驻</h2>
        <p>填写门店和店主账号信息，系统会自动创建租户。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="register"
      >
        <el-form-item label="租户编码" prop="tenantCode">
          <el-input v-model.trim="form.tenantCode" placeholder="例如 demo" autocomplete="organization" />
        </el-form-item>

        <el-form-item label="门店名称" prop="storeName">
          <el-input v-model.trim="form.storeName" placeholder="例如 示例门店" autocomplete="organization-title" />
        </el-form-item>

        <el-form-item label="店主账号" prop="username">
          <el-input v-model.trim="form.username" placeholder="例如 admin" autocomplete="username" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            show-password
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-button type="primary" size="large" :loading="submitting" @click="register">
          创建并进入后台
        </el-button>
      </el-form>

      <div class="auth-switch">
        已有门店？
        <RouterLink to="/login">返回登录</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const form = reactive({
  tenantCode: '',
  storeName: '',
  username: '',
  password: ''
})

const requiredMessage = '请填写完整入驻信息'
const rules = {
  tenantCode: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  storeName: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  username: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  password: [
    { required: true, message: requiredMessage, trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

async function register() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const session = await authApi.register({ ...form })
    localStorage.setItem(TOKEN_KEY, session.tokenValue)
    localStorage.setItem(USERNAME_KEY, session.username)
    await router.push('/')
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}
</script>
