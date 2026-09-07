<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="sidebar">
      <div class="brand">
        <a href="/" class="brand-link" aria-label="FarDrive 首页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/>
            <path d="M8.2 7.6 17 16.4"/><path d="M6 3.5V2M2.5 6H1M20.5 18v1.5M18 20.5H16.5"/>
          </svg>
          <span class="brand-text">
            <span class="brand-en">FarDrive</span>
            <span class="brand-zh">远驱 · 管理后台</span>
          </span>
        </a>
      </div>
      <SideMenu />
    </el-aside>
    <el-container>
      <el-header class="header">
        <HeaderBar />
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import SideMenu from './SideMenu.vue'
import HeaderBar from './HeaderBar.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #12233D 0%, #1E3A5F 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(18, 35, 61, 0.08);
}

.brand {
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #F5F2EA;
  text-decoration: none;
}

.brand-link svg {
  width: 28px;
  height: 28px;
  color: #E8A33D;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-en {
  font-family: 'Noto Serif SC', 'Times New Roman', serif;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.brand-zh {
  font-size: 12px;
  color: rgba(245, 242, 234, 0.7);
  margin-top: 2px;
  letter-spacing: 0.04em;
}

.header {
  background: #FFFFFF;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(18, 35, 61, 0.04);
}

.main-content {
  background: var(--color-bg);
  overflow-y: auto;
}
</style>