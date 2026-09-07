<template>
  <div class="promotion-center">
    <div class="back-bar">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回商户中心
      </el-button>
    </div>

    <template v-if="merchant">
      <!-- 顶部推广主信息 -->
      <div class="promo-hero">
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="hero-left">
            <div class="title-row">
              <span class="title-icon">📣</span>
              <h1>推广中心</h1>
              <el-tag effect="dark" type="warning" round>等级 Lv.{{ currentMerchant.level }}</el-tag>
            </div>
            <p class="hero-sub">总部下发的推广任务与素材，完成后自动获得现金 + XP 奖励</p>
            <div class="hero-stats">
              <div class="hs">
                <span class="hs-value">{{ stats.monthReward }}</span>
                <span class="hs-label">本月获得奖励(元)</span>
              </div>
              <div class="hs">
                <span class="hs-value">{{ stats.monthXp }}</span>
                <span class="hs-label">本月获得 XP</span>
              </div>
              <div class="hs">
                <span class="hs-value">{{ stats.totalReach.toLocaleString() }}</span>
                <span class="hs-label">累计曝光</span>
              </div>
              <div class="hs">
                <span class="hs-value">{{ stats.taskDone }}/{{ stats.taskTotal }}</span>
                <span class="hs-label">本月任务完成</span>
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="code-card">
              <div class="code-label">我的推广码</div>
              <div class="code-value">{{ code?.code || '—' }}</div>
              <div class="code-meta">
                <span>累计邀请 {{ code?.totalInvites || 0 }} 人</span>
                <span>转化订单 {{ code?.totalOrders || 0 }} 单</span>
              </div>
              <div class="code-actions">
                <el-button type="primary" size="small" @click="copyLink">
                  📋 复制链接
                </el-button>
                <el-button size="small" @click="downloadQr">
                  ⬇ 下载二维码
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中部：推广任务 + 素材库 -->
      <div class="promo-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🎯 总部推广任务</div>
            <span class="muted">共 {{ tasks.length }} 项 · 剩余 {{ pendingTasks.length }} 项未完成</span>
          </div>
          <div class="task-list">
            <div
              v-for="t in tasks"
              :key="t.id"
              class="task-card"
              :class="['status-' + t.status, 'type-' + t.type]"
            >
              <div class="task-icon">{{ taskIcon(t.type) }}</div>
              <div class="task-body">
                <div class="task-title-row">
                  <div class="task-title">{{ t.title }}</div>
                  <el-tag :type="taskTagType(t.status)" effect="dark" size="small">
                    {{ statusText('promotionTask', t.status) }}
                  </el-tag>
                </div>
                <div class="task-desc">{{ t.desc }}</div>
                <div class="task-progress" v-if="t.status !== 2">
                  <div class="tp-track">
                    <div class="tp-fill" :style="{ width: taskProgress(t) + '%' }"></div>
                  </div>
                  <span class="tp-text">{{ taskProgressText(t) }}</span>
                </div>
                <div class="task-meta">
                  <span>⏰ 截止 {{ t.deadline }}</span>
                  <span class="rewards">
                    💰 ¥{{ t.rewardCash }} · ✨ {{ t.rewardXp }} XP
                  </span>
                </div>
              </div>
              <div class="task-action">
                <el-button
                  :type="t.status === 2 ? 'success' : 'primary'"
                  size="small"
                  :disabled="t.status === 2"
                  @click="handleSubmit(t)"
                >
                  {{ t.status === 2 ? '✓ 已完成' : '提交成果' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📦 推广素材库</div>
            <span class="muted">{{ materials.length }} 件可用</span>
          </div>
          <div class="material-grid">
            <div v-for="m in materials" :key="m.id" class="material-card">
              <div class="mat-cover" :class="'mat-' + m.tag">
                <span class="mat-emoji">{{ matEmoji(m.tag) }}</span>
              </div>
              <div class="mat-body">
                <div class="mat-title">{{ m.title }}</div>
                <div class="mat-meta">
                  <el-tag size="small" effect="plain">{{ m.tag }}</el-tag>
                  <span class="mat-size">{{ m.size }}</span>
                </div>
                <div class="mat-footer">
                  <span class="mat-dl">⬇ {{ m.downloads }} 次下载</span>
                  <el-button link type="primary" size="small">下载</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 推广数据看板 -->
      <div class="dash-section">
        <div class="dash-header">
          <div class="dash-title">
            <span class="dh-icon">📊</span>
            推广数据看板
            <el-tag effect="plain" type="success" size="small">实时</el-tag>
          </div>
          <div class="dash-range">
            <el-radio-group v-model="trendRange" size="small">
              <el-radio-button label="7d">近 7 日</el-radio-button>
              <el-radio-button label="14d">近 14 日</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- KPI 4 卡 -->
        <div class="dash-kpi">
          <div class="dkpi">
            <div class="dkpi-label">推广曝光</div>
            <div class="dkpi-value">{{ trendTotal.reach.toLocaleString() }}</div>
            <div class="dkpi-trend up">▲ {{ trendCompare.reach }}% 较上期</div>
          </div>
          <div class="dkpi">
            <div class="dkpi-label">互动量</div>
            <div class="dkpi-value">{{ trendTotal.interactions.toLocaleString() }}</div>
            <div class="dkpi-trend up">▲ {{ trendCompare.interactions }}% 较上期</div>
          </div>
          <div class="dkpi">
            <div class="dkpi-label">邀请玩家</div>
            <div class="dkpi-value">{{ trendTotal.invites }}</div>
            <div class="dkpi-trend up">▲ {{ trendCompare.invites }}% 较上期</div>
          </div>
          <div class="dkpi">
            <div class="dkpi-label">转化订单</div>
            <div class="dkpi-value">{{ trendTotal.orders }}</div>
            <div class="dkpi-trend down">▼ {{ trendCompare.orders }}% 较上期</div>
          </div>
        </div>

        <!-- 趋势 + 平台分布 -->
        <div class="dash-row">
          <div class="panel chart-panel">
            <div class="panel-header">
              <div class="panel-title">📈 推广效果趋势</div>
              <div class="legend-inline">
                <span class="li-dot" style="background:#ff6b00"></span>曝光
                <span class="li-dot" style="background:#8b5cf6"></span>互动
                <span class="li-dot" style="background:#00d4ff"></span>邀请
                <span class="li-dot" style="background:#67c23a"></span>奖励
              </div>
            </div>
            <v-chart class="chart" :option="trendOption" autoresize />
          </div>
          <div class="panel chart-panel">
            <div class="panel-header">
              <div class="panel-title">🥧 平台分布</div>
              <span class="muted">累计曝光</span>
            </div>
            <v-chart class="chart" :option="platformOption" autoresize />
          </div>
        </div>

        <!-- 内容 TOP + 奖励时序 -->
        <div class="dash-row">
          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">🏅 内容 TOP 排行</div>
              <span class="muted">按曝光量</span>
            </div>
            <div class="top-list">
              <div v-for="c in contentTop" :key="c.rank" class="top-item" :class="'rank-' + c.rank">
                <div class="top-no">{{ c.rank }}</div>
                <div class="top-body">
                  <div class="top-title">
                    <span class="top-name">{{ c.title }}</span>
                    <el-tag size="small" effect="plain" type="warning" v-if="c.type === 'video'">视频</el-tag>
                    <el-tag size="small" effect="plain" type="primary" v-else-if="c.type === 'image'">图文</el-tag>
                    <el-tag size="small" effect="plain" type="info" v-else>素材</el-tag>
                    <span class="top-platform">· {{ c.platform }}</span>
                  </div>
                  <div class="top-metrics">
                    <span>👁 {{ c.reach.toLocaleString() }}</span>
                    <span>❤ {{ c.likes }}</span>
                    <span class="top-rate">互动率 {{ c.ratio }}%</span>
                  </div>
                </div>
                <div class="top-bar">
                  <div class="tb-fill" :style="{ width: topBarWidth(c) + '%' }"></div>
                </div>
              </div>
              <el-empty v-if="!contentTop.length" description="暂无内容数据" :image-size="60" />
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">💎 奖励明细时序</div>
              <span class="muted">点击日期查看当日明细</span>
            </div>
            <div class="reward-timeline">
              <div
                v-for="(d, idx) in rewardTimeline"
                :key="d.date"
                class="rt-item"
                :class="{ active: activeRewardDate === d.date }"
                @click="activeRewardDate = d.date"
              >
                <div class="rt-date">{{ d.date }}</div>
                <div class="rt-bar-wrap">
                  <div
                    class="rt-bar"
                    :style="{ height: rtBarHeight(d.amount) + 'px' }"
                  ></div>
                </div>
                <div class="rt-amount">¥{{ d.amount }}</div>
                <div class="rt-source">{{ d.source }}</div>
                <div class="rt-status" :class="'st-' + d.status">
                  {{ statusText('reward', d.status) }}
                </div>
              </div>
            </div>
            <el-empty v-if="!rewardTimeline.length" description="暂无奖励" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 推广记录 + 奖励 -->
      <div class="promo-row two">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📊 我的推广记录</div>
            <span class="muted">{{ promotions.length }} 条</span>
          </div>
          <el-table :data="promotions" border stripe size="small" max-height="320">
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <span class="type-chip" :class="'type-' + row.type">{{ typeText(row.type) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="platform" label="平台" width="100">
              <template #default="{ row }">{{ row.platform || '—' }}</template>
            </el-table-column>
            <el-table-column prop="reach" label="曝光" width="100">
              <template #default="{ row }">{{ row.reach ? row.reach.toLocaleString() : '—' }}</template>
            </el-table-column>
            <el-table-column prop="likes" label="点赞" width="80" />
            <el-table-column label="奖励" width="100">
              <template #default="{ row }">
                <span v-if="row.reward" class="reward-cash">¥{{ row.reward }}</span>
                <span v-else class="reward-none">—</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="promotionTagType(row.status)" size="small">
                  {{ statusText('promotion', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submittedAt" label="提交时间" min-width="150" />
          </el-table>
        </div>

        <div class="panel reward-panel">
          <div class="panel-header">
            <div class="panel-title">💰 奖励记录</div>
            <span class="muted">待发放 ¥{{ pendingReward }}</span>
          </div>
          <div class="reward-summary">
            <div class="rs-block">
              <span class="rs-label">累计获得</span>
              <span class="rs-value">¥{{ totalReward }}</span>
            </div>
            <div class="rs-block">
              <span class="rs-label">已发放</span>
              <span class="rs-value success">¥{{ paidReward }}</span>
            </div>
            <div class="rs-block">
              <span class="rs-label">待发放</span>
              <span class="rs-value warn">¥{{ pendingReward }}</span>
            </div>
          </div>
          <el-table :data="rewards" border stripe size="small" max-height="280">
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'cash' ? 'warning' : 'primary'" size="small" effect="plain">
                  {{ row.type === 'cash' ? '现金' : 'XP' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                {{ row.type === 'cash' ? '¥' : '' }}{{ row.amount }}{{ row.type === 'xp' ? ' XP' : '' }}
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" min-width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="rewardTagType(row.status)" size="small">
                  {{ statusText('reward', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="140" />
          </el-table>
        </div>
      </div>
    </template>

    <el-empty v-else description="未找到该商户" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  mockFranchisees,
  mockPromotionTasks,
  mockPromotionMaterials,
  mockPromotions,
  mockPromotionCodes,
  mockPromotionTrend,
  mockPlatformMix,
  mockContentTop,
  mockRewards,
  getStatusText
} from '@/api/mock'

const router = useRouter()

const merchant = computed(() => {
  return mockFranchisees.find(f => f.status === 1) // 当前加盟商
})

const currentMerchant = computed(() => ({
  ...merchant.value,
  level: 12
}))

const code = computed(() => mockPromotionCodes.find(c => c.franchiseeId === merchant.value?.id))

const tasks = computed(() => mockPromotionTasks)
const pendingTasks = computed(() => tasks.value.filter(t => t.status !== 2))
const materials = computed(() => mockPromotionMaterials)
const promotions = computed(() => mockPromotions.filter(p => p.franchiseeId === merchant.value?.id))
const rewards = computed(() => mockRewards.filter(r => r.franchiseeId === merchant.value?.id))

const stats = computed(() => {
  const myRewards = rewards.value
  const monthReward = myRewards
    .filter(r => r.createdAt.startsWith('2026-09') && r.type === 'cash')
    .reduce((s, r) => s + r.amount, 0)
  const monthXp = myRewards
    .filter(r => r.createdAt.startsWith('2026-09') && r.type === 'xp')
    .reduce((s, r) => s + r.amount, 0)
  const totalReach = promotions.value.reduce((s, p) => s + (p.reach || 0), 0)
  return {
    monthReward,
    monthXp,
    totalReach,
    taskDone: tasks.value.filter(t => t.status === 2).length,
    taskTotal: tasks.value.length
  }
})

const totalReward = computed(() => rewards.value.filter(r => r.type === 'cash').reduce((s, r) => s + r.amount, 0))
const paidReward = computed(() => rewards.value.filter(r => r.type === 'cash' && r.status === 2).reduce((s, r) => s + r.amount, 0))
const pendingReward = computed(() => rewards.value.filter(r => r.type === 'cash' && r.status !== 2).reduce((s, r) => s + r.amount, 0))

const statusText = (type, status) => getStatusText(type, status)

const taskIcon = (type) => {
  const map = { video: '🎬', invite: '👥', content: '📦', live: '📡' }
  return map[type] || '📌'
}

const taskTagType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success' }
  return map[status] || 'info'
}

const promotionTagType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

const rewardTagType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success' }
  return map[status] || 'info'
}

const typeText = (type) => {
  const map = { video: '短视频', invite: '邀请', content: '素材', live: '直播' }
  return map[type] || '其它'
}

const matEmoji = (tag) => {
  const map = { '海报': '🖼', '视频': '🎬', '文案': '📝', '设计': '🎨' }
  return map[tag] || '📦'
}

// 进度计算（mock）
const taskProgress = (t) => {
  if (t.status === 2) return 100
  if (t.status === 1) return 60
  // 0：根据截止日期
  const today = new Date('2026-09-07')
  const deadline = new Date(t.deadline)
  const total = (deadline - new Date('2026-09-01')) / (1000 * 60 * 60 * 24)
  const passed = (today - new Date('2026-09-01')) / (1000 * 60 * 60 * 24)
  return Math.min(95, Math.max(0, Math.round((passed / total) * 80)))
}

const taskProgressText = (t) => {
  if (t.status === 2) return '已完成'
  if (t.status === 1) return '审核中'
  return `进行中 · ${t.target} 次`
}

// ===== 数据看板逻辑 =====
const trendRange = ref('7d')
const activeRewardDate = ref(null)

// 当前加盟商的趋势数据
const trendList = computed(() => {
  if (!merchant.value) return []
  return mockPromotionTrend[merchant.value.id] || []
})

// KPI 合计
const trendTotal = computed(() => {
  return trendList.value.reduce(
    (s, d) => ({
      reach: s.reach + (d.reach || 0),
      interactions: s.interactions + (d.interactions || 0),
      invites: s.invites + (d.invites || 0),
      orders: s.orders + (d.orders || 0)
    }),
    { reach: 0, interactions: 0, invites: 0, orders: 0 }
  )
})

// 与"上期"对比（mock：用 trendTotal * (0.7~0.95) 模拟）
const trendCompare = computed(() => {
  const factor = 0.7 + Math.random() * 0.25
  return {
    reach: Math.round((1 - factor) * 100),
    interactions: Math.round((1 - factor) * 100),
    invites: Math.round((1 - factor) * 100),
    orders: Math.round((1 - factor * 1.1) * 100)
  }
})

// 趋势图
const trendOption = computed(() => {
  const labels = trendList.value.map(d => d.date)
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 17, 23, 0.95)',
      borderColor: '#ff6b00',
      textStyle: { color: '#fff' }
    },
    legend: { show: false },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: '#9ca3af' }
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#9ca3af' }
      },
      {
        type: 'value',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#67c23a' }
      }
    ],
    series: [
      {
        name: '曝光', type: 'line', smooth: 0.4, symbol: 'circle', symbolSize: 6, showSymbol: false,
        lineStyle: { width: 3, color: '#ff6b00' },
        itemStyle: { color: '#ff6b00' },
        data: trendList.value.map(d => d.reach),
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(255,107,0,0.3)' }, { offset: 1, color: 'rgba(255,107,0,0.02)' }]
          }
        }
      },
      {
        name: '互动', type: 'line', smooth: 0.4, symbol: 'circle', symbolSize: 6, showSymbol: false,
        lineStyle: { width: 2, color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6' },
        data: trendList.value.map(d => d.interactions)
      },
      {
        name: '邀请', type: 'bar', barWidth: 10,
        itemStyle: { color: 'rgba(0, 212, 255, 0.6)', borderRadius: [4, 4, 0, 0] },
        data: trendList.value.map(d => d.invites)
      },
      {
        name: '奖励', type: 'line', yAxisIndex: 1, smooth: 0.4, symbol: 'diamond', symbolSize: 8, showSymbol: true,
        lineStyle: { width: 2, color: '#67c23a', type: 'dashed' },
        itemStyle: { color: '#67c23a' },
        data: trendList.value.map(d => d.reward)
      }
    ]
  }
})

// 平台分布
const platformOption = computed(() => {
  const data = merchant.value ? (mockPlatformMix[merchant.value.id] || []) : []
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(13, 17, 23, 0.95)',
      borderColor: '#8b5cf6',
      textStyle: { color: '#fff' },
      formatter: p => `<div style="font-weight:700">${p.name}</div>${p.value.toLocaleString()} (${p.percent}%)`
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      textStyle: { color: '#9ca3af' }
    },
    color: ['#ff6b00', '#8b5cf6', '#00d4ff', '#67c23a', '#f59e0b', '#ec4899'],
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#0a0a0f', borderWidth: 2 },
        label: { show: true, color: '#d1d5db', formatter: '{b}\n{d}%', fontSize: 11 },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        data
      }
    ]
  }
})

