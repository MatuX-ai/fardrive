<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">加盟商准入审核</div>
    </div>

    <el-card>
      <el-table :data="applications" border stripe>
        <el-table-column prop="id" label="申请ID" width="90" />
        <el-table-column prop="applicantName" label="申请人" width="120" />
        <el-table-column prop="applicantPhone" label="联系电话" width="130" />
        <el-table-column prop="submittedAt" label="提交时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="warning">{{ getStatusText('application', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资质材料" min-width="200">
          <template #default>
            <el-button link type="primary">营业执照</el-button>
            <el-button link type="primary">场地视频</el-button>
            <el-button link type="primary">信号认证</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="审核意见" width="500px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.result">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="auditForm.remark" type="textarea" rows="4" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { mockApplications, getStatusText } from '@/api/mock'

const applications = ref([...mockApplications])
const dialogVisible = ref(false)
const currentRow = ref(null)
const auditForm = reactive({
  result: 'approve',
  remark: ''
})

const handleApprove = (row) => {
  currentRow.value = row
  auditForm.result = 'approve'
  auditForm.remark = ''
  dialogVisible.value = true
}

const handleReject = (row) => {
  currentRow.value = row
  auditForm.result = 'reject'
  auditForm.remark = ''
  dialogVisible.value = true
}

const submitAudit = () => {
  if (currentRow.value) {
    currentRow.value.status = auditForm.result === 'approve' ? 3 : 4
    currentRow.value.reviewRemark = auditForm.remark
    currentRow.value.reviewedAt = new Date().toISOString()
    ElMessage.success(auditForm.result === 'approve' ? '已通过' : '已驳回')
  }
  dialogVisible.value = false
}
</script>
