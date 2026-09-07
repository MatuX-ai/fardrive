<template>
  <div class="merchant-center">
    <!-- 订单弹幕层 -->
    <div class="danmaku-layer">
      <transition-group name="danmaku-fly">
        <div
          v-for="d in danmakuList"
          :key="d.id"
          class="danmaku"
          :class="['type-' + d.type, 'lane-' + d.lane]"
          :style="{ top: d.top + 'px', animationDuration: d.duration + 's' }"
          @click="onDanmakuClick(d)"
        >
          <span class="danmaku-icon">{{ d.icon }}</span>
          <span class="danmaku-text">{{ d.text }}</span>
          <span class="danmaku-go">查看 ›</span>
        </div>
      </transition-group>
    </div>

    <!-- 顶部沉浸式头图 -->
    <div class="hero-banner">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="merchant-profile">
          <div class="avatar-ring">
            <div class="avatar">野</div>
            <div class="level-badge">Lv.{{ currentMerchant.level }}</div>
          </div>
          <div class="profile-info">
            <h1 class="merchant-name">{{ currentMerchant.companyName }}</h1>
            <p class="merchant-title">{{ currentMerchant.title }} · {{ currentMerchant.siteName }}</p>
            <div class="exp-bar">
              <div class="exp-track">
                <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
              </div>
              <span class="exp-text">{{ currentMerchant.exp }} / {{ currentMerchant.maxExp }} XP</span>
            </div>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ currentMerchant.rank }}</div>
            <div class="stat-label">全国排名</div>
          </div>
          <div class="hero-stat">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ currentMerchant.rating }}</div>
            <div class="stat-label">场地评分</div>
          </div>
          <div class="hero-stat">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">{{ currentMerchant.heat }}</div>
            <div class="stat-label">今日热度</div>
          </div>
          <div class="hero-stat hero-action" @click="router.push('/merchant/promotion')">
            <div class="stat-icon">📣</div>
            <div class="stat-value action-text">推广中心 →</div>
            <div class="stat-label">完成任务领奖励</div>
          </div>
        </div>
      </div>
    </div>

    <div class="center-body">
      <!-- 核心金币卡片区 -->
      <div class="coin-cards">
        <div class="coin-card income">
          <div class="coin-bg"></div>
          <div class="coin-icon">💰</div>
          <div class="coin-value">¥{{ todayStats.revenue.toLocaleString() }}</div>
          <div class="coin-label">今日营收</div>
          <div class="coin-trend up">+{{ todayStats.revenueTrend }}% 环比昨日</div>
        </div>
        <div class="coin-card orders">
          <div class="coin-bg"></div>
          <div class="coin-icon">📦</div>
          <div class="coin-value">{{ todayStats.orders }}</div>
          <div class="coin-label">今日订单</div>
          <div class="coin-trend up">+{{ todayStats.orderTrend }}% 环比昨日</div>
        </div>
        <div class="coin-card share">
          <div class="coin-bg"></div>
          <div class="coin-icon">🎯</div>
          <div class="coin-value">¥{{ todayStats.myShare.toLocaleString() }}</div>
          <div class="coin-label">我的分成</div>
          <div class="coin-trend up">分成率 {{ (currentMerchant.settleRatio * 100).toFixed(0) }}%</div>
        </div>
        <div class="coin-card online">
          <div class="coin-bg"></div>
          <div class="coin-icon">🚗</div>
          <div class="coin-value">{{ todayStats.onlineRate }}%</div>
          <div class="coin-label">车辆在线率</div>
          <div class="coin-trend" :class="todayStats.onlineRate >= 90 ? 'up' : 'warn'">
            {{ todayStats.onlineRate >= 90 ? '状态优秀' : '需要关注' }}
          </div>
        </div>
      </div>

      <div class="main-grid">
        <!-- 左侧：车队实况 -->
        <div class="panel fleet-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="title-icon">🎮</span>
              车队实况
            </div>
            <el-tag effect="dark" class="live-tag">LIVE</el-tag>
          </div>
          <div class="fleet-grid">
            <div
              v-for="vehicle in fleetVehicles"
              :key="vehicle.id"
              class="vehicle-card"
              :class="'status-' + vehicle.status"
            >
              <div class="vehicle-glow"></div>
              <div class="vehicle-header">
                <div class="vehicle-sn">{{ vehicle.sn }}</div>
                <div class="status-light" :class="'light-' + vehicle.status"></div>
              </div>
              <div class="vehicle-model">{{ vehicle.model }}</div>
              <div class="vehicle-gear">{{ vehicle.gearLevel }}</div>
              <div class="vehicle-metrics">
                <div class="metric">
                  <span class="metric-value">{{ vehicle.totalMileage }}</span>
                  <span class="metric-unit">km</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{{ vehicle.orderCount }}</span>
                  <span class="metric-unit">单</span>
                </div>
              </div>
              <div class="vehicle-footer">
                <span class="status-text">{{ getStatusText('vehicle', vehicle.status) }}</span>
                <span class="signal-badge" :class="'signal-' + vehicle.signalLevel">{{ vehicle.signalLevel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：任务与成就 -->
        <div class="side-stack">
          <div class="panel quest-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="title-icon">⚡</span>
                今日待办
              </div>
              <span class="quest-count">{{ pendingQuests.length }}</span>
            </div>
            <div class="quest-list">
              <div
                v-for="quest in pendingQuests"
                :key="quest.id"
                class="quest-item"
                :class="'urgency-' + quest.urgency"
              >
                <div class="quest-icon">{{ quest.icon }}</div>
                <div class="quest-body">
                  <div class="quest-name">{{ quest.name }}</div>
                  <div class="quest-desc">{{ quest.desc }}</div>
                </div>
                <div class="quest-reward">+{{ quest.reward }}XP</div>
              </div>
            </div>
          </div>

          <div class="panel badge-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="title-icon">🏅</span>
                成就勋章
              </div>
            </div>
            <div class="badge-grid">
              <div
                v-for="badge in badges"
                :key="badge.id"
                class="badge-item"
                :class="{ unlocked: badge.unlocked }"
              >
                <div class="badge-icon">{{ badge.icon }}</div>
                <div class="badge-name">{{ badge.name }}</div>
                <div class="badge-progress" v-if="!badge.unlocked">
                  <div class="badge-track">
                    <div class="badge-fill" :style="{ width: badge.progress + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部数据区 -->
      <div class="bottom-grid">
        <div class="panel chart-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="title-icon">📈</span>
              今日营收冲锋
            </div>
          </div>
          <v-chart class="chart" :option="revenueChartOption" autoresize />
        </div>
        <div class="panel chart-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="title-icon">🎯</span>
              场地竞争力
            </div>
          </div>
          <v-chart class="chart" :option="radarChartOption" autoresize />
        </div>
        <div class="panel ranking-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="title-icon">🏆</span>
              同城战力榜
              <span class="live-dot"></span>
            </div>
            <span class="ranking-meta">实时更新</span>
          </div>
          <div class="rank-list" ref="rankListRef">
            <transition-group name="rank-flip">
              <div
                v-for="(item, index) in cityRanking"
                :key="item.id"
                class="rank-item"
                :class="{
                  me: item.isMe,
                  climbing: item.trend === 'up',
                  falling: item.trend === 'down'
                }"
                @click="goToMerchant(item.franchiseeId)"
              >
                <div class="rank-no" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                <div class="rank-trend" v-if="item.trend === 'up'">▲</div>
                <div class="rank-trend down" v-else-if="item.trend === 'down'">▼</div>
                <div class="rank-trend hold" v-else>—</div>
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-score-wrap">
                  <div class="rank-score">{{ item.score.toLocaleString() }}</div>
                  <div class="rank-delta" v-if="item.delta">+{{ item.delta }}</div>
                </div>
                <div class="rank-arrow">›</div>
              </div>
            </transition-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  mockFranchisees,
  mockVehicles,
  mockSites,
  mockOrders,
  mockBatteries,
  getStatusText,
  findSite
} from '@/api/mock'

