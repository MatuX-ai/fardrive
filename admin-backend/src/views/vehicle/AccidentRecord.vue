<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">维修/事故记录</div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="维修记录" name="repair">
        <el-card>
          <div class="search-bar">
            <el-input v-model="repairSearch.sn" placeholder="车辆SN" clearable style="width: 160px;" />
            <el-select v-model="repairSearch.type" placeholder="类型" clearable style="width: 120px;">
              <el-option label="保养" value="routine" />
              <el-option label="维修" value="repair" />
            </el-select>
            <el-select v-model="repairSearch.status" placeholder="状态" clearable style="width: 120px;">
              <el-option label="待处理" :value="0" />
              <el-option label="已完成" :value="1" />
            </el-select>
            <el-button type="primary" @click="repairSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetRepairSearch">重置</el-button>
            <el-button type="success" @click="openRepairDialog()">+ 录入维修</el-button>
          </div>

          <el-table :data="filteredRepair" border stripe>
            <el-table-column prop="vehicleSn" label="车辆SN" width="130" />
            <el-table-column prop="item" label="项目" min-width="160" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'routine' ? 'primary' : 'warning'" size="small">
                  {{ row.type === 'routine' ? '保养' : '维修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="120" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="cost" label="费用" width="100">
              <template #default="{ row }">
                {{ row.cost ? `¥${row.cost}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ getStatusText('maintenance', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goArchive(row.vehicleId)">查看车辆</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="事故记录" name="accident">
        <el-row :gutter="16" style="margin-bottom: 16px;">
  <el-col :span="6"><el-card class="stat-card"><div class="stat-label">事故总数</div><div class="stat-value">{{ accidentStats.total }}</div></el-card></el-col>
  <el-col :span="6"><el-card class="stat-card"><div class="stat-label">待定责</div><div class="stat-value" style="color: #f56c6c;">{{ accidentStats.pending }}</div></el-card></el-col>
  <el-col :span="6"><el-card class="stat-card"><div class="stat-label">玩家责任</div><div class="stat-value" style="color: #e6a23c;">{{ accidentStats.player }}</div></el-card></el-col>
  <el-col :span="6"><el-card class="stat-card"><div class="stat-label">维修总成本</div><div class="stat-value">¥{{ accidentStats.cost }}</div></el-card></el-col>
</el-row>

        <el-card>
          <div class="search-bar">
            <el-input v-model="accidentSearch.sn" placeholder="车辆SN" clearable style="width: 160px;" />
            <el-select v-model="accidentSearch.type" placeholder="类型" clearable style="width: 120px;">
              <el-option label="翻车" value="rollover" />
              <el-option label="碰撞" value="collision" />
            </el-select>
            <el-select v-model="accidentSearch.responsibility" placeholder="定责" clearable style="width: 120px;">
              <el-option label="玩家" value="player" />
              <el-option label="设备" value="device" />
              <el-option label="平台" value="platform" />
              <el-option label="待定责" value="unknown" />
            </el-select>
            <el-button type="primary" @click="accidentSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetAccidentSearch">重置</el-button>
          </div>

          <el-table :data="filteredAccident" border stripe>
            <el-table-column prop="vehicleSn" label="车辆SN" width="130" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'rollover' ? 'danger' : 'warning'" size="small">
                  {{ row.type === 'rollover' ? '翻车' : '碰撞' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occurredAt" label="发生时间" width="160" />
            <el-table-column prop="location" label="地点" min-width="180" show-overflow-tooltip />
            <el-table-column prop="description" label="经过" min-width="220" show-overflow-tooltip />
            <el-table-column prop="responsibility" label="定责" width="100">
              <template #default="{ row }">
                <el-tag :type="responsibilityType(row.responsibility)">{{ responsibilityText(row.responsibility) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="repairCost" label="维修费用" width="100">
              <template #default="{ row }">
                {{ row.repairCost ? `¥${row.repairCost}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ getStatusText('accident', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openReplay(row)">查看回放</el-button>
                <el-button link type="warning" size="small" @click="openResolve(row)" :disabled="row.status === 1">定责</el-button>
                <el-button link type="primary" size="small" @click="goArchive(row.vehicleId)">查看车辆</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="replayVisible" title="事故回放材料" width="700px">
      <el-descriptions :column="2" border v-if="currentAccident">
        <el-descriptions-item label="车辆SN">{{ currentAccident.vehicleSn }}</el-descriptions-item>
        <el-descriptions-item label="事故类型">{{ currentAccident.type === 'rollover' ? '翻车' : '碰撞' }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ currentAccident.occurredAt }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentAccident.location }}</el-descriptions-item>
        <el-descriptions-item label="经过" :span="2">{{ currentAccident.description }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <h4>取证材料</h4>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-card class="evidence-card"><div class="evidence-title">📹 车端视频黑匣子</div><div class="evidence-desc">720p 前后 60 秒</div></el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="evidence-card"><div class="evidence-title">📊 遥测曲线</div><div class="evidence-desc">1Hz 车速/油门/IMU</div></el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="evidence-card"><div class="evidence-title">🧭 玩家操控指令</div><div class="evidence-desc">带服务端时间戳</div></el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <el-dialog v-model="resolveVisible" title="事故定责" width="500px">
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="车辆SN">{{ currentAccident?.vehicleSn }}</el-form-item>
        <el-form-item label="定责结果">
          <el-radio-group v-model="resolveForm.responsibility">
            <el-radio value="player">玩家责任</el-radio>
            <el-radio value="device">设备责任</el-radio>
            <el-radio value="platform">平台责任</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="维修费用">
          <el-input-number v-model="resolveForm.repairCost" :min="0" />
        </el-form-item>
        <el-form-item label="定责备注">
          <el-input v-model="resolveForm.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResolve">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="repairDialogVisible" title="录入维修记录" width="500px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="车辆">
          <el-select v-model="repairForm.vehicleId" placeholder="选择车辆" style="width: 100%;">
            <el-option v-for="v in mockVehicles" :key="v.id" :label="`${v.sn} - ${v.model}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目">
          <el-input v-model="repairForm.item" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="repairForm.type">
            <el-radio value="routine">保养</el-radio>
            <el-radio value="repair">维修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="费用">
          <el-input-number v-model="repairForm.cost" :min="0" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="repairForm.operator" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="repairForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mockVehicles, mockMaintenanceRecords, mockAccidentRecords, findMaintenanceRecords, getStatusText } from '@/api/mock'

const router = useRouter()
const activeTab = ref('repair')

const repairList = reactive([])
mockVehicles.forEach(v => {
  const records = findMaintenanceRecords(v.id)
  records.forEach(r => repairList.push({ ...r, vehicleSn: v.sn }))
})
repairList.sort((a, b) => new Date(b.completedAt || '2000-01-01') - new Date(a.completedAt || '2000-01-01'))

const accidentList = reactive([])
mockVehicles.forEach(v => {
  const records = mockAccidentRecords.filter(r => r.vehicleId === v.id)
  records.forEach(r => accidentList.push({ ...r, vehicleSn: v.sn }))
})
accidentList.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))

const repairSearch = reactive({ sn: '', type: '', status: '', _v: 0 })
const accidentSearch = reactive({ sn: '', type: '', responsibility: '', _v: 0 })

const filteredRepair = computed(() => {
  void repairSearch._v
  return repairList.filter(r => {
    const matchSn = !repairSearch.sn || r.vehicleSn.includes(repairSearch.sn)
    const matchType = !repairSearch.type || r.type === repairSearch.type
    const matchStatus = repairSearch.status === '' || r.status === repairSearch.status
    return matchSn && matchType && matchStatus
  })
})

const accidentStats = computed(() => ({
  total: accidentList.length,
  pending: accidentList.filter(a => a.status === 0).length,
  player: accidentList.filter(a => a.responsibility === 'player').length,
  cost: accidentList.reduce((s, a) => s + (a.repairCost || 0), 0)
}))

const filteredAccident = computed(() => {
  void accidentSearch._v
  return accidentList.filter(r => {
    const matchSn = !accidentSearch.sn || r.vehicleSn.includes(accidentSearch.sn)
    const matchType = !accidentSearch.type || r.type === accidentSearch.type
    const matchResp = !accidentSearch.responsibility || r.responsibility === accidentSearch.responsibility
    return matchSn && matchType && matchResp
  })
})

const resetRepairSearch = () => { repairSearch.sn = ''; repairSearch.type = ''; repairSearch.status = '' }
const resetAccidentSearch = () => { accidentSearch.sn = ''; accidentSearch.type = ''; accidentSearch.responsibility = '' }

const responsibilityText = (r) => ({ player: '玩家', device: '设备', platform: '平台', unknown: '待定责' })[r] || r
const responsibilityType = (r) => ({ player: 'warning', device: 'danger', platform: 'info', unknown: '' })[r] || ''

const replayVisible = ref(false)
const resolveVisible = ref(false)
const currentAccident = ref(null)
const resolveForm = reactive({ responsibility: 'player', repairCost: 0, remark: '' })

const openReplay = (row) => {
  currentAccident.value = row
  replayVisible.value = true
}

const openResolve = (row) => {
  currentAccident.value = row
  resolveForm.responsibility = row.responsibility === 'unknown' ? 'player' : row.responsibility
  resolveForm.repairCost = row.repairCost || 0
  resolveForm.remark = ''
  resolveVisible.value = true
}

const submitResolve = () => {
  const row = currentAccident.value
  if (row) {
    row.responsibility = resolveForm.responsibility
    row.repairCost = resolveForm.repairCost
    row.status = 1
  }
  ElMessage.success('定责完成')
  resolveVisible.value = false
}

const repairDialogVisible = ref(false)
const repairForm = reactive({ vehicleId: null, item: '', type: 'repair', cost: 0, operator: '', remark: '' })

const openRepairDialog = () => {
  Object.assign(repairForm, { vehicleId: null, item: '', type: 'repair', cost: 0, operator: '', remark: '' })
  repairDialogVisible.value = true
}

const submitRepair = () => {
  if (!repairForm.vehicleId || !repairForm.item) {
    ElMessage.warning('请选择车辆并填写项目')
    return
  }
  const v = mockVehicles.find(x => x.id === repairForm.vehicleId)
  repairList.unshift({
    vehicleId: repairForm.vehicleId,
    vehicleSn: v?.sn,
    item: repairForm.item,
    type: repairForm.type,
    completedAt: new Date().toISOString().slice(0, 10),
    operator: repairForm.operator || 'admin',
    cost: repairForm.cost,
    remark: repairForm.remark,
    status: 1
  })
  ElMessage.success('维修记录已录入')
  repairDialogVisible.value = false
}

const goArchive = (id) => {
  router.push(`/vehicle/archive/${id}`)
}
</script>

<style scoped>
.evidence-card {
  text-align: center;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.evidence-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.evidence-desc {
  font-size: 12px;
  color: #909399;
}
</style>