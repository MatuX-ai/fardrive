<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">市场数据 · BI 分析</div>
        <div class="page-subtitle">数据更新时间：2026-09-07 18:00</div>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="range" size="small">
          <el-radio-button label="7d">近7日</el-radio-button>
          <el-radio-button label="30d">近30日</el-radio-button>
          <el-radio-button label="90d">近90日</el-radio-button>
        </el-radio-group>
        <el-button :icon="Download" size="small">导出报告</el-button>
      </div>
    </div>

    <!-- 营收概览 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in revenueCards" :key="card.label">
        <el-card class="stat-card">
          <div class="stat-header">
            <div class="stat-label">{{ card.label }}</div>
            <el-icon class="stat-icon" :size="20"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-value" :style="{ color: card.color }">¥{{ card.value.toLocaleString() }}</div>
          <div class="stat-trend">
            <el-icon :size="12"><arrow-up v-if="card.growth > 0" /><arrow-down v-else /></el-icon>
            <span :style="{ color: card.growth > 0 ? '#5F7D5B' : '#c45656' }">{{ Math.abs(card.growth) }}% 环比</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 营收趋势 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>营收趋势 · 平台分成 vs 加盟商收入</span>
              <el-tag type="success" size="small">单位：元</el-tag>
            </div>
          </template>
          <v-chart class="chart-large" :option="revenueTrendOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 地图销量 TOP10 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>地图销量 TOP 10 · 各场地订单情况</span>
          </template>
          <v-chart class="chart-large" :option="siteSalesOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>用户充值次数分布</span>
          </template>
          <v-chart class="chart-large" :option="rechargeFreqOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 车型与价格带 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>车型预订分布</span>
          </template>
          <v-chart class="chart-large" :option="modelDistributionOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>价格带预订分布</span>
          </template>
          <v-chart class="chart-large" :option="priceDistributionOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值金额分布 + 时段热力 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>用户充值金额分布（漏斗）</span>
          </template>
          <v-chart class="chart-large" :option="rechargeAmountOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>预订时段热力图 · 星期 × 时段</span>
          </template>
          <v-chart class="chart-large" :option="hourlyHeatmapOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户新增/复购 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户新增 vs 复购趋势</span>
              <div class="legend-tag">
                <span class="dot" style="background:#12233D;"></span> 新增
                <span class="dot" style="background:#E8A33D; margin-left:12px;"></span> 复购
              </div>
            </div>
          </template>
          <v-chart class="chart-large" :option="userTrendOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import {
  mockRevenueOverview,
  mockSiteSales,
  mockRechargeData,
  mockModelDistribution,
  mockPriceDistribution,
  mockRevenueTrend30,
  mockHourlyHeatmap,
  mockUserTrend30
} from '@/api/mock-market'

const range = ref('30d')

const revenueCards = computed(() => [
  { label: '今日营收', value: mockRevenueOverview.today, growth: mockRevenueOverview.growth.today, color: '#12233D', icon: 'Coin' },
  { label: '本周营收', value: mockRevenueOverview.thisWeek, growth: mockRevenueOverview.growth.week, color: '#1E3A5F', icon: 'Calendar' },
  { label: '本月营收', value: mockRevenueOverview.thisMonth, growth: mockRevenueOverview.growth.month, color: '#E8A33D', icon: 'DataAnalysis' },
  { label: '累计营收', value: mockRevenueOverview.total, growth: 0, color: '#5F7D5B', icon: 'TrendCharts' }
])

const commonTooltip = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderColor: '#e4e7ed',
  borderWidth: 1,
  textStyle: { color: '#303133' },
  padding: [10, 15],
  extraCssText: 'box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); border-radius: 8px;'
}

const brandColors = ['#12233D', '#1E3A5F', '#E8A33D', '#C97F1F', '#5F7D5B', '#C9B48A', '#66707E']

// 营收趋势
const revenueTrendOption = computed(() => ({
  tooltip: { trigger: 'axis', ...commonTooltip },
  legend: { data: ['平台分成', '加盟商收入'], top: 0 },
  grid: { left: '2%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: mockRevenueTrend30.dates,
    axisLine: { lineStyle: { color: 'rgba(18,35,61,0.15)' } },
    axisLabel: { color: '#66707E' }
  },
  yAxis: [
    {
      type: 'value',
      name: '金额(元)',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(18,35,61,0.08)', type: 'dashed' } },
      axisLabel: { color: '#66707E' }
    }
  ],
  series: [
    {
      name: '加盟商收入',
      type: 'line',
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 2.5, color: '#1E3A5F' },
      itemStyle: { color: '#1E3A5F' },
      data: mockRevenueTrend30.franchiseeIncome,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(30,58,95,0.30)' },
            { offset: 1, color: 'rgba(30,58,95,0.02)' }
          ]
        }
      }
    },
    {
      name: '平台分成',
      type: 'line',
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 2.5, color: '#E8A33D' },
      itemStyle: { color: '#E8A33D' },
      data: mockRevenueTrend30.platformIncome,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(232,163,61,0.30)' },
            { offset: 1, color: 'rgba(232,163,61,0.02)' }
          ]
        }
      }
    }
  ]
}))