// 内容 TOP
const contentTop = computed(() => {
  if (!merchant.value) return []
  return mockContentTop[merchant.value.id] || []
})

const topBarWidth = (c) => {
  const max = contentTop.value[0]?.reach || 1
  return Math.min(100, Math.round((c.reach / max) * 100))
}

// 奖励时序（按日期降序）
const rewardTimeline = computed(() => {
  if (!merchant.value) return []
  const list = rewards.value
    .filter(r => r.type === 'cash')
    .map(r => {
      // 把 createdAt 'YYYY-MM-DD HH:mm:ss' 切成 MM-DD
      const date = r.createdAt.slice(5, 10)
      return {
        date,
        amount: r.amount,
        source: r.source,
        status: r.status,
        fullDate: r.createdAt
      }
    })
    .sort((a, b) => b.fullDate.localeCompare(a.fullDate))
  // 默认选中最后一天
  if (list.length && !activeRewardDate.value) {
    activeRewardDate.value = list[0].date
  }
  return list
})

const rtBarHeight = (amount) => {
  const max = Math.max(...rewardTimeline.value.map(r => r.amount), 1)
  return Math.max(20, Math.round((amount / max) * 96))
}

const handleSubmit = (t) => {
  ElMessageBox.confirm(
    `确认提交「${t.title}」的成果？提交后将进入审核流程`,
    '提交推广成果',
    { confirmButtonText: '确认提交', cancelButtonText: '再等等' }
  ).then(() => {
    ElMessage.success('已提交，等待总部审核')
  }).catch(() => {})
}

