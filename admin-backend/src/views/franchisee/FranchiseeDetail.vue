<template>
  <div class="franchisee-detail">
    <div class="back-bar">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回商户中心
      </el-button>
    </div>

    <template v-if="merchant">
      <!-- 顶部信息卡 -->
      <div class="detail-hero">
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="avatar-ring">
            <div class="avatar">{{ merchant.contactName?.charAt(0) || merchant.companyName.charAt(0) }}</div>
            <div class="signal-badge" :class="'signal-' + (site?.signalLevel || 'A')">
              {{ site?.signalLevel || 'A' }}级信号
            </div>
          </div>
          <div class="hero-info">
            <div class="name-row">
              <h1>{{ merchant.contactName }} · {{ merchant.companyName }}</h1>
              <el-tag :type="statusTagType(merchant.status)" effect="dark" round>
                {{ statusText(merchant.status, 'franchisee') }}
              </el-tag>
            </div>
            <div class="sub-line">
              <span class="sub-item">📍 {{ site?.name || '主场地' }}</span>
              <span class="sub-item">📞 {{ merchant.contactPhone }}</span>
              <span class="sub-item">🏢 区域编码 {{ merchant.regionCode }}</span>
              <span class="sub-item">📅 入驻 {{ merchant.joinedAt || '—' }}</span>
            </div>
            <div class="quick-stats">
              <div class="qs">
                <span class="qs-value">¥{{ stats.totalRevenue.toLocaleString() }}</span>
                <span class="qs-label">累计营收</span>
              </div>
              <div class="qs">
                <span class="qs-value">{{ stats.vehicleCount }}</span>
                <span class="qs-label">车辆数</span>
              </div>
              <div class="qs">
                <span class="qs-value">{{ stats.onlineRate }}%</span>
                <span class="qs-label">7 日在线率</span>
              </div>
              <div class="qs">
                <span class="qs-value">{{ stats.orderCount }}</span>
                <span class="qs-label">累计订单</span>
              </div>
              <div class="qs">
                <span class="qs-value">{{ (merchant.settleRatio * 100).toFixed(0) }}%</span>
                <span class="qs-label">分成比例</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中部图表 + 电池健康 -->
      <div class="detail-row">
        <div class="panel chart-panel">
          <div class="panel-header">
            <div class="panel-title">📈 近 7 日营收</div>
            <el-tag effect="plain" type="warning">¥{{ stats.weekRevenue.toLocaleString() }}</el-tag>
          </div>
          <v-chart class="chart" :option="revenueOption" autoresize />
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🔋 电池健康度</div>
            <el-tag :type="batteryStatusType" effect="plain">{{ batteryStatusText }}</el-tag>
          </div>
          <div class="battery-list">
            <div v-for="b in siteBatteries" :key="b.id" class="battery-item">
              <div class="battery-meta">
                <span class="bat-sn">{{ b.sn }}</span>
                <span class="bat-cycle">{{ b.cycleCount }} 次循环</span>
              </div>
              <div class="battery-soh">
                <div class="soh-bar">
                  <div
                    class="soh-fill"
                    :class="getSohClass(b.soh)"
                    :style="{ width: b.soh + '%' }"
                  ></div>
                </div>
                <span class="soh-val" :class="getSohClass(b.soh)">{{ b.soh }}%</span>
              </div>
              <div class="battery-status">
                <el-tag :type="batteryTagType(b.status)" size="small">
                  {{ statusText(b.status, 'battery') }}
                </el-tag>
              </div>
            </div>
            <el-empty v-if="!siteBatteries.length" description="暂无电池数据" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 订单 + 车辆 -->
      <div class="detail-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🧾 最近订单</div>
            <span class="muted">共 {{ siteOrders.length }} 笔</span>
          </div>
          <el-table :data="siteOrders" border stripe size="small" max-height="320">
            <el-table-column prop="id" label="#" width="60" />
            <el-table-column label="时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="durationMin" label="时长" width="80">
              <template #default="{ row }">{{ row.durationMin }} 分钟</template>
            </el-table-column>
            <el-table-column prop="amount" label="订单金额" width="100">
              <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="franchiseeAmount" label="分成" width="100">
              <template #default="{ row }">¥{{ row.franchiseeAmount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="orderTagType(row.status)" size="small">
                  {{ orderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🚙 车队档案</div>
            <span class="muted">{{ siteVehicles.length }} 台</span>
          </div>
          <el-table :data="siteVehicles" border stripe size="small" max-height="320">
            <el-table-column prop="sn" label="SN" width="130" />
            <el-table-column prop="model" label="车型" min-width="120" />
            <el-table-column prop="gearLevel" label="档位" width="140" />
            <el-table-column prop="totalMileage" label="里程(km)" width="90" />
            <el-table-column label="在线率" width="90">
              <template #default="{ row }">{{ Math.round(row.onlineRate7d * 100) }}%</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="vehicleStatusType(row.status)" size="small">
                  {{ statusText(row.status, 'vehicle') }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 事故 + 保养 + 控制日志 -->
      <div class="detail-row three">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🚨 事故记录</div>
            <span class="muted">{{ siteAccidents.length }} 起</span>
          </div>
          <div class="record-list">
            <div v-for="a in siteAccidents" :key="a.id" class="record-item" :class="'resp-' + a.responsibility">
              <div class="rec-icon">{{ a.type === 'rollover' ? '🤸' : '💥' }}</div>
              <div class="rec-body">
                <div class="rec-title">
                  {{ a.location }}
                  <el-tag :type="respTagType(a.responsibility)" size="small">
                    {{ respText(a.responsibility) }}
                  </el-tag>
                </div>
                <div class="rec-desc">{{ a.description }}</div>
                <div class="rec-meta">{{ formatTime(a.occurredAt) }} · 维修 ¥{{ a.repairCost }}</div>
              </div>
            </div>
            <el-empty v-if="!siteAccidents.length" description="暂无事故记录" :image-size="60" />
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🛠 保养记录</div>
            <span class="muted">{{ siteMaintenance.length }} 项</span>
          </div>
          <div class="record-list">
            <div v-for="m in siteMaintenance" :key="m.id" class="record-item">
              <div class="rec-icon">{{ m.type === 'routine' ? '🧰' : '🔧' }}</div>
              <div class="rec-body">
                <div class="rec-title">
                  {{ m.item }}
                  <el-tag :type="m.status === 1 ? 'success' : 'warning'" size="small">
                    {{ statusText(m.status, 'maintenance') }}
                  </el-tag>
                </div>
                <div class="rec-meta" v-if="m.operator">操作人 {{ m.operator }} · ¥{{ m.cost }}</div>
                <div class="rec-meta" v-else-if="m.triggerDate">预计 {{ m.triggerDate }} 执行</div>
                <div class="rec-meta" v-else>已完成 {{ m.completedAt }}</div>
              </div>
            </div>
            <el-empty v-if="!siteMaintenance.length" description="暂无保养记录" :image-size="60" />
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📡 控制日志</div>
            <span class="muted">最近 {{ controlLogs.length }} 条</span>
          </div>
          <div class="log-list">
            <div v-for="log in controlLogs" :key="log.id" class="log-item">
              <span class="log-time">{{ formatTime(log.createdAt).slice(11) }}</span>
              <span class="log-icon" :class="'log-' + log.type">
                {{ logIcon(log.type) }}
              </span>
              <div class="log-body">
                <div class="log-text">{{ log.message }}</div>
                <div class="log-meta">操作人 {{ log.operator }}</div>
              </div>
            </div>
            <el-empty v-if="!controlLogs.length" description="暂无控制日志" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 基础信息 -->
      <div class="detail-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📋 基础信息</div>
          </div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="公司全称">{{ merchant.companyName }}</el-descriptions-item>
            <el-descriptions-item label="法人">{{ merchant.legalPerson }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ merchant.contactName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ merchant.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="区域编码">{{ merchant.regionCode }}</el-descriptions-item>
            <el-descriptions-item label="保证金">¥{{ merchant.depositAmount.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="入驻时间">{{ merchant.joinedAt || '—' }}</el-descriptions-item>
            <el-descriptions-item label="分成比例">{{ (merchant.settleRatio * 100).toFixed(0) }}%</el-descriptions-item>
            <el-descriptions-item label="场地等级">{{ site?.signalLevel || '—' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </template>

    <el-empty v-else description="未找到该商户" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  mockFranchisees,
  mockVehicles,
  mockSites,
  mockOrders,
  mockBatteries,
  mockAccidentRecords,
  mockMaintenanceRecords,
  mockControlLogs,
  getStatusText
} from '@/api/mock'

const route = useRoute()
const router = useRouter()

const merchant = computed(() => {
  const id = Number(route.params.id)
  return mockFranchisees.find(f => f.id === id)
})

const site = computed(() => {
  if (!merchant.value) return null
  return mockSites.find(s => s.franchiseeId === merchant.value.id)
})

const siteVehicles = computed(() => {
  if (!merchant.value) return []
  return mockVehicles.filter(v => v.franchiseeId === merchant.value.id)
})

const vehicleIds = computed(() => siteVehicles.value.map(v => v.id))

const siteBatteries = computed(() => {
  return mockBatteries.filter(b => vehicleIds.value.includes(b.vehicleId))
})

const siteOrders = computed(() => {
  if (!merchant.value) return []
  return mockOrders
    .filter(o => o.franchiseeId === merchant.value.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const siteAccidents = computed(() => {
  return mockAccidentRecords
    .filter(a => vehicleIds.value.includes(a.vehicleId))
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
})

const siteMaintenance = computed(() => {
  return mockMaintenanceRecords
    .filter(m => vehicleIds.value.includes(m.vehicleId))
    .sort((a, b) => {
      const ta = a.completedAt || a.triggerDate || ''
      const tb = b.completedAt || b.triggerDate || ''
      return tb.localeCompare(ta)
    })
})

const controlLogs = computed(() => {
  const all = mockControlLogs.filter(l => vehicleIds.value.includes(l.vehicleId))
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
})

const stats = computed(() => {
  const list = siteVehicles.value
  const totalRevenue = list.reduce((sum, v) => sum + (v.totalRevenue || 0), 0)
  const orderCount = list.reduce((sum, v) => sum + (v.orderCount || 0), 0)
  const onlineRate = list.length
    ? Math.round(list.reduce((sum, v) => sum + v.onlineRate7d, 0) / list.length * 100)
    : 0
  const weekRevenue = siteOrders.value.reduce((s, o) => s + (o.amount || 0), 0)
  return {
    totalRevenue,
    orderCount,
    onlineRate,
    vehicleCount: list.length,
    weekRevenue
  }
})

const batteryStatusType = computed(() => {
  const list = siteBatteries.value
  if (!list.length) return 'info'
  if (list.some(b => b.soh < 70)) return 'danger'
  if (list.some(b => b.soh < 80)) return 'warning'
  return 'success'
})

const batteryStatusText = computed(() => {
  const list = siteBatteries.value
  if (!list.length) return '暂无数据'
  if (list.some(b => b.soh < 70)) return '需立即处理'
  if (list.some(b => b.soh < 80)) return '建议关注'
  return '全部健康'
})

// 工具函数
const statusText = (status, type) => getStatusText(type, status)

const statusTagType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

const vehicleStatusType = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'info', 3: 'danger', 4: 'info', 5: 'info' }
  return map[status] || 'info'
}

const batteryTagType = (status) => {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[status] || 'info'
}

const orderTagType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }
  return map[status] || 'info'
}

const orderStatusText = (status) => {
  const map = { 0: '待支付', 1: '已完成', 2: '已退款', 3: '争议' }
  return map[status] || '未知'
}

const respTagType = (resp) => {
  const map = { player: 'warning', device: 'danger', platform: 'info' }
  return map[resp] || 'info'
}

const respText = (resp) => {
  const map = { player: '玩家责任', device: '设备责任', platform: '平台责任' }
  return map[resp] || '未定责'
}

const getSohClass = (soh) => {
  if (soh >= 90) return 'soh-good'
  if (soh >= 80) return 'soh-mid'
  if (soh >= 70) return 'soh-warn'
  return 'soh-bad'
}

const logIcon = (type) => {
  const map = {
    flash: '💡',
    lock: '🔒',
    unlock: '🔓',
    emergency_stop: '🛑'
  }
  return map[type] || '📍'
}

const formatTime = (t) => {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

const goBack = () => {
  router.push('/merchant/center')
}

// 营收图表
const revenueOption = computed(() => {
  // 模拟 7 日数据，按商户 id 生成稳定序列
  const seed = merchant.value ? merchant.value.id * 137 : 1
  const base = [3800, 4200, 4600, 5100, 4800, 5400, stats.value.weekRevenue || 6800]
  const data = base.map((v, i) => Math.round(v * (0.85 + ((seed + i * 31) % 35) / 100)))
  const labels = ['9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '今日']
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 17, 23, 0.95)',
      borderColor: '#ff6b00',
      textStyle: { color: '#fff' },
      formatter: params => {
        const p = params[0]
        return `<div style="font-weight:700">${p.name}</div>营收 ¥${p.value.toLocaleString()}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: '#9ca3af' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#9ca3af' }
    },
    series: [
      {
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        lineStyle: { width: 3, color: '#ff6b00' },
        itemStyle: { color: '#ff6b00', borderWidth: 2, borderColor: '#0a0a0f' },
        data,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 107, 0, 0.35)' },
              { offset: 1, color: 'rgba(255, 107, 0, 0.02)' }
            ]
          }
        }
      }
    ]
  }
})
</script>

<style scoped>
.franchisee-detail {
  padding: 20px 24px 40px;
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #11131a 100%);
  color: #fff;
}

.back-bar {
  margin-bottom: 16px;
}

.back-bar :deep(.el-button) {
  color: #9ca3af;
  font-size: 13px;
}

.back-bar :deep(.el-button:hover) {
  color: #ff6b00;
}

/* Hero */
.detail-hero {
  position: relative;
  padding: 28px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 107, 0, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 40%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -50%;
  left: -10%;
  width: 120%;
  height: 200%;
  background: radial-gradient(ellipse at center, rgba(255, 107, 0, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.hero-inner {
  position: relative;
  display: flex;
  gap: 24px;
  align-items: center;
}

.avatar-ring {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  padding: 4px;
  background: conic-gradient(from 0deg, #ff6b00, #8b5cf6, #00d4ff, #ff6b00);
  animation: rotateRing 8s linear infinite;
  flex-shrink: 0;
}

@keyframes rotateRing {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  color: #ff6b00;
}

.signal-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
  border: 2px solid #0a0a0f;
}

.signal-S { background: rgba(103, 194, 58, 0.25); color: #67c23a; }
.signal-A { background: rgba(16, 185, 129, 0.25); color: #34d399; }
.signal-B { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
.signal-F { background: rgba(239, 68, 68, 0.25); color: #ef4444; }

.hero-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.name-row h1 {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #fff 0%, #ffb380 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sub-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.sub-item {
  font-size: 13px;
  color: #9ca3af;
}

.quick-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.qs {
  display: flex;
  flex-direction: column;
}

.qs-value {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.qs-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 行容器 */
.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-row.three {
  grid-template-columns: 1fr 1fr 1fr;
}

.detail-row > .panel {
  min-width: 0;
}

/* 面板通用 */
.panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.muted {
  font-size: 12px;
  color: #9ca3af;
}

/* 图表 */
.chart-panel .chart {
  width: 100%;
  min-height: 240px;
}

/* 电池 */
.battery-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.battery-item {
  display: grid;
  grid-template-columns: 1fr 1.5fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.battery-meta {
  display: flex;
  flex-direction: column;
}

.bat-sn {
  font-size: 13px;
  font-weight: 700;
  color: #d1d5db;
  font-family: 'Courier New', monospace;
}

.bat-cycle {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.battery-soh {
  display: flex;
  align-items: center;
  gap: 10px;
}

.soh-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.soh-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s;
}

.soh-fill.soh-good { background: linear-gradient(90deg, #67c23a, #95d475); box-shadow: 0 0 8px rgba(103, 194, 58, 0.5); }
.soh-fill.soh-mid { background: linear-gradient(90deg, #00d4ff, #34d399); box-shadow: 0 0 8px rgba(0, 212, 255, 0.4); }
.soh-fill.soh-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
.soh-fill.soh-bad { background: linear-gradient(90deg, #ef4444, #f87171); box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }

.soh-val {
  font-size: 14px;
  font-weight: 800;
  min-width: 44px;
  text-align: right;
}

.soh-val.soh-good { color: #67c23a; }
.soh-val.soh-mid { color: #00d4ff; }
.soh-val.soh-warn { color: #fbbf24; }
.soh-val.soh-bad { color: #ef4444; }

/* 记录列表 */
.record-list,
.log-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border-left: 3px solid transparent;
}

.record-item.resp-player { border-left-color: #f59e0b; }
.record-item.resp-device { border-left-color: #ef4444; }
.record-item.resp-platform { border-left-color: #00d4ff; }

.rec-icon {
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  flex-shrink: 0;
}

.rec-body {
  flex: 1;
  min-width: 0;
}

.rec-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rec-desc {
  font-size: 12px;
  color: #d1d5db;
  margin-bottom: 4px;
}

.rec-meta {
  font-size: 11px;
  color: #9ca3af;
}

/* 控制日志 */
.log-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  align-items: center;
}

.log-time {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
  min-width: 40px;
}

.log-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.log-flash { color: #fbbf24; }
.log-lock { color: #ef4444; }
.log-unlock { color: #67c23a; }
.log-emergency_stop { color: #ef4444; }

.log-body {
  flex: 1;
  min-width: 0;
}

.log-text {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.log-meta {
  font-size: 11px;
  color: #9ca3af;
}

/* 深色覆盖 Element */
.panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.02);
  --el-table-header-bg-color: rgba(255, 107, 0, 0.12);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: #d1d5db;
  --el-table-header-text-color: #fff;
  --el-table-row-hover-bg-color: rgba(255, 107, 0, 0.08);
}

.panel :deep(.el-descriptions__label) {
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.04) !important;
}

.panel :deep(.el-descriptions__content) {
  color: #fff;
  background: rgba(255, 255, 255, 0.02) !important;
}

.panel :deep(.el-empty__description p) {
  color: #9ca3af;
}

@media (max-width: 1024px) {
  .detail-row,
  .detail-row.three {
    grid-template-columns: 1fr;
  }
  .hero-inner { flex-direction: column; align-items: flex-start; }
  .quick-stats { gap: 16px; }
  .name-row h1 { font-size: 18px; }
}
</style>