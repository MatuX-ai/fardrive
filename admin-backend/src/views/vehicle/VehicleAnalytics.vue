<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">车辆分析</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">车均日营收</div><div class="stat-value">¥{{ stats.avgRevenue }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">车均在线率</div><div class="stat-value">{{ stats.avgOnline }}%</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">最赚钱车</div><div class="stat-value" style="color: #67c23a; font-size: 18px;">{{ stats.bestEarner }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">待优化车</div><div class="stat-value" style="color: #f56c6c; font-size: 18px;">{{ stats.worst }}</div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>营收 vs 在线率（散点）</span>
          </template>
          <v-chart class="chart" :option="scatterOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>档位营收分布</span>
          </template>
          <v-chart class="chart" :option="gearPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>盈亏排行</span>
          </template>
          <el-table :data="rankedVehicles" border size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="sn" label="车辆SN" width="120" />
            <el-table-column prop="siteName" label="场地" min-width="140" />
            <el-table-column prop="orderCount" label="订单数" width="90" />
            <el-table-column prop="totalRevenue" label="营收" width="100">
              <template #default="{ row }">
                ¥{{ row.totalRevenue }}
              </template>
            </el-table-column>
            <el-table-column prop="onlineRate30d" label="在线率" width="90">
              <template #default="{ row }">
                {{ (row.onlineRate30d * 100).toFixed(0) }}%
              </template>
            </el-table-column>
            <el-table-column label="盈亏" width="100">
              <template #default="{ row }">
                <el-tag :type="row.profit >= 0 ? 'success' : 'danger'">
                  ¥{{ row.profit }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>场地车龄 × 在线率</span>
          </template>
          <v-chart class="chart" :option="barOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>购车建议（按档位）</span>
      </template>
      <el-table :data="purchaseAdvice" border>
        <el-table-column prop="gearLevel" label="档位" width="140" />
        <el-table-column prop="count" label="车辆数" width="100" />
        <el-table-column prop="avgRevenue" label="车均营收" width="120">
          <template #default="{ row }">
            ¥{{ row.avgRevenue }}
          </template>
        </el-table-column>
        <el-table-column prop="avgOnline" label="车均在线率" width="120">
          <template #default="{ row }">
            {{ (row.avgOnline * 100).toFixed(0) }}%
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="260">
          <template #default="{ row }">
            <el-tag :type="row.adviceType">{{ row.advice }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart, PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { mockVehicles, findSite, findAccidentRecords, findMaintenanceRecords } from '@/api/mock'

use([CanvasRenderer, ScatterChart, PieChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const enrichedVehicles = computed(() => mockVehicles.map(v => {
  const site = findSite(v.siteId)
  const accidents = findAccidentRecords(v.id)
  const repairs = findMaintenanceRecords(v.id)
  const repairCost = repairs.reduce((s, r) => s + (r.cost || 0), 0) + accidents.reduce((s, a) => s + (a.repairCost || 0), 0)
  const platformAmount = Math.round(v.totalRevenue * 0.15)
  return {
    ...v,
    siteName: site?.name || '-',
    platformAmount,
    repairCost,
    profit: v.totalRevenue - platformAmount - repairCost
  }
}))

const rankedVehicles = computed(() => [...enrichedVehicles.value].sort((a, b) => b.profit - a.profit))

const stats = computed(() => {
  const list = enrichedVehicles.value
  if (!list.length) return { avgRevenue: 0, avgOnline: 0, bestEarner: '-', worst: '-' }
  const avgRevenue = Math.round(list.reduce((s, x) => s + x.totalRevenue, 0) / list.length)
  const avgOnline = (list.reduce((s, x) => s + x.onlineRate30d, 0) / list.length * 100).toFixed(0)
  const best = rankedVehicles.value[0]
  const worst = rankedVehicles.value[rankedVehicles.value.length - 1]
  return {
    avgRevenue,
    avgOnline,
    bestEarner: best.sn,
    worst: worst.sn
  }
})

const scatterOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: p => `${p.data[2]}<br/>在线率 ${(p.data[0] * 100).toFixed(0)}%<br/>营收 ¥${p.data[1]}` },
  grid: { left: 50, right: 30, top: 30, bottom: 40 },
  xAxis: { name: '在线率', type: 'value', min: 0, max: 1, axisLabel: { formatter: '{value} = 100%' } },
  yAxis: { name: '营收(¥)', type: 'value' },
  series: [{
    type: 'scatter',
    data: enrichedVehicles.value.map(v => [v.onlineRate30d, v.totalRevenue, v.sn]),
    symbolSize: 18,
    itemStyle: { color: '#409eff' }
  }]
}))

const gearPieOption = computed(() => {
  const groups = {}
  enrichedVehicles.value.forEach(v => {
    groups[v.gearLevel] = (groups[v.gearLevel] || 0) + v.totalRevenue
  })
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: Object.entries(groups).map(([name, value]) => ({ name, value })),
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c']
    }]
  }
})

const barOption = computed(() => {
  const groups = {}
  enrichedVehicles.value.forEach(v => {
    const key = v.gearLevel
    if (!groups[key]) groups[key] = { total: 0, count: 0 }
    groups[key].total += v.onlineRate30d
    groups[key].count += 1
  })
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: Object.keys(groups) },
    yAxis: { type: 'value', axisLabel: { formatter: v => `${(v * 100).toFixed(0)}%` } },
    series: [{
      type: 'bar',
      data: Object.values(groups).map(g => Math.round(g.total / g.count * 100) / 100),
      itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] }
    }]
  }
})

const purchaseAdvice = computed(() => {
  const groups = {}
  enrichedVehicles.value.forEach(v => {
    if (!groups[v.gearLevel]) groups[v.gearLevel] = { count: 0, totalRev: 0, totalOnline: 0 }
    groups[v.gearLevel].count += 1
    groups[v.gearLevel].totalRev += v.totalRevenue
    groups[v.gearLevel].totalOnline += v.onlineRate30d
  })
  return Object.entries(groups).map(([gearLevel, g]) => {
    const avgRevenue = Math.round(g.totalRev / g.count)
    const avgOnline = g.totalOnline / g.count
    let advice = '', adviceType = ''
    if (avgOnline >= 0.85 && avgRevenue >= 20000) {
      advice = '主力走量，继续补充'
      adviceType = 'success'
    } else if (avgOnline >= 0.65) {
      advice = '表现稳定，可适当增加'
      adviceType = 'primary'
    } else {
      advice = '在线率偏低，建议先排查场地信号'
      adviceType = 'warning'
    }
    return { gearLevel, count: g.count, avgRevenue, avgOnline, advice, adviceType }
  })
})
</script>

<style scoped>
.chart {
  height: 280px;
}
</style>