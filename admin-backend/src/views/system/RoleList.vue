<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">角色权限管理</div>
    </div>

    <el-card>
      <el-table :data="roles" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="name" label="角色名称" width="120" />
        <el-table-column prop="description" label="说明" min-width="250" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editPermission(row)">配置权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="配置权限" width="600px">
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="checkedKeys"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermission">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mockRoles } from '@/api/mock'

const roles = ref([...mockRoles])
const dialogVisible = ref(false)
const checkedKeys = ref([])
const treeRef = ref()

const permissionTree = [
  {
    id: 'dashboard',
    label: '首页看板',
    children: [
      { id: 'dashboard:view', label: '查看' }
    ]
  },
  {
    id: 'franchisee',
    label: '加盟商管理',
    children: [
      { id: 'franchisee:view', label: '查看' },
      { id: 'franchisee:audit', label: '审核' },
      { id: 'franchisee:edit', label: '编辑' }
    ]
  },
  {
    id: 'vehicle',
    label: '车辆资产',
    children: [
      { id: 'vehicle:view', label: '查看' },
      { id: 'vehicle:edit', label: '编辑' }
    ]
  },
  {
    id: 'battery',
    label: '电池监控',
    children: [
      { id: 'battery:view', label: '查看' },
      { id: 'battery:alert', label: '处理预警' }
    ]
  },
  {
    id: 'finance',
    label: '财务结算',
    children: [
      { id: 'finance:view', label: '查看' },
      { id: 'finance:settle', label: '结算确认' },
      { id: 'finance:withdraw', label: '提现审批' }
    ]
  },
  {
    id: 'system',
    label: '系统管理',
    children: [
      { id: 'system:user', label: '用户管理' },
      { id: 'system:role', label: '角色权限' }
    ]
  }
]

const editPermission = (row) => {
  checkedKeys.value = row.code === 'super_admin'
    ? permissionTree.flatMap(p => [p.id, ...p.children.map(c => c.id)])
    : []
  dialogVisible.value = true
}

const submitPermission = () => {
  const keys = treeRef.value.getCheckedKeys()
  ElMessage.success(`已保存权限，共 ${keys.length} 项`)
  dialogVisible.value = false
}
</script>