// 场地销量 TOP10
const siteSalesOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    ...commonTooltip,
    formatter: (params) => {
      const orders = params.find(p => p.seriesName === '订单数')
      const amount = params.find(p => p.seriesName === '订单金额')
      if (!orders) return ''
      return `<div style="font-weight:600;margin-bottom:4px;">${orders.name}</div>
              <div>订单数：${orders.value} 单</div>
              <div>订单金额：¥${(amount?.value || 0).toLocaleString()}</div>`
    }
  },
  legend: { data: ['订单数', '订单金额'], top: 0 },
  grid: { left: '2%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(18,35,61,0.08)', type: 'dashed' } },
    axisLabel: { color: '#66707E' }
  },
  yAxis: {
    type: 'category',
    data: mockSiteSales.map(s => s.site).reverse(),
    axisLine: { lineStyle: { color: 'rgba(18,35,61,0.15)' } },
    axisLabel: { color: '#1A2230', fontWeight: 500 }
  },
  series: [
    {
      name: '订单数',
      type: 'bar',
      barWidth: 14,
      data: mockSiteSales.map(s => s.orders).reverse(),
      itemStyle: { color: '#12233D', borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: '#1A2230', fontSize: 11 }
    },
    {
      name: '订单金额',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: mockSiteSales.map(s => s.amount).reverse(),
      itemStyle: { color: '#E8A33D' },
      lineStyle: { color: '#E8A33D', width: 2 }
    }
  ]
}))

// 用户充值次数分布
const rechargeFreqOption = computed(() => ({
  tooltip: { trigger: 'axis', ...commonTooltip },
  grid: { left: '2%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: mockRechargeData.frequency.map(f => f.times),
    axisLine: { lineStyle: { color: 'rgba(18,35,61,0.15)' } },
    axisLabel: { color: '#66707E' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(18,35,61,0.08)', type: 'dashed' } },
    axisLabel: { color: '#66707E' }
  },
  series: [
    {
      type: 'bar',
      barWidth: '45%',
      data: mockRechargeData.frequency.map(f => f.users),
      itemStyle: {
        color: (params) => {
          const colors = ['#C9B48A', '#1E3A5F', '#12233D', '#E8A33D', '#C97F1F']
          return colors[params.dataIndex]
        },
        borderRadius: [6, 6, 0, 0]
      },
      label: { show: true, position: 'top', color: '#1A2230', fontSize: 11 }
    }
  ]
}))

// 车型预订分布
const modelDistributionOption = computed(() => {
  const total = mockModelDistribution.reduce((s, m) => s + m.orders, 0)
  return {
    tooltip: {
      trigger: 'item',
      ...commonTooltip,
      formatter: (p) => `${p.name}<br/>订单数：${p.value} (${((p.value / total) * 100).toFixed(1)}%)`
    },
    legend: { bottom: 0, icon: 'circle', itemGap: 16, textStyle: { color: '#66707E' } },
    color: brandColors,
    series: [
      {
        type: 'pie',
        radius: ['38%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}单', color: '#1A2230', fontSize: 12 },
        emphasis: { itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
        data: mockModelDistribution.map(m => ({ name: m.model, value: m.orders }))
      }
    ]
  }
})

// 价格带预订分布
const priceDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    ...commonTooltip,
    formatter: (params) => {
      const orders = params.find(p => p.seriesName === '订单数')
      const amount = params.find(p => p.seriesName === '订单金额')
      return `<div style="font-weight:600;margin-bottom:4px;">${orders.name}</div>
              <div>订单数：${orders.value} 单</div>
              <div>订单金额：¥${(amount?.value || 0).toLocaleString()}</div>`
    }
  },
  legend: { data: ['订单数', '订单金额'], top: 0 },
  grid: { left: '2%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: mockPriceDistribution.map(p => p.range),
    axisLine: { lineStyle: { color: 'rgba(18,35,61,0.15)' } },
    axisLabel: { color: '#66707E' }
  },
  yAxis: [
    {
      type: 'value',
      name: '订单数',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(18,35,61,0.08)', type: 'dashed' } },
      axisLabel: { color: '#66707E' }
    },
    {
      type: 'value',
      name: '金额(元)',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#66707E' }
    }
  ],
  series: [
    {
      name: '订单数',
      type: 'bar',
      barWidth: 28,
      data: mockPriceDistribution.map(p => p.orders),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#1E3A5F' },
            { offset: 1, color: '#12233D' }
          ]
        },
        borderRadius: [6, 6, 0, 0]
      }
    },
    {
      name: '订单金额',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      data: mockPriceDistribution.map(p => p.amount),
      itemStyle: { color: '#E8A33D' },
      lineStyle: { color: '#E8A33D', width: 2.5 }
    }
  ]
}))

