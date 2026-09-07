<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">电池健康度监控</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>SOH 分布</span>
          </template>
          <v-chart class="chart" :option="sohChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>电池状态分布</span>
          </template>
          <v-chart class="chart" :option="statusChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="search-bar">
        <el-input v-model="search.sn" placeholder="电池SN" clearable style="width: 180px;" />
        <el-select v-model="search.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="正常" :value="1" />
          <el-option label="建议退役" :value="2" />
          <el-option label="已退役" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="filteredList" border stripe>
        <el-table-column prop="sn" label="电池SN" width="140" />
        <el-table-column prop="vehicleId" label="绑定车辆ID" width="110" />
        <el-table-column prop="capacity" label="容量(Ah)" width="100" />
        <el-table-column prop="soh" label="SOH" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.soh"
              :color="sohColor(row.soh)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="cycleCount" label="循环次数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ getStatusText('battery', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showHistory(row)">历史数据</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="historyVisible" title="电池历史数据" width="700px">
      <el-table :data="historyData" border size="small">
        <el-table-column prop="reportedAt" label="上报时间" width="160" />
        <el-table-column prop="soc" label="SOC%" width="90" />
        <el-table-column prop="temperature" label="温度(°C)" width="100" />
        <el-table-column prop="cycleCount" label="循环次数" width="100" />
        <el-table-column prop="internalResistance" label="内阻(mΩ)" width="110" />
        <el-table-column prop="voltage" label="电压(V)" width="100" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { mockBatteries, getStatusText } from '@/api/mock'

const sohChartOption = computed(() => {
  const ranges = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '<70%': 0 }
  mockBatteries.forEach(b => {
    if (b.soh >= 90) ranges['90-100%']++
    else if (b.soh >= 80) ranges['80-89%']++
    else if (b.soh >= 70) ranges['70-79%']++
    else ranges['<70%']++
  })
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(ranges) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: Object.values(ranges),
      itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }
    }]
  }
})

const statusChartOption = computed(() => {
  const counts = {}
  mockBatteries.forEach(b => {
    const label = getStatusText('battery', b.status)
    counts[label] = (counts[label] || 0) + 1
  })
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '65%',
      data: Object.entries(counts).map(([name, value]) => ({ name, value }))
    }]
  }
})

const search = reactive({
  sn: '',
  status: ''
})

const page = reactive({
  current: 1,
  size: 10,
  total: mockBatteries.length
})

const historyVisible = ref(false)
const historyData = ref([])

const filteredList = computed(() => {
  return mockBatteries.filter(item => {
    const matchSn = !search.sn || item.sn.includes(search.sn)
    const matchStatus = search.status === '' || item.status === search.status
    return matchSn && matchStatus
  })
})

const sohColor = (soh) => {
  if (soh >= 90) return '#67c23a'
  if (soh >= 80) return '#e6a23c'
  return '#f56c6c'
}

const statusType = (status) => {
  const map = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[status]
}

const showHistory = (row) => {
  historyData.value = [
    { reportedAt: '2026-09-07 08:00:00', soc: 78, temperature: 32, cycleCount: row.cycleCount, internalResistance: 12.5, voltage: 48.2 },
    { reportedAt: '2026-09-06 08:00:00', soc: 45, temperature: 33, cycleCount: row.cycleCount - 1, internalResistance: 12.6, voltage: 47.8 },
    { reportedAt: '2026-09-05 08:00:00', soc: 92, temperature: 31, cycleCount: row.cycleCount - 2, internalResistance: 12.4, voltage: 48.5 }
  ]
  historyVisible.value = true
}

const handleSearch = () => {
  page.current = 1
}

const resetSearch = () => {
  search.sn = ''
  search.status = ''
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 260px;
}
</style>
