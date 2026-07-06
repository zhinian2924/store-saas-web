<template>
  <section class="auth-screen">
    <div class="auth-copy">
      <span class="eyebrow">STORE SAAS</span>
      <h1>小店经营后台</h1>
      <p>用一套轻量后台管理商品、库存、订单和收款记录。</p>
      <div class="auth-points">
        <span>门店资料独立保存</span>
        <span>库存变化清晰可查</span>
        <span>订单收款统一管理</span>
      </div>
    </div>

    <div class="auth-panel">
      <el-tabs v-model="authTab">
        <el-tab-pane label="门店登录" name="login">
          <el-form :model="loginForm" label-position="top" @keyup.enter="login">
            <el-form-item label="手机号">
              <el-input v-model="loginForm.mobile" placeholder="13800000000" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" show-password placeholder="demo123" />
            </el-form-item>
            <el-button type="primary" :loading="submitting" @click="login">登录门店后台</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="门店入驻" name="register">
          <el-form :model="registerForm" label-position="top" @keyup.enter="register">
            <el-form-item label="门店名称">
              <el-input v-model="registerForm.storeName" placeholder="例如 示例门店" />
            </el-form-item>
            <el-form-item label="门店地址">
              <el-input v-model="registerForm.address" placeholder="例如 上海市浦东新区示例路 100 号" />
            </el-form-item>
            <el-form-item label="营业时间">
              <el-input v-model="registerForm.businessHours" placeholder="例如 09:00-22:00" />
            </el-form-item>
            <el-form-item label="管理员手机号">
              <el-input v-model="registerForm.mobile" placeholder="13800000000" />
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
const loginForm = ref({ mobile: '13800000000', password: 'demo123', loginType: 'password' })
const registerForm = ref({
  storeName: '示例门店',
  address: '上海市浦东新区示例路 100 号',
  businessHours: '09:00-22:00',
  mobile: '13800000000',
  password: 'demo123'
})

function assertFilled(form, fields) {
  const missing = fields.find((field) => !String(form[field] || '').trim())
  if (missing) {
    ElMessage.warning('请填写完整信息')
    return false
  }
  return true
}

async function login() {
  if (!assertFilled(loginForm.value, ['mobile', 'password'])) return
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
  if (!assertFilled(registerForm.value, ['storeName', 'address', 'businessHours', 'mobile', 'password'])) return
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