const copyLink = () => {
  if (code.value) {
    navigator.clipboard?.writeText(code.value.link).then(() => {
      ElMessage.success('推广链接已复制')
    })
  }
}

const downloadQr = () => {
  ElMessage.success('二维码已发送到绑定邮箱')
}

const goBack = () => {
  router.push('/merchant/center')
}
</script>

<style scoped>
.promotion-center {
  padding: 20px 24px 40px;
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #11131a 100%);
  color: #fff;
}

.back-bar { margin-bottom: 16px; }
.back-bar :deep(.el-button) { color: #9ca3af; font-size: 13px; }
.back-bar :deep(.el-button:hover) { color: #ff6b00; }

/* Hero */
.promo-hero {
  position: relative;
  padding: 28px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 107, 0, 0.18) 0%, transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
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
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  align-items: center;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.title-icon { font-size: 28px; }

.title-row h1 {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #fff 0%, #ffb380 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-sub {
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 20px;
}

.hero-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.hs {
  display: flex;
  flex-direction: column;
}

.hs-value {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
}

.hs-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 推广码卡片 */
.code-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 107, 0, 0.35);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.15);
}

.code-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.code-value {
  font-size: 24px;
  font-weight: 800;
  color: #ff6b00;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.code-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 14px;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.code-actions :deep(.el-button) {
  flex: 1;
  background: linear-gradient(135deg, #ff6b00, #ff8c00) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 700;
}

.code-actions :deep(.el-button:nth-child(2)) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #d1d5db !important;
}