// 当前商户：取第一个正常状态的加盟商作为演示
const currentMerchant = {
  ...mockFranchisees.find(f => f.status === 1),
  level: 12,
  exp: 3850,
  maxExp: 5000,
  title: '荒野主理人',
  siteName: findSite(mockFranchisees.find(f => f.status === 1)?.id)?.name || '主场地',
  rank: 23,
  rating: 4.8,
  heat: 1286
}

const expPercent = computed(() =>
  Math.min(100, Math.round((currentMerchant.exp / currentMerchant.maxExp) * 100))
)

// 今日统计（演示数据）
const todayStats = {
  revenue: mockOrders
    .filter(o => o.franchiseeId === currentMerchant.id)
    .reduce((sum, o) => sum + o.amount, 0),
  revenueTrend: 18,
  orders: mockOrders.filter(o => o.franchiseeId === currentMerchant.id).length,
  orderTrend: 25,
  myShare: mockOrders
    .filter(o => o.franchiseeId === currentMerchant.id)
    .reduce((sum, o) => sum + o.franchiseeAmount, 0),
  onlineRate: 82
}

// 车队数据（取当前加盟商的车辆，状态映射为更丰富的展示）
const fleetVehicles = computed(() => {
  return mockVehicles.filter(v => v.franchiseeId === currentMerchant.id).map(v => ({
    ...v,
    signalLevel: v.signalLevel || 'A'
  }))
})

