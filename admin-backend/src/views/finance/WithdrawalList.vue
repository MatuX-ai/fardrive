<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">提现审批</div>
    </div>

    <el-card>
      <div class="search-bar">
        <el-select v-model="search.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="待审批" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已打款" :value="2" />
          <el-option label="驳回" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="filteredList" border stripe>
        <el-table-column prop="id" label="提现ID" width="90" />
        <el-table-column prop="franchiseeId" label="加盟商ID" width="100" />
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="bankAccount" label="收款账户" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ getStatusText('withdrawal', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="success" size="small" @click="approve(row)">通过</el-button>
            <el-button v-if="row.status === 0" type="danger" size="small" @click="reject(row)">驳回</el-button>
            <el-button v-if="row.status === 1" type="primary" size="small" @click="pay(row)">打款</el-button>
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
import { mockWithdrawals, getStatusText } from '@/api/mock'

const search = reactive({
  status: ''
})

const page = reactive({
  current: 1,
  size: 10,
  total: mockWithdrawals.length
})

const filteredList = computed(() => {
  return mockWithdrawals.filter(item => {
    return search.status === '' || item.status === search.status
  })
})

const statusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger' }
  return map[status]
}

const approve = (row) => {
  row.status = 1
  ElMessage.success('已通过')
}

const reject = (row) => {
  row.status = 3
  ElMessage.success('已驳回')
}

const pay = (row) => {
  row.status = 2
  row.paidAt = new Date().toISOString()
  ElMessage.success('已打款')
}

const handleSearch = () => {
  page.current = 1
}

const resetSearch = () => {
  search.status = ''
}
</script>
