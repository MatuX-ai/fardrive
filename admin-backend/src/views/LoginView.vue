<template>
  <div class="login-page">
    <div class="login-decoration"></div>
    <el-card class="login-card" shadow="always">
      <div class="login-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/>
          <path d="M8.2 7.6 17 16.4"/><path d="M6 3.5V2M2.5 6H1M20.5 18v1.5M18 20.5H16.5"/>
        </svg>
        <span class="brand-en">FarDrive</span>
        <span class="brand-zh">远驱</span>
      </div>
      <div class="login-title">
        <h2>平台管理后台</h2>
        <p>足不出户，开向远方</p>
      </div>
      <el-form :model="form" :rules="rules" ref="loginForm" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin" size="large">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        演示账号：admin / admin123
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginForm = ref()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await loginForm.value.validate()
  loading.value = true
  try {
    const success = await authStore.login(form.username, form.password)
    if (success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  width: 100vw;
  background:
    radial-gradient(ellipse at top left, rgba(232, 163, 61, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(95, 125, 91, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #12233D 0%, #1E3A5F 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-decoration {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(232, 163, 61, 0.08) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(245, 242, 234, 0.06) 0%, transparent 30%);
  pointer-events: none;
}

.login-card {
  width: 440px;
  padding: 24px 8px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #FFFFFF;
  box-shadow: 0 24px 60px rgba(18, 35, 61, 0.35);
  position: relative;
  z-index: 1;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.login-brand svg {
  width: 32px;
  height: 32px;
  color: #E8A33D;
}

.brand-en {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 900;
  color: #12233D;
  letter-spacing: 0.04em;
}

.brand-zh {
  font-size: 14px;
  color: #66707E;
  font-weight: 500;
}

.login-title {
  text-align: center;
  margin-bottom: 28px;
}

.login-title h2 {
  font-size: 24px;
  color: #12233D;
  margin-bottom: 6px;
  font-weight: 700;
}

.login-title p {
  color: #66707E;
  font-size: 14px;
  font-style: italic;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(135deg, #12233D 0%, #1E3A5F 100%);
  border: none;
  letter-spacing: 0.1em;
}

.login-btn:hover {
  background: linear-gradient(135deg, #1E3A5F 0%, #2c4570 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(18, 35, 61, 0.25);
}

.login-tip {
  margin-top: 16px;
  text-align: center;
  color: #66707E;
  font-size: 13px;
}
</style>