// 待办任务
const pendingQuests = [
  {
    id: 1,
    name: '救援响应',
    desc: 'FD20260002 翻车待处理',
    icon: '🚨',
    urgency: 'high',
    reward: 120
  },
  {
    id: 2,
    name: '电池更换',
    desc: 'BAT20260003 SOH 已低于 80%',
    icon: '🔋',
    urgency: 'medium',
    reward: 80
  },
  {
    id: 3,
    name: '每日巡检',
    desc: '完成今日场地巡检打卡',
    icon: '📋',
    urgency: 'low',
    reward: 60
  },
  {
    id: 4,
    name: '发布高光视频',
    desc: '今日有 3 条高光素材可发布',
    icon: '🎬',
    urgency: 'low',
    reward: 100
  }
]

// 成就勋章
const badges = [
  { id: 1, name: '百单王者', icon: '👑', unlocked: true, progress: 100 },
  { id: 2, name: 'S级信号', icon: '📡', unlocked: true, progress: 100 },
  { id: 3, name: '五星好评', icon: '⭐', unlocked: false, progress: 86 },
  { id: 4, name: '千公里续航', icon: '🛞', unlocked: false, progress: 64 },
  { id: 5, name: '内容达人', icon: '🎥', unlocked: false, progress: 45 },
  { id: 6, name: '赛事承办', icon: '🏁', unlocked: false, progress: 20 }
]

// 同城排行榜（响应式，模拟实时分数变化）
import { useRouter } from 'vue-router'

const router = useRouter()

// 推广快捷入口
const goPromotion = () => router.push('/merchant/promotion')

