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
        <span class="eyebrow">STORE ONBOARDING</span>
        <h1>开通门店后台</h1>
        <p>填写信息后提交平台审核，审核通过后即可登录门店后台。</p>
      </div>

      <div class="auth-points" aria-label="入驻收益">
        <span>门店资料独立保存</span>
        <span>商品库存统一管理</span>
        <span>订单收款清晰可查</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-head">
        <span class="eyebrow">STORE ONBOARDING</span>
        <h2>门店入驻</h2>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="register"
      >
        <el-form-item label="门店名称" prop="storeName">
          <el-input
            v-model.trim="form.storeName"
            size="large"
            placeholder="例如 示例便利店"
            autocomplete="organization-title"
          />
        </el-form-item>

        <el-form-item label="门店地址" prop="address">
          <el-input
            v-model.trim="form.address"
            size="large"
            placeholder="例如 上海市浦东新区示例路 100 号"
            autocomplete="street-address"
          />
        </el-form-item>

        <el-form-item label="营业时间" prop="businessHours">
          <el-input
            v-model.trim="form.businessHours"
            size="large"
            placeholder="例如 09:00-22:00"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="管理员手机号" prop="mobile">
          <el-input
            v-model.trim="form.mobile"
            size="large"
            placeholder="用于登录和接收验证码"
            autocomplete="tel"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            show-password
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-button class="auth-submit" type="primary" size="large" :loading="submitting" @click="register">
           提交申请
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
import { ElMessage } from 'element-plus'
import { authApi, showApiError } from '../api'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const form = reactive({
  storeName: '',
  address: '',
  businessHours: '',
  mobile: '',
  password: ''
})

const requiredMessage = '请填写完整入驻信息'
const rules = {
  storeName: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  address: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  businessHours: [{ required: true, message: requiredMessage, trigger: 'blur' }],
  mobile: [
    { required: true, message: requiredMessage, trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
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
    await authApi.register({ ...form })
    ElMessage.success('入驻申请已提交，请等待平台管理员审核')
    await router.push('/login')
  } catch (error) {
    showApiError(error)
  } finally {
    submitting.value = false
  }
}
</script>
