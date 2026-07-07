<template>
  <section class="auth-screen">
    <div class="auth-backdrop" aria-hidden="true"></div>

    <div class="auth-copy">
      <div class="auth-brand">
        <span class="auth-brand-mark">S</span>
        <div>
          <strong>Store SaaS</strong>
          <small>门店经营管理</small>
        </div>
      </div>

      <div class="auth-hero">
        <span class="eyebrow">STORE MANAGEMENT</span>
        <h1>门店管理后台</h1>
        <p>商品、库存、订单、收款，一个后台全部搞定。</p>
      </div>

      <div class="auth-points" aria-label="系统能力">
        <span>门店资料独立保存</span>
        <span>库存变化清晰可查</span>
        <span>订单收款统一管理</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-head">
        <span class="eyebrow">MANAGER LOGIN</span>
        <h2>登录</h2>
      </div>

      <el-tabs v-model="loginMode" class="auth-tabs" stretch>
        <el-tab-pane label="验证码登录" name="sms">
          <el-form
            ref="smsFormRef"
            :model="smsForm"
            :rules="smsRules"
            label-position="top"
            @keyup.enter="loginBySms"
          >
            <el-form-item label="手机号" prop="mobile">
              <el-input
                v-model.trim="smsForm.mobile"
                size="large"
                placeholder="请输入管理员手机号"
                autocomplete="tel"
              />
            </el-form-item>

            <el-form-item label="验证码" prop="code">
              <div class="code-row">
                <el-input
                  v-model.trim="smsForm.code"
                  size="large"
                  placeholder="6 位验证码"
                  autocomplete="one-time-code"
                />
                <el-button :disabled="countdown > 0" :loading="sendingCode" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-alert
              v-if="debugCode"
              class="debug-code"
              type="success"
              :closable="false"
              show-icon
              :title="`开发验证码：${debugCode}`"
            />

            <el-button class="auth-submit" type="primary" size="large" :loading="submitting" @click="loginBySms">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="密码登录" name="password">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-position="top"
            @keyup.enter="loginByPassword"
          >
            <el-form-item label="手机号" prop="mobile">
              <el-input
                v-model.trim="passwordForm.mobile"
                size="large"
                placeholder="请输入管理员手机号"
                autocomplete="tel"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="passwordForm.password"
                size="large"
                show-password
                placeholder="请输入备用密码"
                autocomplete="current-password"
              />
            </el-form-item>

            <el-button class="auth-submit" type="primary" size="large" :loading="submitting" @click="loginByPassword">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>


      <div class="auth-switch">
        没有账号？
        <RouterLink to="/register">入驻门店</RouterLink>
      </div>
    </div>

    <RouterLink to="/platform/login" class="platform-entry">平台管理后台</RouterLink>
  </section>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ACCOUNT_TYPE_KEY, authApi, PERMISSIONS_KEY, showApiError, TOKEN_KEY, USERNAME_KEY } from '../api'

const router = useRouter()
const smsFormRef = ref()
const passwordFormRef = ref()
const submitting = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const debugCode = ref('')
const loginMode = ref('sms')
let countdownTimer

const smsForm = reactive({
  mobile: '13800000000',
  code: ''
})
const passwordForm = reactive({
  mobile: '',
  password: ''
})

const requiredMessage = '请填写完整登录信息'
const mobileRules = [
  { required: true, message: '请输入手机号', trigger: 'blur' },
  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
]
const smsRules = {
  mobile: mobileRules,
  code: [{ required: true, message: requiredMessage, trigger: 'blur' }]
}
const passwordRules = {
  mobile: mobileRules,
  password: [{ required: true, message: requiredMessage, trigger: 'blur' }]
}

async function sendCode() {
  if (countdown.value > 0 || sendingCode.value) return
  const valid = await smsFormRef.value?.validateField('mobile').then(() => true).catch(() => false)
  if (!valid) return

  sendingCode.value = true
  try {
    const response = await authApi.sendStoreSmsCode({ mobile: smsForm.mobile })
    debugCode.value = response.debugCode || ''
    if (debugCode.value) {
      smsForm.code = debugCode.value
    }
    ElMessage.success('验证码已生成')
    startCountdown(response.expireSeconds || 300)
  } catch (error) {
    showApiError(error)
  } finally {
    sendingCode.value = false
  }
}

async function loginBySms() {
  if (submitting.value) return
  const valid = await smsFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await saveSession(authApi.login({ mobile: smsForm.mobile, code: smsForm.code, loginType: 'sms' }))
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}

async function loginByPassword() {
  if (submitting.value) return
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await saveSession(authApi.login({ mobile: passwordForm.mobile, password: passwordForm.password, loginType: 'password' }))
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}

async function saveSession(sessionPromise) {
  const session = await sessionPromise
  localStorage.setItem(TOKEN_KEY, session.tokenValue)
  localStorage.setItem(USERNAME_KEY, session.username)
  localStorage.setItem(ACCOUNT_TYPE_KEY, 'STORE')
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(session.permissions || []))
  await router.push('/')
}

function startCountdown(seconds) {
  window.clearInterval(countdownTimer)
  countdown.value = Math.min(seconds, 60)
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer)
    }
  }, 1000)
}

onBeforeUnmount(() => {
  window.clearInterval(countdownTimer)
})
</script>
