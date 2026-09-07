<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">加盟商列表</div>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input v-model="search.name" placeholder="公司名称" clearable style="width: 200px;" />
        <el-select v-model="search.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="待审核" :value="0" />
          <el-option label="正常" :value="1" />
          <el-option label="冻结" :value="2" />
          <el-option label="退出" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="filteredList" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="companyName" label="公司名称" min-width="200" />
        <el-table-column prop="legalPerson" label="法人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="regionCode" label="区域编码" width="100" />
        <el-table-column prop="depositAmount" label="保证金" width="120">
          <template #default="{ row }">
            ¥{{ row.depositAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="settleRatio" label="平台分成" width="100">
          <template #default="{ row }">
            {{ (row.settleRatio * 100).toFixed(0) }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ getStatusText('franchisee', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinedAt" label="入驻时间" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small">详情</el-button>
            <el-button link type="primary" size="small">编辑</el-button>
            <el-button v-if="row.status === 1" link type="danger" size="small">冻结</el-button>
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
import { mockFranchisees, getStatusText } from '@/api/mock'

const search = reactive({
  name: '',
  status: ''
})

const page = reactive({
  current: 1,
  size: 10,
  total: mockFranchisees.length
})

const filteredList = computed(() => {
  return mockFranchisees.filter(item => {
    const matchName = !search.name || item.companyName.includes(search.name)
    const matchStatus = search.status === '' || item.status === search.status
    return matchName && matchStatus
  })
})

const statusType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status]
}

const handleSearch = () => {
  page.current = 1
}

const resetSearch = () => {
  search.name = ''
  search.status = ''
}
</script>
