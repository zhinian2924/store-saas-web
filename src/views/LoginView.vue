<template>
  <section class="auth-screen">
    <div class="auth-copy">
      <span class="eyebrow">STORE SAAS</span>
      <h1>门店经营工作台</h1>
      <p>按租户隔离门店数据，集中处理商品、库存、订单和支付模拟流程。</p>
      <div class="auth-points">
        <span>Sa-Token 会话</span>
        <span>tenant_id 隔离</span>
        <span>前后端分离</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-head">
        <span class="eyebrow">MANAGER LOGIN</span>
        <h2>登录门店后台</h2>
        <p>使用店主账号和密码进入当前门店。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="login"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="form.username" placeholder="例如 admin" autocomplete="username" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-button type="primary" size="large" :loading="submitting" @click="login">
          登录门店后台
        </el-button>
      </el-form>

      <div class="auth-switch">
        还没有门店？
        <RouterLink to="/register">立即入驻</RouterLink>
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
  username: 'demo',
  password: 'demo123'
})

const requiredMessage = '请填写完整登录信息'
const rules = {
  username: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  password: [{ required: true, message: requiredMessage, trigger: 'blur' }]
}

async function login() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const session = await authApi.login({ ...form })
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
