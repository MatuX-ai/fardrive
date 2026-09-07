<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">耗材复购预警</div>
    </div>

    <el-card>
      <el-table :data="alerts" border stripe>
        <el-table-column prop="id" label="预警ID" width="90" />
        <el-table-column prop="batterySn" label="电池SN" width="140" />
        <el-table-column prop="alertType" label="预警类型" width="130">
          <template #default="{ row }">
            <el-tag :type="alertTypeColor(row.alertType)">{{ alertTypeText(row.alertType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="severityColor(row.severity)">{{ severityText(row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="预警内容" min-width="250" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'danger' : 'success'">
              {{ row.status === 0 ? '未处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="产生时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="generateOrder(row)">生成采购单</el-button>
            <el-button size="small" @click="handleConfirm(row)">确认</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="orderVisible" title="生成耗材采购单" width="500px">
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="加盟商">
          <el-input v-model="orderForm.franchiseeName" disabled />
        </el-form-item>
        <el-form-item label="采购类型">
          <el-input value="电池" disabled />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="orderForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="orderForm.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { mockBatteryAlerts, mockFranchisees } from '@/api/mock'

const alerts = ref([...mockBatteryAlerts])
const orderVisible = ref(false)
const currentAlert = ref(null)
const orderForm = reactive({
  franchiseeName: '',
  quantity: 1,
  remark: ''
})

const alertTypeText = (type) => {
  const map = { soh_low: 'SOH过低', cycle_threshold: '循环阈值', temperature_high: '温度异常' }
  return map[type] || type
}

const alertTypeColor = (type) => {
  const map = { soh_low: 'danger', cycle_threshold: 'warning', temperature_high: 'danger' }
  return map[type] || 'info'
}

const severityText = (level) => {
  const map = { 1: '提示', 2: '警告', 3: '严重' }
  return map[level]
}

const severityColor = (level) => {
  const map = { 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level]
}

const generateOrder = (row) => {
  currentAlert.value = row
  const franchisee = mockFranchisees.find(f => f.id === 1)
  orderForm.franchiseeName = franchisee?.companyName || ''
  orderForm.quantity = 1
  orderForm.remark = `针对 ${row.batterySn} 的${alertTypeText(row.alertType)}预警`
  orderVisible.value = true
}

const submitOrder = () => {
  ElMessage.success(`已生成采购单：${orderForm.quantity} 块电池`)
  orderVisible.value = false
}

const handleConfirm = (row) => {
  row.status = 1
  ElMessage.success('已确认')
}
</script>
