<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">数据看板</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in statCards" :key="stat.label">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-header">
            <div class="stat-label">{{ stat.label }}</div>
            <el-icon class="stat-icon" :size="20"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-trend" v-if="stat.trend">
            <el-icon :size="12"><arrow-up v-if="stat.trend > 0" /><arrow-down v-else /></el-icon>
            <span :style="{ color: stat.trend > 0 ? '#5F7D5B' : '#c45656' }">{{ Math.abs(stat.trend) }}% 环比昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>近7日营收趋势</span>
              <el-tag type="info" size="small">单位：元</el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="revenueOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card todo-card">
          <template #header>
            <span>待办事项</span>
          </template>
          <div class="todo-body">
            <el-timeline>
              <el-timeline-item
                v-for="item in todos"
                :key="item.id"
                :type="item.type"
                :timestamp="item.time"
              >
                {{ item.content }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>车辆状态分布</span>
          </template>
          <v-chart class="chart" :option="vehicleStatusOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>加盟商状态分布</span>
          </template>
          <v-chart class="chart" :option="franchiseeStatusOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>电池 SOH 分布</span>
          </template>
          <v-chart class="chart" :option="batterySohOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import {
  mockFranchisees,
  mockVehicles,
  mockBatteries,
  mockBatteryAlerts,
  mockOrders,
  mockApplications,
  mockWithdrawals,
  getStatusText
} from '@/api/mock'

const stats = reactive({
  franchiseeCount: mockFranchisees.length,
  vehicleCount: mockVehicles.length,
  todayAmount: mockOrders
    .filter(o => o.createdAt.startsWith('2026-09-07'))
    .reduce((sum, o) => sum + o.amount, 0),
  batteryAlertCount: mockBatteryAlerts.filter(a => a.status === 0).length
})

const statCards = computed(() => [
  { label: '加盟商总数', value: stats.franchiseeCount, color: '#12233D', trend: 12, icon: 'Shop' },
  { label: '车辆总数', value: stats.vehicleCount, color: '#5F7D5B', trend: 5, icon: 'Van' },
  { label: '今日订单金额', value: '¥' + stats.todayAmount, color: '#E8A33D', trend: 18, icon: 'Money' },
  { label: '电池预警', value: stats.batteryAlertCount, color: '#c45656', trend: -8, icon: 'Lightning' }
])

const todos = [
  { id: 1, content: `待审核加盟申请 ${mockApplications.filter(a => a.status === 1).length} 条`, time: '实时', type: 'warning' },
  { id: 2, content: `待审批提现 ${mockWithdrawals.filter(w => w.status === 0).length} 条`, time: '实时', type: 'danger' },
  { id: 3, content: `电池健康预警 ${mockBatteryAlerts.filter(a => a.status === 0).length} 条`, time: '实时', type: 'primary' },
  { id: 4, content: '本周结算单待确认', time: '9月7日', type: 'success' }
]

const chartColors = ['#12233D', '#1E3A5F', '#E8A33D', '#C97F1F', '#5F7D5B', '#C9B48A', '#66707E']

const commonTooltip = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderColor: '#e4e7ed',
  borderWidth: 1,
  textStyle: { color: '#303133' },
  padding: [10, 15],
  extraCssText: 'box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); border-radius: 8px;'
}

const revenueOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    ...commonTooltip,
    formatter: (params) => {
      const p = params[0]
      return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};"></span>
                <span>订单金额：¥${p.value.toLocaleString()}</span>
              </div>`
    }
  },
  grid: { left: '2%', right: '3%', bottom: '5%', top: '10%', containLabel: true },
  xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '今日'],
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
        name: '订单金额',
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        lineStyle: { width: 3, color: '#12233D' },
        itemStyle: { color: '#E8A33D', borderWidth: 2, borderColor: '#fff' },
        data: [3200, 4800, 4100, 5900, 4600, 7100, stats.todayAmount],
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(232,163,61,0.30)' },
              { offset: 1, color: 'rgba(232,163,61,0.02)' }
            ]
          }
        }
      }
    ]
  }))

const vehicleStatusOption = computed(() => {
  const counts = {}
  mockVehicles.forEach(v => {
    const label = getStatusText('vehicle', v.status)
    counts[label] = (counts[label] || 0) + 1
  })
  return {
    tooltip: { trigger: 'item', ...commonTooltip },
    legend: { bottom: 0, icon: 'circle', itemGap: 16, textStyle: { color: '#606266' } },
    color: chartColors,
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}台', color: '#606266' },
        labelLine: { lineStyle: { color: '#c0c4cc' } },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
        },
        data: Object.entries(counts).map(([name, value]) => ({ name, value }))
      }
    ]
  }
})

const franchiseeStatusOption = computed(() => {
  const counts = {}
  mockFranchisees.forEach(f => {
    const label = getStatusText('franchisee', f.status)
    counts[label] = (counts[label] || 0) + 1
  })
  return {
    tooltip: { trigger: 'item', ...commonTooltip },
    legend: { bottom: 0, icon: 'circle', itemGap: 16, textStyle: { color: '#606266' } },
    color: ['#5F7D5B', '#E8A33D', '#c45656', '#66707E'],
    series: [
      {
        type: 'pie',
        radius: '62%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {c}', color: '#606266' },
        emphasis: {
          itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
        },
        data: Object.entries(counts).map(([name, value]) => ({ name, value }))
      }
    ]
  }
})

const batterySohOption = computed(() => {
  const ranges = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '<70%': 0 }
  mockBatteries.forEach(b => {
    if (b.soh >= 90) ranges['90-100%']++
    else if (b.soh >= 80) ranges['80-89%']++
    else if (b.soh >= 70) ranges['70-79%']++
    else ranges['<70%']++
  })
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } },
      ...commonTooltip
    },
    grid: { left: '2%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Object.keys(ranges),
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
        data: Object.values(ranges),
        itemStyle: {
          color: (params) => {
            const colors = ['#5F7D5B', '#E8A33D', '#c45656', '#66707E']
            return colors[params.dataIndex]
          },
          borderRadius: [6, 6, 0, 0]
        },
        label: { show: true, position: 'top', color: '#606266', formatter: '{c}块' }
      }
    ]
  }
})
</script>

<style scoped>
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
  font-size: 30px;
  font-weight: 700;
  margin: 12px 0 8px;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.02em;
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

.chart {
  flex: 1;
  width: 100%;
  min-height: 280px;
}

.todo-body {
  flex: 1;
  display: flex;
  align-items: center;
}

.todo-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
