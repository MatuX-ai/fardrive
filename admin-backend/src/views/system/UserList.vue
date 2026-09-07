<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">系统用户管理</div>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input v-model="search.keyword" placeholder="用户名/姓名" clearable style="width: 200px;" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="success" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table :data="filteredList" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="roles" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small">编辑</el-button>
            <el-button link type="primary" size="small">重置密码</el-button>
            <el-button link :type="row.status === 1 ? 'danger' : 'success'" size="small">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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

    <el-dialog v-model="dialogVisible" title="新增用户" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roles" style="width: 100%;">
            <el-option label="超级管理员" value="超级管理员" />
            <el-option label="运营" value="运营" />
            <el-option label="客服" value="客服" />
            <el-option label="财务" value="财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mockUsers } from '@/api/mock'

const search = reactive({
  keyword: ''
})

const page = reactive({
  current: 1,
  size: 10,
  total: mockUsers.length
})

const dialogVisible = ref(false)
const form = reactive({
  username: '',
  realName: '',
  phone: '',
  roles: '运营'
})

const filteredList = computed(() => {
  return mockUsers.filter(item => {
    return !search.keyword ||
      item.username.includes(search.keyword) ||
      item.realName.includes(search.keyword)
  })
})

const handleSearch = () => {
  page.current = 1
}

const handleAdd = () => {
  form.username = ''
  form.realName = ''
  form.phone = ''
  form.roles = '运营'
  dialogVisible.value = true
}

const submitAdd = () => {
  ElMessage.success('新增成功')
  dialogVisible.value = false
}
</script>