/* 通用面板 */
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

/* 行容器 */
.promo-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.promo-row.two { grid-template-columns: 1fr 1fr; }
.promo-row > .panel { min-width: 0; }

/* 任务列表 */
.task-list { display: flex; flex-direction: column; gap: 14px; }

.task-card {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  align-items: center;
  transition: all 0.2s;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 107, 0, 0.3);
}

.task-card.status-2 {
  background: rgba(103, 194, 58, 0.05);
  border-color: rgba(103, 194, 58, 0.25);
}

.task-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(255, 107, 0, 0.3);
}

.task-card.status-2 .task-icon {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(16, 185, 129, 0.2));
  border-color: rgba(103, 194, 58, 0.3);
}

.task-body { min-width: 0; }

.task-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.task-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.task-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.tp-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.tp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ffcc00);
  border-radius: 3px;
  transition: width 0.6s;
  box-shadow: 0 0 8px rgba(255, 107, 0, 0.5);
}

.tp-text {
  font-size: 11px;
  color: #9ca3af;
  min-width: 80px;
  text-align: right;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}

.rewards { color: #ff6b00; font-weight: 700; }

/* 素材 */
.material-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.material-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.material-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 107, 0, 0.4);
}

.mat-cover {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mat-海报 { background: linear-gradient(135deg, rgba(255, 107, 0, 0.3), rgba(255, 107, 0, 0.1)); }
.mat-视频 { background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1)); }
.mat-文案 { background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 212, 255, 0.1)); }
.mat-设计 { background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(236, 72, 153, 0.1)); }