const cityRanking = ref([
  { id: 1, franchiseeId: 1, name: '北京昌平越野基地', score: 9850, isMe: true, trend: 'hold', delta: 0 },
  { id: 2, franchiseeId: 1, name: '密云森林穿越场', score: 8720, isMe: false, trend: 'up', delta: 120 },
  { id: 3, franchiseeId: 3, name: '怀柔沙地漂移场', score: 8340, isMe: false, trend: 'down', delta: 60 },
  { id: 4, franchiseeId: 3, name: '房山岩石攀爬园', score: 7650, isMe: false, trend: 'up', delta: 80 },
  { id: 5, franchiseeId: 1, name: '延庆草原驿站', score: 6920, isMe: false, trend: 'hold', delta: 0 },
  { id: 6, franchiseeId: 3, name: '门头沟山脊穿越', score: 6540, isMe: false, trend: 'down', delta: 40 },
  { id: 7, franchiseeId: 1, name: '顺义湿地拉力场', score: 5980, isMe: false, trend: 'up', delta: 95 }
])

const goToMerchant = (id) => {
  router.push(`/franchisee/detail/${id}`)
}
let danmakuTimer = null
let rankingTimer = null
let danmakuId = 0

const customerNames = ['北京小飞侠', '内蒙古老炮儿', '上海节奏控', '广州越野哥', '杭州阿汤哥', '成都胖墩', '深圳小钢炮', '武汉辣妹子', '西安铁骑', '南京追风', '长沙飞毛腿', '厦门浪人', '青岛老船长', '苏州风景党', '重庆山城车神', '天津卫老顽童', '昆明彩云客', '拉萨高原鹰', '海口椰风骑', '沈阳东北虎']
const vehicleShort = ['212', '切诺基', '岩石攀爬', '沙漠卡丁', '大脚怪', '牧马人', '吉姆尼', '猛禽', '坦克300', '卫士', '牧马人卢比肯', 'FJ酷路泽']
const danmakuTemplates = [
  { factory: () => ({ icon: '🎉', text: '新订单驾到！', type: 'order' }), forOther: false },
  { factory: () => ({ icon: '🔥', text: '高光时刻已生成，点击查看', type: 'highlight' }), forOther: false },
  { factory: () => ({ icon: '⭐', text: '5 星好评又来了', type: 'review' }), forOther: true },
  { factory: () => ({ icon: '🏁', text: '赛事报名即将截止', type: 'event' }), forOther: true },
  { factory: () => ({ icon: '🚀', text: '订单量创新高！', type: 'milestone' }), forOther: true },
  { factory: () => ({ icon: '💎', text: '钻石玩家来挑战', type: 'vip' }), forOther: true },
  { factory: () => ({ icon: '🔋', text: '电量告急，请换电', type: 'warning' }), forOther: true },
  { factory: () => ({ icon: '🎯', text: '今日目标达成 80%', type: 'goal' }), forOther: true },
  { factory: () => ({ icon: '📍', text: '新玩家首次进店', type: 'newbie' }), forOther: false },
  { factory: () => ({ icon: '⚡', text: '设备已上线', type: 'device' }), forOther: true }
]
const otherMerchantNames = ['密云森林穿越场', '怀柔沙地漂移场', '房山岩石攀爬园', '延庆草原驿站', '门头沟山脊穿越', '顺义湿地拉力场']

const createDanmaku = () => {
  const tmpl = danmakuTemplates[Math.floor(Math.random() * danmakuTemplates.length)]
  const baseData = tmpl.factory()
  const isOrder = baseData.type === 'order' || baseData.type === 'newbie' || baseData.type === 'highlight'

  // 决定弹幕归属：forOther=true 的 30% 概率是别人家的；owner-only 100% 自己
  const isOther = tmpl.forOther && Math.random() < 0.3
  const targetId = isOther ? 3 : currentMerchant.id
  const targetName = isOther
    ? otherMerchantNames[Math.floor(Math.random() * otherMerchantNames.length)]
    : currentMerchant.siteName

  let text = baseData.text
  if (isOrder) {
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)]
    const car = vehicleShort[Math.floor(Math.random() * vehicleShort.length)]
    const minutes = [15, 30, 45, 60, 90][Math.floor(Math.random() * 5)]
    if (baseData.type === 'order') {
      text = isOther
        ? `${targetName}：${customer} 预约了 ${car} ${minutes} 分钟`
        : `${customer} 预约了 ${car} ${minutes} 分钟`
    } else if (baseData.type === 'newbie') {
      text = isOther
        ? `新玩家 ${customer} 来到 ${targetName}`
        : `新玩家 ${customer} 来到本店，首单 ${minutes} 分钟 ${car}`
    } else if (baseData.type === 'highlight') {
      text = `${customer} 在 ${targetName} 触发"飞坡"高光，+50 XP`
    }
  } else if (isOther) {
    text = `${targetName}：${baseData.text}`
  }

  const id = ++danmakuId
  const lane = Math.floor(Math.random() * 5) // 5 条泳道
  const top = 120 + lane * 56
  const duration = 8 + Math.random() * 4
  danmakuList.value.push({ id, ...baseData, text, top, lane, duration, franchiseeId: targetId })
  // 动画结束后自动移除
  setTimeout(() => {
    danmakuList.value = danmakuList.value.filter(d => d.id !== id)
  }, duration * 1000 + 500)
}

