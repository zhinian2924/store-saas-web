<template>
  <section class="auth-screen">
    <div class="auth-copy">
      <span class="eyebrow">STORE SAAS</span>
      <h1>小店经营后台</h1>
      <p>用一套轻量后台完成商品、库存、订单和支付模拟闭环。</p>
      <div class="auth-points">
        <span>Sa-Token 会话</span>
        <span>tenant_id 隔离</span>
        <span>前后端分离</span>
      </div>
    </div>

    <div class="auth-panel">
      <el-tabs v-model="authTab">
        <el-tab-pane label="门店登录" name="login">
          <el-form :model="loginForm" label-position="top" @keyup.enter="login">
            <el-form-item label="用户名">
              <el-input v-model="loginForm.username" placeholder="demo" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" show-password placeholder="demo123" />
            </el-form-item>
            <el-button type="primary" :loading="submitting" @click="login">登录门店后台</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="门店入驻" name="register">
          <el-form :model="registerForm" label-position="top" @keyup.enter="register">
            <el-form-item label="租户编码">
              <el-input v-model="registerForm.tenantCode" placeholder="例如 demo" />
            </el-form-item>
            <el-form-item label="门店名称">
              <el-input v-model="registerForm.storeName" placeholder="例如 示例门店" />
            </el-form-item>
            <el-form-item label="店主账号">
              <el-input v-model="registerForm.username" placeholder="demo" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" show-password placeholder="至少 6 位" />
            </el-form-item>
            <el-button type="primary" :loading="submitting" @click="register">创建并进入后台</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi, showApiError } from '../api'

const emit = defineEmits(['signed-in'])

const authTab = ref('login')
const submitting = ref(false)
const loginForm = ref({ username: 'demo', password: 'demo123' })
const registerForm = ref({ tenantCode: 'demo', storeName: '示例门店', username: 'demo', password: 'demo123' })

function assertFilled(form, fields) {
  const missing = fields.find((field) => !String(form[field] || '').trim())
  if (missing) {
    ElMessage.warning('请填写完整信息')
    return false
  }
  return true
}

async function login() {
  if (!assertFilled(loginForm.value, ['username', 'password'])) return
  submitting.value = true
  try {
    emit('signed-in', await authApi.login(loginForm.value))
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}

async function register() {
  if (!assertFilled(registerForm.value, ['tenantCode', 'storeName', 'username', 'password'])) return
  submitting.value = true
  try {
    emit('signed-in', await authApi.register(registerForm.value))
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}
</script>