.mat-emoji { font-size: 36px; }

.mat-body { padding: 10px 12px; }

.mat-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.mat-size { font-size: 11px; color: #9ca3af; }

.mat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mat-dl { font-size: 11px; color: #9ca3af; }

/* 表格深色 */
.panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.02);
  --el-table-header-bg-color: rgba(255, 107, 0, 0.12);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: #d1d5db;
  --el-table-header-text-color: #fff;
  --el-table-row-hover-bg-color: rgba(255, 107, 0, 0.08);
}

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

.reward-cash { color: #ff6b00; font-weight: 800; }
.reward-none { color: #6b7280; }

/* 奖励面板 */
.reward-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.rs-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.rs-label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.rs-value {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
}

.rs-value.success { color: #67c23a; }
.rs-value.warn { color: #fbbf24; }

/* 响应式 */
@media (max-width: 1024px) {
  .promo-row, .promo-row.two { grid-template-columns: 1fr; }
  .hero-inner { grid-template-columns: 1fr; }
}

/* ============ 推广数据看板 ============ */
.dash-section {
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.dash-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.dh-icon { font-size: 22px; }

/* KPI */
.dash-kpi {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.dkpi {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px 18px;
  overflow: hidden;
}

.dkpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #ff6b00, transparent);
}

.dkpi-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.dkpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.dkpi-trend {
  font-size: 11px;
  font-weight: 700;
}

.dkpi-trend.up { color: #67c23a; }
.dkpi-trend.down { color: #ef4444; }

/* 图表行 */
.dash-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 18px;
}
.dash-row > .panel { min-width: 0; }
.dash-row:last-child { grid-template-columns: 1fr 1fr; margin-bottom: 0; }

.legend-inline {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: #9ca3af;
}

.li-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.chart-panel .chart {
  width: 100%;
  min-height: 260px;
}

/* 内容 TOP */
.top-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-item {
  display: grid;
  grid-template-columns: 40px 1fr 120px;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.top-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.top-item.rank-1 { border-color: rgba(255, 215, 0, 0.4); background: rgba(255, 215, 0, 0.05); }
.top-item.rank-2 { border-color: rgba(192, 192, 192, 0.3); }
.top-item.rank-3 { border-color: rgba(205, 127, 50, 0.3); }

.top-no {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #9ca3af;
}

.top-item.rank-1 .top-no { background: linear-gradient(135deg, #ffd700, #ffb800); color: #0a0a0f; box-shadow: 0 0 12px rgba(255, 215, 0, 0.5); }
.top-item.rank-2 .top-no { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #0a0a0f; }
.top-item.rank-3 .top-no { background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; }

.top-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.top-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-platform {
  font-size: 11px;
  color: #9ca3af;
}

.top-metrics {
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: #9ca3af;
}

.top-rate {
  color: #67c23a;
  font-weight: 700;
}

.top-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.tb-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ffcc00);
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(255, 107, 0, 0.5);
  transition: width 0.6s;
}

/* 奖励时序 */
.reward-timeline {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 16px 0;
  min-height: 280px;
  overflow-x: auto;
}

.rt-item {
  flex: 1;
  min-width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.rt-item:hover, .rt-item.active {
  background: rgba(255, 107, 0, 0.1);
  border-color: rgba(255, 107, 0, 0.4);
  transform: translateY(-4px);
}

.rt-date {
  font-size: 12px;
  font-weight: 700;
  color: #d1d5db;
  font-family: 'Courier New', monospace;
}

.rt-bar-wrap {
  height: 96px;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.rt-bar {
  width: 60%;
  background: linear-gradient(180deg, #ff6b00, rgba(255, 107, 0, 0.2));
  border-radius: 6px 6px 0 0;
  box-shadow: 0 0 12px rgba(255, 107, 0, 0.5);
  transition: height 0.6s;
  min-height: 8px;
}

.rt-item.active .rt-bar {
  background: linear-gradient(180deg, #ffcc00, rgba(255, 204, 0, 0.2));
  box-shadow: 0 0 16px rgba(255, 204, 0, 0.6);
}

.rt-amount {
  font-size: 16px;
  font-weight: 800;
  color: #ff6b00;
}

.rt-source {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.rt-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.rt-status.st-0 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.rt-status.st-1 { background: rgba(64, 158, 255, 0.2); color: #60a5fa; }
.rt-status.st-2 { background: rgba(103, 194, 58, 0.2); color: #67c23a; }

/* 响应式 */
@media (max-width: 1024px) {
  .dash-kpi { grid-template-columns: repeat(2, 1fr); }
  .dash-row, .dash-row:last-child { grid-template-columns: 1fr; }
}
</style>