const onDanmakuClick = (d) => {
  // 当前商户的弹幕，1 秒内不重复触发
  if (d._clickLock) return
  d._clickLock = true
  setTimeout(() => { d._clickLock = false }, 1000)
  goToMerchant(d.franchiseeId)
}

const updateRanking = () => {
  const list = cityRanking.value
  // 随机 1-2 个商家涨分，0-1 个跌分
  const upCount = 1 + Math.floor(Math.random() * 2)
  const downCount = Math.floor(Math.random() * 2)
  const indices = [...Array(list.length).keys()].sort(() => Math.random() - 0.5)
  indices.slice(0, upCount).forEach(i => {
    const inc = Math.floor(Math.random() * 120) + 30
    list[i].score += inc
    list[i].trend = 'up'
    list[i].delta = inc
  })
  indices.slice(upCount, upCount + downCount).forEach(i => {
    const dec = Math.floor(Math.random() * 60) + 10
    list[i].score = Math.max(0, list[i].score - dec)
    list[i].trend = 'down'
    list[i].delta = 0
  })
  // 其余归位
  indices.slice(upCount + downCount).forEach(i => {
    list[i].trend = 'hold'
    list[i].delta = 0
  })
  // 重新排序（自己始终保留）
  list.sort((a, b) => {
    if (a.isMe) return -1
    if (b.isMe) return 1
    return b.score - a.score
  })
  // 1.5s 后清除趋势标记
  setTimeout(() => {
    list.forEach(item => {
      item.trend = 'hold'
      item.delta = 0
    })
  }, 1500)
}

onMounted(() => {
  // 初始弹幕：连发 3 条
  createDanmaku()
  setTimeout(createDanmaku, 800)
  setTimeout(createDanmaku, 1600)
  // 弹幕节奏：1.5~3s 一条
  danmakuTimer = setInterval(() => {
    createDanmaku()
  }, 1800)
  // 排行榜：4s 一次刷新
  rankingTimer = setInterval(updateRanking, 4000)
})

onBeforeUnmount(() => {
  if (danmakuTimer) clearInterval(danmakuTimer)
  if (rankingTimer) clearInterval(rankingTimer)
})

// 图表配置
const revenueChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderColor: '#ff6b00',
    textStyle: { color: '#fff' },
    formatter: params => {
      const p = params[0]
      return `<div style="font-weight:700">${p.name}</div>营收 ¥${p.value}`
    }
  },
  grid: { left: '3%', right: '4%', bottom: '5%', top: '12%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
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
      type: 'bar',
      barWidth: '45%',
      data: [120, 280, 450, 320, 580, 420, 390],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#ff6b00' },
            { offset: 1, color: 'rgba(255, 107, 0, 0.2)' }
          ]
        }
      }
    }
  ]
}))

const radarChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderColor: '#8b5cf6',
    textStyle: { color: '#fff' }
  },
  radar: {
    indicator: [
      { name: '信号质量', max: 100 },
      { name: '车辆在线', max: 100 },
      { name: '用户好评', max: 100 },
      { name: '订单密度', max: 100 },
      { name: '内容丰富', max: 100 },
      { name: '响应速度', max: 100 }
    ],
    splitArea: { areaStyle: { color: ['rgba(139,92,246,0.05)', 'rgba(139,92,246,0.1)'] } },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    name: { textStyle: { color: '#9ca3af' } }
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [92, 82, 88, 75, 68, 85],
          name: '本场地',
          areaStyle: { color: 'rgba(139, 92, 246, 0.35)' },
          lineStyle: { color: '#8b5cf6', width: 2 },
          itemStyle: { color: '#8b5cf6' }
        }
      ]
    }
  ]
}))
</script>

<style scoped>
.merchant-center {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #11131a 100%);
  color: #fff;
  padding-bottom: 40px;
}

/* 顶部头图 */
.hero-banner {
  position: relative;
  padding: 32px 28px;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 107, 0, 0.18) 0%, transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.14) 0%, transparent 40%),
    linear-gradient(135deg, rgba(17, 19, 26, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -50%;
  left: -10%;
  width: 120%;
  height: 200%;
  background: radial-gradient(ellipse at center, rgba(255, 107, 0, 0.08) 0%, transparent 60%);
  animation: pulseGlow 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.hero-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.merchant-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-ring {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  padding: 4px;
  background: conic-gradient(from 0deg, #ff6b00, #8b5cf6, #00d4ff, #ff6b00);
  animation: rotateRing 8s linear infinite;
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
  animation: rotateRing 8s linear infinite reverse;
}

.level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ff6b00, #ff8c00);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  border: 2px solid #0a0a0f;
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.merchant-name {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #fff 0%, #ffb380 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.merchant-title {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.exp-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.exp-track {
  width: 220px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ffcc00);
  border-radius: 4px;
  transition: width 1s ease;
  box-shadow: 0 0 12px rgba(255, 107, 0, 0.5);
}

.exp-text {
  font-size: 12px;
  color: #d1d5db;
  font-weight: 600;
}

.hero-stats {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}

.hero-stat {
  text-align: center;
  min-width: 90px;
}

.hero-stat.hero-action {
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.18), rgba(139, 92, 246, 0.18));
  border: 1px solid rgba(255, 107, 0, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 160px;
}

.hero-stat.hero-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.3);
}