// 充值金额分布漏斗
const rechargeAmountOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    ...commonTooltip,
    formatter: (p) => `<div style="font-weight:600;">${p.name}</div>
                      <div>人数：${p.value}</div>
                      <div>占比：${p.percent}%</div>`
  },
  legend: { bottom: 0, icon: 'circle', itemGap: 16, textStyle: { color: '#66707E' } },
  series: [
    {
      type: 'funnel',
      left: '10%',
      top: '5%',
      bottom: '15%',
      width: '80%',
      sort: 'descending',
      gap: 4,
      label: { show: true, position: 'inside', color: '#fff', fontWeight: 600 },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: mockRechargeData.amountBuckets.map(b => ({
        name: b.range,
        value: b.count,
        percent: b.percent,
        itemStyle: { color: brandColors[mockRechargeData.amountBuckets.indexOf(b) % brandColors.length] }
      }))
    }
  ]
}))

// 时段热力图
const hourlyHeatmapOption = computed(() => {
  const { days, hours, data } = mockHourlyHeatmap
  const max = Math.max(...data.flat())
  const heatmapData = []
  for (let d = 0; d < days.length; d++) {
    for (let h = 0; h < hours.length; h++) {
      heatmapData.push([h, d, data[d][h]])
    }
  }
  return {
    tooltip: {
      ...commonTooltip,
      formatter: (p) => {
        const [h, d, v] = p.value
        return `${days[d]} ${String(h).padStart(2, '0')}:00<br/>订单量：${v}`
      }
    },
    grid: { left: '2%', right: '5%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: hours.map(h => `${h}h`),
      splitArea: { show: true },
      axisLabel: { color: '#66707E', interval: 1 }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
      axisLabel: { color: '#1A2230' }
    },
    visualMap: {
      min: 0,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      inRange: {
        color: ['#F5F2EA', '#C9B48A', '#E8A33D', '#C97F1F', '#12233D']
      },
      textStyle: { color: '#66707E' }
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(18,35,61,0.3)' } }
    }]
  }
})

// 用户新增/复购趋势
const userTrendOption = computed(() => ({
  tooltip: { trigger: 'axis', ...commonTooltip },
  legend: { data: ['新增用户', '复购用户'], top: 0 },
  grid: { left: '2%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: mockUserTrend30.dates,
    axisLine: { lineStyle: { color: 'rgba(18,35,61,0.15)' } },
    axisLabel: { color: '#66707E' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(18,35,61,0.08)', type: 'dashed' } },
    axisLabel: { color: '#66707E' }
  },
  series: [
    {
      name: '新增用户',
      type: 'bar',
      barWidth: 10,
      data: mockUserTrend30.newUsers,
      itemStyle: { color: '#12233D', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: '复购用户',
      type: 'bar',
      barWidth: 10,
      data: mockUserTrend30.returningUsers,
      itemStyle: { color: '#E8A33D', borderRadius: [4, 4, 0, 0] }
    }
  ]
}))
</script>

<style scoped>
.page-subtitle {
  font-size: 13px;
  color: #66707E;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chart-row {
  margin-top: 20px;
}

.chart-row .el-col {
  display: flex;
}

.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.chart-large {
  flex: 1;
  width: 100%;
  min-height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-tag {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #66707E;
}

.legend-tag .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}

.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  background: #FFFFFF;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(18, 35, 61, 0.10);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-icon {
  color: rgba(18, 35, 61, 0.35);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin: 12px 0 8px;
  font-family: 'Noto Serif SC', serif;
}

.stat-label {
  font-size: 14px;
  color: #66707E;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #66707E;
}
</style>