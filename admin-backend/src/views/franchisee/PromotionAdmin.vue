<template>
  <div class="promotion-admin">
    <div class="page-header">
      <div class="page-title">📣 推广总览</div>
      <div class="header-actions">
        <el-button type="primary" @click="onPublishTask">+ 发布推广任务</el-button>
        <el-button @click="onGrantReward">💰 发放奖励</el-button>
      </div>
    </div>

    <!-- 顶部 4 个数据卡 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div>
          <div class="kpi-value">{{ stats.totalReach.toLocaleString() }}</div>
          <div class="kpi-label">本月推广总曝光</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div>
          <div class="kpi-value">{{ stats.taskDone }}/{{ stats.taskTotal }}</div>
          <div class="kpi-label">任务完成率</div>
        </div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-icon">⏳</div>
        <div>
          <div class="kpi-value">¥{{ stats.pendingCash.toLocaleString() }}</div>
          <div class="kpi-label">待发放奖励</div>
        </div>
      </div>
      <div class="kpi-card success">
        <div class="kpi-icon">💸</div>
        <div>
          <div class="kpi-value">¥{{ stats.paidCash.toLocaleString() }}</div>
          <div class="kpi-label">本月已发放</div>
        </div>
      </div>
    </div>

    <!-- 加盟商推广榜单 + 趋势图 -->
    <div class="admin-row">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">🏆 加盟商推广榜</div>
          <span class="muted">按本月推广数据</span>
        </div>
        <el-table :data="franchiseeList" border stripe size="small" max-height="360" @row-click="goDetail">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column label="加盟商" min-width="160">
            <template #default="{ row }">
              <div class="merchant-cell">
                <div class="mc-avatar">{{ row.contactName.charAt(0) }}</div>
                <div>
                  <div class="mc-name">{{ row.contactName }}</div>
                  <div class="mc-site">{{ row.siteName }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="reach" label="曝光" width="110" sortable>
            <template #default="{ row }">{{ row.reach.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="interactions" label="互动" width="90" />
          <el-table-column prop="taskDone" label="任务" width="80">
            <template #default="{ row }">{{ row.taskDone }}/{{ row.taskTotal }}</template>
          </el-table-column>
          <el-table-column prop="invites" label="邀请" width="80" />
          <el-table-column label="奖励" width="110">
            <template #default="{ row }">
              <span class="money">¥{{ row.reward.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="趋势" width="100">
            <template #default="{ row }">
              <span v-if="row.trend === 'up'" class="trend up">▲ {{ row.trendValue }}%</span>
              <span v-else-if="row.trend === 'down'" class="trend down">▼ {{ row.trendValue }}%</span>
              <span v-else class="trend hold">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="goDetail(row)">
                详情
              </el-button>
              <el-button link type="warning" size="small" @click.stop="onGrant(row)">
                奖励
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel chart-panel">
        <div class="panel-header">
          <div class="panel-title">📈 近 7 日推广曝光</div>
        </div>
        <v-chart class="chart" :option="trendOption" autoresize />
      </div>
    </div>

    <!-- 待审核推广 + 奖励待发放 -->
    <div class="admin-row two">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">📝 待审核推广记录</div>
          <span class="muted">{{ pendingPromotions.length }} 条</span>
        </div>
        <el-table :data="pendingPromotions" border stripe size="small" max-height="320">
          <el-table-column prop="id" label="#" width="60" />
          <el-table-column label="加盟商" width="120">
            <template #default="{ row }">{{ franchiseeName(row.franchiseeId) }}</template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="90">
            <template #default="{ row }">
              <span class="type-chip" :class="'type-' + row.type">{{ typeText(row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="platform" label="平台" width="100">
            <template #default="{ row }">{{ row.platform || '—' }}</template>
          </el-table-column>
          <el-table-column prop="reach" label="曝光" width="100">
            <template #default="{ row }">{{ row.reach ? row.reach.toLocaleString() : '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" size="small" @click="onApprove(row)">通过</el-button>
              <el-button link type="danger" size="small" @click="onReject(row)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!pendingPromotions.length" description="全部已审核完" :image-size="60" />
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">💰 待发放奖励</div>
          <span class="muted">¥{{ pendingRewardCash.toLocaleString() }} 待发</span>
        </div>
        <el-table :data="pendingRewards" border stripe size="small" max-height="320">
          <el-table-column prop="id" label="#" width="60" />
          <el-table-column label="加盟商" width="120">
            <template #default="{ row }">{{ franchiseeName(row.franchiseeId) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="source" label="来源" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'warning' : 'primary'" size="small">
                {{ statusText('reward', row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" min-width="140" />
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" size="small" @click="onPay(row)">发放</el-button>
              <el-button link type="danger" size="small" @click="onCancelReward(row)">撤销</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!pendingRewards.length" description="无待发奖励" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  mockFranchisees,
  mockSites,
  mockPromotions,
  mockRewards,
  getStatusText
} from '@/api/mock'

const router = useRouter()

// 响应式数据（用于本地状态变更）
const promotions = ref([...mockPromotions])
const rewards = ref([...mockRewards])

// 加盟商汇总
const franchiseeList = computed(() => {
  return mockFranchisees
    .filter(f => f.status === 1)
    .map(f => {
      const myPromos = promotions.value.filter(p => p.franchiseeId === f.id)
      const myRewards = rewards.value.filter(r => r.franchiseeId === f.id && r.type === 'cash')
      const reach = myPromos.reduce((s, p) => s + (p.reach || 0), 0)
      const interactions = myPromos.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0)
      const site = mockSites.find(s => s.franchiseeId === f.id)
      const trendValue = Math.floor(Math.random() * 30) + 5
      const trend = Math.random() > 0.4 ? 'up' : 'down'
      return {
        ...f,
        siteName: site?.name || '主场地',
        reach,
        interactions,
        taskDone: 1 + Math.floor(Math.random() * 3),
        taskTotal: 4,
        invites: 5 + Math.floor(Math.random() * 15),
        reward: myRewards.reduce((s, r) => s + r.amount, 0),
        trend,
        trendValue
      }
    })
    .sort((a, b) => b.reach - a.reach)
})

// 待审核
const pendingPromotions = computed(() => promotions.value.filter(p => p.status === 0))

// 待发放奖励
const pendingRewards = computed(() => rewards.value.filter(r => r.status !== 2 && r.type === 'cash'))
const pendingRewardCash = computed(() => pendingRewards.value.reduce((s, r) => s + r.amount, 0))

// KPI
const stats = reactive({
  totalReach: 0,
  taskDone: 0,
  taskTotal: 0,
  pendingCash: 0,
  paidCash: 0
})

const refreshStats = () => {
  stats.totalReach = franchiseeList.value.reduce((s, f) => s + f.reach, 0)
  stats.taskDone = franchiseeList.value.reduce((s, f) => s + f.taskDone, 0)
  stats.taskTotal = franchiseeList.value.reduce((s, f) => s + f.taskTotal, 0)
  stats.pendingCash = pendingRewardCash.value
  stats.paidCash = rewards.value.filter(r => r.status === 2 && r.type === 'cash').reduce((s, r) => s + r.amount, 0)
}
refreshStats()

const statusText = (type, status) => getStatusText(type, status)

const typeText = (t) => {
  const map = { video: '短视频', invite: '邀请', content: '素材', live: '直播' }
  return map[t] || '其它'
}

const franchiseeName = (id) => {
  const f = mockFranchisees.find(x => x.id === id)
  return f ? f.contactName : '—'
}

const goDetail = (row) => {
  router.push(`/franchisee/detail/${row.id}`)
}

const onApprove = (row) => {
  ElMessageBox.confirm(`确认通过「${row.title}」？将通过后自动生成奖励`, '审核推广', {
    confirmButtonText: '通过并发放奖励',
    cancelButtonText: '取消'
  }).then(() => {
    const target = promotions.value.find(p => p.id === row.id)
    if (target) {
      target.status = 1
      // 同步生成奖励记录
      const newId = Math.max(0, ...rewards.value.map(r => r.id)) + 1
      rewards.value.push({
        id: newId,
        franchiseeId: target.franchiseeId,
        type: 'cash',
        amount: target.reward || 100,
        source: target.title,
        status: 0,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        paidAt: null
      })
      ElMessage.success('已通过并生成奖励待发放')
      refreshStats()
    }
  }).catch(() => {})
}

const onReject = (row) => {
  ElMessageBox.prompt('驳回原因（将通知加盟商）', '驳回推广', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    const target = promotions.value.find(p => p.id === row.id)
    if (target) {
      target.status = 2
      ElMessage.warning(`已驳回：${value || '未填原因'}`)
      refreshStats()
    }
  }).catch(() => {})
}

const onPay = (row) => {
  ElMessageBox.confirm(`确认向 ${franchiseeName(row.franchiseeId)} 发放 ¥${row.amount} 现金奖励？`, '发放奖励', {
    confirmButtonText: '确认发放',
    cancelButtonText: '取消'
  }).then(() => {
    const target = rewards.value.find(r => r.id === row.id)
    if (target) {
      target.status = 2
      target.paidAt = new Date().toISOString().replace('T', ' ').slice(0, 16)
      ElMessage.success('奖励已发放，款项将进入下个结算周期')
      refreshStats()
    }
  }).catch(() => {})
}

const onCancelReward = (row) => {
  ElMessageBox.confirm('确认撤销该奖励？', '撤销', {
    type: 'warning'
  }).then(() => {
    const idx = rewards.value.findIndex(r => r.id === row.id)
    if (idx > -1) {
      rewards.value.splice(idx, 1)
      ElMessage.success('已撤销')
      refreshStats()
    }
  }).catch(() => {})
}

const onGrant = (row) => {
  ElMessageBox.confirm(
    `向 ${row.contactName} 发放一次性奖励？`,
    '发放奖励',
    {
      confirmButtonText: '去发放',
      cancelButtonText: '取消'
    }
  ).then(() => {
    ElMessage.success('请选择具体奖励规则')
  }).catch(() => {})
}

const onPublishTask = () => {
  ElMessage.success('任务编辑器已打开（演示）')
}

const onGrantReward = () => {
  ElMessage.success('奖励发放向导已打开（演示）')
}

// 趋势图
const trendOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderColor: '#ff6b00',
    textStyle: { color: '#fff' }
  },
  legend: {
    data: ['曝光', '互动'],
    textStyle: { color: '#9ca3af' },
    top: 0,
    right: 0
  },
  grid: { left: '3%', right: '4%', bottom: '5%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '今日'],
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
      name: '曝光',
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 3, color: '#ff6b00' },
      itemStyle: { color: '#ff6b00' },
      data: [8200, 9100, 8600, 10200, 11500, 12800, 13200],
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 107, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 107, 0, 0.02)' }
          ]
        }
      }
    },
    {
      name: '互动',
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 2, color: '#8b5cf6' },
      itemStyle: { color: '#8b5cf6' },
      data: [320, 480, 410, 560, 720, 680, 790]
    }
  ]
}))
</script>