.action-text {
  background: linear-gradient(90deg, #ff6b00, #ffcc00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 18px !important;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.hero-stat .stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.hero-stat .stat-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 主体内容 */
.center-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 金币卡片 */
.coin-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.coin-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 22px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(10px);
}

.coin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.coin-card.income { border-color: rgba(255, 107, 0, 0.3); }
.coin-card.orders { border-color: rgba(0, 212, 255, 0.3); }
.coin-card.share { border-color: rgba(139, 92, 246, 0.3); }
.coin-card.online { border-color: rgba(103, 194, 58, 0.3); }

.coin-bg {
  position: absolute;
  top: -30%;
  right: -20%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.15;
  filter: blur(24px);
}

.coin-card.income .coin-bg { background: #ff6b00; }
.coin-card.orders .coin-bg { background: #00d4ff; }
.coin-card.share .coin-bg { background: #8b5cf6; }
.coin-card.online .coin-bg { background: #67c23a; }

.coin-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.coin-value {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.coin-label {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.coin-trend {
  font-size: 12px;
  font-weight: 600;
}

.coin-trend.up { color: #67c23a; }
.coin-trend.warn { color: #f59e0b; }

/* 面板通用 */
.panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

.live-tag {
  background: linear-gradient(135deg, #ef4444, #f97316) !important;
  border: none !important;
  color: #fff !important;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { opacity: 0.85; box-shadow: 0 0 12px rgba(239, 68, 68, 0.6); }
}

.quest-count {
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
}

/* 主网格 */
.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* 车队网格 */
.fleet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.vehicle-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  overflow: hidden;
  transition: all 0.2s;
}

.vehicle-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.vehicle-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0.8;
}

.status-1 .vehicle-glow { background: linear-gradient(90deg, #67c23a, #95d475); }
.status-0 .vehicle-glow { background: linear-gradient(90deg, #10b981, #34d399); }
.status-2 .vehicle-glow { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.status-3 .vehicle-glow { background: linear-gradient(90deg, #ef4444, #f87171); }
.status-4 .vehicle-glow { background: linear-gradient(90deg, #6b7280, #9ca3af); }

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vehicle-sn {
  font-size: 13px;
  font-weight: 700;
  color: #d1d5db;
  font-family: 'Courier New', monospace;
}

.status-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.light-1 { background: #67c23a; box-shadow: 0 0 8px #67c23a; }
.light-0 { background: #10b981; box-shadow: 0 0 8px #10b981; }
.light-2 { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
.light-3 { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
.light-4 { background: #6b7280; }

.vehicle-model {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.vehicle-gear {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 14px;
}

.vehicle-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
}

.metric {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.metric-unit {
  font-size: 12px;
  color: #9ca3af;
}

.vehicle-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  font-size: 12px;
  color: #d1d5db;
  font-weight: 600;
}

.signal-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

.signal-S { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
.signal-A { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.signal-B { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

/* 待办任务 */
.quest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.quest-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.quest-item.urgency-high { border-left-color: #ef4444; }
.quest-item.urgency-medium { border-left-color: #f59e0b; }
.quest-item.urgency-low { border-left-color: #00d4ff; }

.quest-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.quest-body {
  flex: 1;
}

.quest-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}

.quest-desc {
  font-size: 12px;
  color: #9ca3af;
}

.quest-reward {
  font-size: 12px;
  font-weight: 700;
  color: #ff6b00;
  background: rgba(255, 107, 0, 0.12);
  padding: 4px 8px;
  border-radius: 8px;
}

/* 成就勋章 */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  opacity: 0.55;
  transition: all 0.2s;
}

.badge-item.unlocked {
  opacity: 1;
  background: rgba(255, 107, 0, 0.08);
  border: 1px solid rgba(255, 107, 0, 0.25);
  box-shadow: 0 0 16px rgba(255, 107, 0, 0.15);
}

.badge-item:hover {
  transform: translateY(-2px);
}

.badge-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.badge-name {
  font-size: 12px;
  color: #d1d5db;
  font-weight: 600;
  margin-bottom: 8px;
}

.badge-track {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.badge-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ffcc00);
  border-radius: 3px;
}

/* 底部区域 */
.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  gap: 24px;
}

.chart {
  width: 100%;
  min-height: 280px;
}

.ranking-panel .panel-header {
  margin-bottom: 14px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s;
}

.rank-item.me {
  background: rgba(255, 107, 0, 0.12);
  border: 1px solid rgba(255, 107, 0, 0.25);
}

.rank-no {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.08);
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ffb800); color: #0a0a0f; }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #0a0a0f; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; }

.rank-name {
  flex: 1;
  font-size: 13px;
  color: #d1d5db;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-score {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

/* 弹幕层 */
.danmaku-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.danmaku {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(13, 17, 23, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  animation: danmakuFly linear forwards;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.danmaku:hover {
  background: rgba(255, 107, 0, 0.18);
  border-color: rgba(255, 107, 0, 0.5);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.35);
  animation-play-state: paused;
}

.danmaku-icon {
  font-size: 16px;
}

.danmaku-text {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
}

.danmaku-go {
  margin-left: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 800;
  color: #ff6b00;
  background: rgba(255, 107, 0, 0.15);
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.danmaku:hover .danmaku-go {
  opacity: 1;
}

/* 不同类型弹幕色彩 */
.danmaku.type-order { border-color: rgba(255, 107, 0, 0.5); box-shadow: 0 6px 20px rgba(255, 107, 0, 0.25); }
.danmaku.type-highlight { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 6px 20px rgba(239, 68, 68, 0.25); }
.danmaku.type-review { border-color: rgba(245, 158, 11, 0.5); }
.danmaku.type-event { border-color: rgba(0, 212, 255, 0.5); }
.danmaku.type-milestone { border-color: rgba(255, 215, 0, 0.5); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.3); }
.danmaku.type-vip { border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3); }
.danmaku.type-warning { border-color: rgba(245, 158, 11, 0.6); }
.danmaku.type-goal { border-color: rgba(103, 194, 58, 0.5); }
.danmaku.type-newbie { border-color: rgba(0, 212, 255, 0.5); }
.danmaku.type-device { border-color: rgba(16, 185, 129, 0.5); }

@keyframes danmakuFly {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-100vw - 100%)); }
}

/* 弹幕入场 */
.danmaku-fly-enter-from {
  transform: translateX(120%);
  opacity: 0;
}
.danmaku-fly-enter-active {
  transition: transform 0.6s ease-out, opacity 0.6s;
}
.danmaku-fly-leave-to {
  opacity: 0;
}

/* 排行榜实时指示 */
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: livePulse 1.2s ease-in-out infinite;
}

.ranking-meta {
  font-size: 11px;
  color: #9ca3af;
  background: rgba(239, 68, 68, 0.1);
  padding: 3px 8px;
  border-radius: 8px;
}

.rank-item {
  position: relative;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.rank-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  transform: translateX(4px);
}

.rank-item:hover .rank-arrow {
  opacity: 1;
  transform: translateX(0);
}

.rank-arrow {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b00;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s, transform 0.2s;
}

.rank-trend {
  font-size: 11px;
  font-weight: 800;
  color: #67c23a;
  width: 14px;
  text-align: center;
}

.rank-trend.down { color: #ef4444; }
.rank-trend.hold { color: #6b7280; }

.rank-score-wrap {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rank-delta {
  font-size: 10px;
  font-weight: 700;
  color: #67c23a;
  margin-top: 2px;
  animation: deltaFade 1.5s ease-out forwards;
}

@keyframes deltaFade {
  0% { opacity: 0; transform: translateY(4px); }
  20% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-4px); }
}

.rank-item.climbing {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.18), rgba(255, 255, 255, 0.03));
  animation: climbGlow 1.5s ease-out;
}

.rank-item.falling {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(255, 255, 255, 0.03));
  animation: fallGlow 1.5s ease-out;
}

@keyframes climbGlow {
  0% { box-shadow: 0 0 0 rgba(103, 194, 58, 0.6); }
  50% { box-shadow: 0 0 16px rgba(103, 194, 58, 0.6); }
  100% { box-shadow: 0 0 0 rgba(103, 194, 58, 0); }
}

@keyframes fallGlow {
  0% { box-shadow: 0 0 0 rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.5); }
  100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
}

/* 排行翻转动画 */
.rank-flip-move {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.rank-flip-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.rank-flip-enter-active {
  transition: opacity 0.4s, transform 0.4s;
}

.rank-flip-leave-active {
  position: absolute;
  opacity: 0;
  transition: opacity 0.3s;
}

/* 响应式 */
@media (max-width: 1200px) {
  .coin-cards { grid-template-columns: repeat(2, 1fr); }
  .main-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .hero-content { flex-direction: column; align-items: flex-start; }
  .hero-stats { width: 100%; justify-content: space-between; }
  .coin-cards { grid-template-columns: 1fr; }
  .fleet-grid { grid-template-columns: 1fr; }
  .badge-grid { grid-template-columns: repeat(2, 1fr); }
  .danmaku-layer { display: none; }
}
</style>
