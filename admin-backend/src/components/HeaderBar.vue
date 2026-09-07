<template>
  <div class="header-bar">
    <div class="breadcrumb">
      <el-breadcrumb>
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="user-info">
      <el-dropdown @command="handleCommand">
        <span class="user-name">
          {{ authStore.user?.realName || '未登录' }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const breadcrumbs = computed(() => {
  const list = []
  route.matched.forEach(match => {
    if (match.meta?.title) {
      list.push({ title: match.meta.title, path: match.path })
    }
    if (match.children) {
      const child = match.children.find(c => c.path === route.path)
      if (child?.meta?.title) {
        list.push({ title: child.meta.title, path: child.path })
      }
    }
  })
  return list
})

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.header-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
}
</style>