<style scoped>
.promotion-admin {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #11131a 100%);
  color: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(90deg, #fff 0%, #ffb380 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions :deep(.el-button) {
  border: none !important;
  font-weight: 700;
}

.header-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff6b00, #ff8c00) !important;
  color: #fff !important;
}

.header-actions :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #d1d5db !important;
}

/* KPI */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.kpi-card.warn { border-color: rgba(245, 158, 11, 0.3); }
.kpi-card.success { border-color: rgba(103, 194, 58, 0.3); }

.kpi-icon { font-size: 28px; }

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
}

.kpi-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 通用 */
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

.muted { font-size: 12px; color: #9ca3af; }

.admin-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.admin-row.two { grid-template-columns: 1fr 1fr; }
.admin-row > .panel { min-width: 0; }

.chart-panel .chart {
  width: 100%;
  min-height: 360px;
}

/* 表格行点击态 */
.panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.02);
  --el-table-header-bg-color: rgba(255, 107, 0, 0.12);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: #d1d5db;
  --el-table-header-text-color: #fff;
  --el-table-row-hover-bg-color: rgba(255, 107, 0, 0.08);
}

.panel :deep(.el-table tr) {
  cursor: pointer;
}

/* 加盟商单元格 */
.merchant-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mc-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b00, #8b5cf6);
  color: #fff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mc-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.mc-site {
  font-size: 11px;
  color: #9ca3af;
}

.money {
  color: #ff6b00;
  font-weight: 800;
}

.trend { font-size: 12px; font-weight: 700; }
.trend.up { color: #67c23a; }
.trend.down { color: #ef4444; }
.trend.hold { color: #6b7280; }

.type-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.type-chip.type-video { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.type-chip.type-invite { background: rgba(0, 212, 255, 0.2); color: #22d3ee; }
.type-chip.type-content { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.type-chip.type-live { background: rgba(236, 72, 153, 0.2); color: #f472b6; }

.panel :deep(.el-empty__description p) { color: #9ca3af; }

@media (max-width: 1024px) {
  .admin-row, .admin-row.two, .kpi-row { grid-template-columns: 1fr; }
}
</style>