<template>
  <section class="auth-screen platform-auth-screen">
    <div class="auth-backdrop" aria-hidden="true"></div>

    <div class="auth-copy">
      <div class="auth-brand">
        <span class="auth-brand-mark">P</span>
        <div>
          <strong>Store SaaS</strong>
          <small>平台运营管理</small>
        </div>
      </div>

      <div class="auth-hero">
        <span class="eyebrow">PLATFORM OPS</span>
        <h1>平台管理员后台</h1>
        <p>集中审核商户入驻申请，控制门店后台开通节奏。</p>
      </div>

      <div class="auth-points" aria-label="平台能力">
        <span>入驻申请统一排队</span>
        <span>审核通过后才可登录</span>
        <span>平台账号独立权限</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-head">
        <span class="eyebrow">ADMIN LOGIN</span>
        <h2>平台登录</h2>
        <p>使用平台管理员用户名和密码进入审核后台。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="login"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="form.username"
            size="large"
            placeholder="请输入平台管理员用户名"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-button class="auth-submit" type="primary" size="large" :loading="submitting" @click="login">
          登录平台
        </el-button>
      </el-form>

      <div class="auth-switch">
        商户账号？
        <RouterLink to="/login">返回门店登录</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ACCOUNT_TYPE_KEY, authApi, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function login() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const session = await authApi.platformLogin({ ...form })
    localStorage.setItem(TOKEN_KEY, session.tokenValue)
    localStorage.setItem(USERNAME_KEY, session.username)
    localStorage.setItem(ACCOUNT_TYPE_KEY, 'PLATFORM')
    await router.push('/platform')
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}
</script>
