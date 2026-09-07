<template>
  <el-menu
    :default-active="activeMenu"
    background-color="transparent"
    text-color="rgba(245,242,234,0.75)"
    active-text-color="#E8A33D"
    :collapse-transition="false"
    router
    class="side-menu"
  >
    <template v-for="route in menuRoutes" :key="route.path">
      <el-sub-menu v-if="hasVisibleChildren(route)" :index="resolvePath(route.path)">
        <template #title>
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <span>{{ route.meta.title }}</span>
        </template>
        <el-menu-item
          v-for="child in visibleChildren(route)"
          :key="child.path"
          :index="resolveChildPath(route, child)"
        >
          {{ child.meta.title }}
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item v-else :index="resolvePath(route.path)">
        <el-icon><component :is="route.meta.icon" /></el-icon>
        <span>{{ route.meta.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from '@/router'

const currentRoute = useRoute()

// 路径前缀（来自 createWebHistory 的 base）
const BASE = '/admin'

const resolvePath = (p) => {
  if (!p) return ''
  if (p.startsWith(BASE)) return p
  return BASE + (p.startsWith('/') ? p : '/' + p)
}

const resolveChildPath = (parent, child) => {
  if (child.path.startsWith('/')) return resolvePath(child.path)
  return resolvePath((parent.path || '') + '/' + child.path)
}

const menuRoutes = computed(() => {
  const layoutRoute = routes.find(r => r.path === '/')
  return layoutRoute?.children || []
})

const visibleChildren = (route) => {
  return (route.children || []).filter(child => !child.meta?.hidden)
}

const hasVisibleChildren = (route) => {
  return visibleChildren(route).length > 0
}

const activeMenu = computed(() => currentRoute.path)
</script>

<style scoped>
.side-menu {
  border-right: none;
  flex: 1;
  background: transparent !important;
}

.side-menu :deep(.el-menu-item),
.side-menu :deep(.el-sub-menu__title) {
  color: rgba(245, 242, 234, 0.75) !important;
}

.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(232, 163, 61, 0.08) !important;
  color: #E8A33D !important;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(232, 163, 61, 0.18) 0%, rgba(232, 163, 61, 0) 100%) !important;
  color: #E8A33D !important;
  border-right: 3px solid #E8A33D;
}

.side-menu :deep(.el-sub-menu .el-menu-item) {
  background: transparent !important;
  min-width: 0;
}

.side-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: rgba(232, 163, 61, 0.12) !important;
  color: #E8A33D !important;
  border-right: none;
}
</style>