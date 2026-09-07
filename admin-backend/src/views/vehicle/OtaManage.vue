<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">OTA 固件管理</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">累计发布版本</div><div class="stat-value">{{ stats.totalVersion }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">累计升级车辆</div><div class="stat-value">{{ stats.totalUpgraded }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">升级成功率</div><div class="stat-value" style="color: #67c23a;">{{ stats.successRate }}%</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">进行中任务</div><div class="stat-value" style="color: #409eff;">{{ stats.ongoing }}</div></el-card></el-col>
    </el-row>

    <el-card>
      <div class="search-bar">
        <el-input v-model="search.version" placeholder="版本号" clearable style="width: 180px;" />
        <el-select v-model="search.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="进行中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="success" @click="openPublishDialog">+ 发布新版本</el-button>
      </div>

      <el-table :data="filteredTasks" border stripe v-loading="loading">
        <el-table-column prop="version" label="版本号" width="110" />
        <el-table-column prop="description" label="更新说明" min-width="240" show-overflow-tooltip />
        <el-table-column prop="releaseAt" label="发布时间" width="120" />
        <el-table-column label="进度" width="220">
          <template #default="{ row }">
            <el-progress
              :percentage="progressPercent(row)"
              :status="row.status === 2 ? 'success' : (row.status === 1 ? '' : 'exception')"
              :stroke-width="14"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              成功 {{ row.successCount }} / 失败 {{ row.failedCount || 0 }} / 总 {{ row.targetCount }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : 'primary'">
              {{ row.status === 2 ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetails(row)">查看进度</el-button>
            <el-button v-if="row.status === 1" link type="warning" size="small" @click="pauseTask(row)">暂停</el-button>
            <el-button v-if="row.status === 1" link type="info" size="small" @click="rollbackTask(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailsVisible" title="升级任务详情" width="900px">
      <div v-if="selectedTask" class="task-meta">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="版本号">{{ selectedTask.version }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ selectedTask.releaseAt }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedTask.status === 2 ? 'success' : 'primary'">
              {{ selectedTask.status === 2 ? '已完成' : '进行中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新说明" :span="3">{{ selectedTask.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-table :data="taskDetails" border size="small" style="margin-top: 16px;" v-loading="detailsLoading">
        <el-table-column prop="vehicleSn" label="车辆SN" width="130" />
        <el-table-column prop="fromVersion" label="原版本" width="100" />
        <el-table-column prop="toVersion" label="目标版本" width="100" />
        <el-table-column prop="status" label="升级状态" width="110">
          <template #default="{ row }">
            <el-tag :type="otaTaskType(row.status)">{{ getStatusText('otaTask', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="160" />
        <el-table-column prop="finishedAt" label="完成时间" width="160">
          <template #default="{ row }">
            {{ row.finishedAt || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="publishVisible" title="发布新固件版本" width="500px">
      <el-form :model="publishForm" label-width="100px">
        <el-form-item label="版本号">
          <el-input v-model="publishForm.version" placeholder="例如：v1.2.5" />
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input v-model="publishForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="目标车辆">
          <el-select v-model="publishForm.targetVehicleIds" multiple placeholder="选择升级车辆" style="width: 100%;">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.sn} - ${v.model}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="升级策略">
          <el-radio-group v-model="publishForm.strategy">
            <el-radio value="immediate">立即执行</el-radio>
            <el-radio value="scheduled">预约执行</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" :loading="publishLoading" @click="confirmPublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { otaApi, vehicleApi } from '@/api'
import { useAsync } from '@/composables/useAsync'
import { getStatusText } from '@/api/mock'

const search = reactive({ version: '', status: '' })
const publishVisible = ref(false)
const publishLoading = ref(false)
const publishForm = reactive({ version: '', description: '', targetVehicleIds: [], strategy: 'immediate' })

const detailsVisible = ref(false)
const selectedTask = ref(null)
const taskDetails = ref([])
const detailsLoading = ref(false)

const { loading, data: tasks, reload } = useAsync(() => otaApi.tasks(), { defaultValue: [] })
const { data: vehicles } = useAsync(() => vehicleApi.list(), { defaultValue: [] })

const stats = computed(() => {
  const list = tasks.value
  const total = list.reduce((s, r) => s + r.targetCount, 0)
  const success = list.reduce((s, r) => s + r.successCount, 0)
  const failed = list.reduce((s, r) => s + (r.failedCount || 0), 0)
  return {
    totalVersion: list.length,
    totalUpgraded: success,
    successRate: total ? Math.round(success / total * 100) : 0,
    ongoing: list.filter(r => r.status === 1).length
  }
})

const filteredTasks = computed(() => {
  return tasks.value.filter(r => {
    const matchVersion = !search.version || r.version.includes(search.version)
    const matchStatus = search.status === '' || r.status === search.status
    return matchVersion && matchStatus
  })
})

const progressPercent = (row) => row.targetCount ? Math.round((row.successCount + (row.failedCount || 0)) / row.targetCount * 100) : 0
const otaTaskType = (status) => ({ 0: 'info', 1: 'primary', 2: 'success', 3: 'danger' })[status]

const viewDetails = async (row) => {
  selectedTask.value = row
  taskDetails.value = []
  detailsVisible.value = true
  detailsLoading.value = true
  try {
    taskDetails.value = await otaApi.details(row.id)
  } finally {
    detailsLoading.value = false
  }
}

const pauseTask = (row) => ElMessage.success(`已暂停升级任务：${row.version}`)
const rollbackTask = (row) => ElMessage.warning(`已发起回滚：${row.version}`)

const handleSearch = () => {}
const resetSearch = () => {
  search.version = ''
  search.status = ''
}

const openPublishDialog = () => {
  publishForm.version = ''
  publishForm.description = ''
  publishForm.targetVehicleIds = []
  publishForm.strategy = 'immediate'
  publishVisible.value = true
}

const confirmPublish = async () => {
  if (!publishForm.version || !publishForm.targetVehicleIds.length) {
    ElMessage.warning('请填写版本号并选择目标车辆')
    return
  }
  publishLoading.value = true
  try {
    await otaApi.create({
      version: publishForm.version,
      description: publishForm.description,
      targetVehicleIds: publishForm.targetVehicleIds,
      strategy: publishForm.strategy
    })
    ElMessage.success(`已发布 ${publishForm.version}，目标车辆 ${publishForm.targetVehicleIds.length} 台`)
    publishVisible.value = false
    await reload()
  } finally {
    publishLoading.value = false
  }
}
</script>

<style scoped>
.task-meta {
  margin-bottom: 8px;
}
</style>