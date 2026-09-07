<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">结算单管理</div>
    </div>

    <el-card style="margin-bottom: 16px;">
      <template #header>
        <span>结算金额趋势</span>
      </template>
      <v-chart class="chart" :option="settlementChartOption" autoresize />
    </el-card>

    <el-card>
      <div class="search-bar">
        <el-select v-model="search.status" placeholder="结算状态" clearable style="width: 140px;">
          <el-option label="待确认" :value="0" />
          <el-option label="已确认" :value="1" />
          <el-option label="已结算" :value="2" />
          <el-option label="有差异" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="filteredList" border stripe>
        <el-table-column prop="id" label="结算单号" width="100" />
        <el-table-column prop="franchiseeId" label="加盟商ID" width="100" />
        <el-table-column prop="periodStart" label="结算周期" width="180">
          <template #default="{ row }">
            {{ row.periodStart }} ~ {{ row.periodEnd }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单总额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="platformAmount" label="平台分成" width="120">
          <template #default="{ row }">
            ¥{{ row.platformAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="franchiseeAmount" label="加盟商分成" width="120">
          <template #default="{ row }">
            ¥{{ row.franchiseeAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ getStatusText('settlement', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" size="small" @click="confirmSettlement(row)">确认</el-button>
            <el-button v-if="row.status === 1" type="success" size="small" @click="settle(row)">结算</el-button>
            <el-button link type="primary" size="small">明细</el-button>
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
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { mockSettlements, getStatusText } from '@/api/mock'

const settlementChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['订单总额', '平台分成', '加盟商分成'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: mockSettlements.map(s => s.periodStart)
  },
  yAxis: { type: 'value' },
  series: [
    { name: '订单总额', type: 'bar', data: mockSettlements.map(s => s.totalAmount), itemStyle: { color: '#409eff' } },
    { name: '平台分成', type: 'bar', data: mockSettlements.map(s => s.platformAmount), itemStyle: { color: '#e6a23c' } },
    { name: '加盟商分成', type: 'bar', data: mockSettlements.map(s => s.franchiseeAmount), itemStyle: { color: '#67c23a' } }
  ]
}))

const search = reactive({
  status: ''
})

const page = reactive({
  current: 1,
  size: 10,
  total: mockSettlements.length
})

const filteredList = computed(() => {
  return mockSettlements.filter(item => {
    return search.status === '' || item.status === search.status
  })
})

const statusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger' }
  return map[status]
}

const confirmSettlement = (row) => {
  row.status = 1
  ElMessage.success('结算单已确认')
}

const settle = (row) => {
  row.status = 2
  row.settledAt = new Date().toISOString()
  ElMessage.success('结算完成')
}

const handleSearch = () => {
  page.current = 1
}

const resetSearch = () => {
  search.status = ''
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 280px;
}
</style>
