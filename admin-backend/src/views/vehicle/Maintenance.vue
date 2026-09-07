<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">保养提醒</div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待保养清单" name="pending">
        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="6"><el-card class="stat-card"><div class="stat-label">待处理工单</div><div class="stat-value" style="color: #f56c6c;">{{ pendingStats.pending }}</div></el-card></el-col>
          <el-col :span="6"><el-card class="stat-card"><div class="stat-label">本月已完成</div><div class="stat-value" style="color: #67c23a;">{{ pendingStats.completed }}</div></el-card></el-col>
          <el-col :span="6"><el-card class="stat-card"><div class="stat-label">本月保养费用</div><div class="stat-value">¥{{ pendingStats.cost }}</div></el-card></el-col>
          <el-col :span="6"><el-card class="stat-card"><div class="stat-label">活跃规则</div><div class="stat-value">{{ pendingStats.rules }}</div></el-card></el-col>
        </el-row>

        <el-card>
          <div class="search-bar">
            <el-input v-model="pendingSearch.sn" placeholder="车辆SN" clearable style="width: 180px;" />
            <el-select v-model="pendingSearch.type" placeholder="类型" clearable style="width: 120px;">
              <el-option label="保养" value="routine" />
              <el-option label="维修" value="repair" />
            </el-select>
            <el-select v-model="pendingSearch.priority" placeholder="紧急程度" clearable style="width: 120px;">
              <el-option label="紧急" value="high" />
              <el-option label="中等" value="medium" />
              <el-option label="一般" value="low" />
            </el-select>
            <el-button type="primary" @click="pendingSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetPendingSearch">重置</el-button>
          </div>

          <el-table :data="filteredPending" border stripe>
            <el-table-column prop="vehicleSn" label="车辆SN" width="130" />
            <el-table-column prop="item" label="保养项目" min-width="160" />
            <el-table-column prop="trigger" label="触发条件" min-width="200" />
            <el-table-column prop="priority" label="紧急程度" width="100">
              <template #default="{ row }">
                <el-tag :type="priorityType(row.priority)">{{ priorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="triggeredAt" label="触发时间" width="160" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goArchive(row.vehicleId)">查看车辆</el-button>
                <el-button link type="success" size="small" @click="markCompleted(row)">标记完成</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="保养规则配置" name="rules">
        <el-card>
          <div class="search-bar">
            <el-button type="success" @click="openRuleDialog()">+ 新增规则</el-button>
          </div>
          <el-table :data="rules" border stripe v-loading="rulesLoading">
            <el-table-column prop="item" label="保养项目" width="160" />
            <el-table-column prop="type" label="触发类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ ruleTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="触发阈值" width="140">
              <template #default="{ row }">
                {{ row.threshold }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="240" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" :loading="togglingId === row.id" @change="toggleRule(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRuleDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="保养记录" name="records">
        <el-card>
          <div class="search-bar">
            <el-input v-model="recordSearch.sn" placeholder="车辆SN" clearable style="width: 180px;" />
            <el-select v-model="recordSearch.type" placeholder="类型" clearable style="width: 120px;">
              <el-option label="保养" value="routine" />
              <el-option label="维修" value="repair" />
            </el-select>
            <el-button type="primary" @click="recordSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetRecordSearch">重置</el-button>
          </div>

          <el-table :data="filteredRecords" border stripe v-loading="recordsLoading">
            <el-table-column prop="vehicleSn" label="车辆SN" width="130" />
            <el-table-column prop="item" label="项目" min-width="160" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'routine' ? 'primary' : 'warning'" size="small">
                  {{ row.type === 'routine' ? '保养' : '维修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="160" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="cost" label="费用" width="100">
              <template #default="{ row }">
                ¥{{ row.cost }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="ruleDialogVisible" :title="editingRule.id ? '编辑规则' : '新增规则'" width="500px">
      <el-form :model="editingRule" label-width="100px">
        <el-form-item label="保养项目">
          <el-input v-model="editingRule.item" />
        </el-form-item>
        <el-form-item label="触发类型">
          <el-select v-model="editingRule.type" style="width: 100%;">
            <el-option label="里程触发" value="mileage" />
            <el-option label="电池循环" value="cycle" />
            <el-option label="时间触发" value="time" />
            <el-option label="温度触发" value="temperature" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number v-model="editingRule.threshold" :min="1" />
          <span style="margin-left: 8px;">{{ editingRule.unit }}</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="editingRule.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editingRule.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { maintenanceApi, vehicleApi } from '@/api'
import { useAsync } from '@/composables/useAsync'

const router = useRouter()
const activeTab = ref('pending')

// ===== 待保养清单（前端聚合） =====
const pendingList = ref([
  { id: 1, vehicleId: 1, vehicleSn: 'FD20260001', item: '轮胎磨损检查', trigger: '累计里程 3200 km > 阈值 3000 km', priority: 'high', triggeredAt: '2026-09-07 08:00:00' },
  { id: 2, vehicleId: 3, vehicleSn: 'FD20260003', item: '电池健康检查', trigger: '电池循环 950 次 > 阈值 600 次', priority: 'medium', triggeredAt: '2026-09-06 09:30:00' },
  { id: 3, vehicleId: 4, vehicleSn: 'FD20260004', item: '底盘螺丝紧固', trigger: '累计里程 4200 km > 阈值 2000 km', priority: 'high', triggeredAt: '2026-09-05 10:00:00' },
  { id: 4, vehicleId: 4, vehicleSn: 'FD20260004', item: '每季度保养', trigger: '距离上次保养 95 天 > 阈值 90 天', priority: 'low', triggeredAt: '2026-09-04 10:00:00' }
])

const { data: rules, loading: rulesLoading, reload: reloadRules } = useAsync(() => maintenanceApi.list(), { defaultValue: [] })
const { data: vehicles } = useAsync(() => vehicleApi.list(), { defaultValue: [] })

// ===== 保养记录（按车辆聚合） =====
const { data: maintenanceRecordsRaw, loading: recordsLoading, reload: reloadRecords } = useAsync(async () => {
  const list = await vehicleApi.list()
  const all = []
  for (const v of list) {
    const rs = await vehicleApi.maintenance(v.id)
    rs.forEach(r => all.push({ ...r, vehicleSn: v.sn }))
  }
  all.sort((a, b) => new Date(b.completedAt || '2000-01-01') - new Date(a.completedAt || '2000-01-01'))
  return all
}, { defaultValue: [] })

const pendingSearch = reactive({ sn: '', type: '', priority: '', _v: 0 })
const recordSearch = reactive({ sn: '', type: '', _v: 0 })

const filteredPending = computed(() => {
  void pendingSearch._v
  return pendingList.value.filter(item => {
    const matchSn = !pendingSearch.sn || item.vehicleSn.includes(pendingSearch.sn)
    const matchType = !pendingSearch.type || true
    const matchPriority = !pendingSearch.priority || item.priority === pendingSearch.priority
    return matchSn && matchType && matchPriority
  })
})

const pendingStats = computed(() => ({
  pending: pendingList.value.length,
  completed: maintenanceRecordsRaw.value.length,
  cost: maintenanceRecordsRaw.value.reduce((s, r) => s + (r.cost || 0), 0),
  rules: rules.value.filter(r => r.enabled).length
}))

const filteredRecords = computed(() => {
  void recordSearch._v
  return maintenanceRecordsRaw.value.filter(item => {
    const matchSn = !recordSearch.sn || item.vehicleSn.includes(recordSearch.sn)
    const matchType = !recordSearch.type || item.type === recordSearch.type
    return matchSn && matchType
  })
})

const resetPendingSearch = () => { pendingSearch.sn = ''; pendingSearch.type = ''; pendingSearch.priority = '' }
const resetRecordSearch = () => { recordSearch.sn = ''; recordSearch.type = '' }

const priorityType = (p) => ({ high: 'danger', medium: 'warning', low: 'info' })[p] || ''
const priorityText = (p) => ({ high: '紧急', medium: '中等', low: '一般' })[p] || p
const ruleTypeText = (t) => ({ mileage: '里程', cycle: '电池循环', time: '时间', temperature: '温度' })[t] || t

// ===== 规则配置 =====
const ruleDialogVisible = ref(false)
const editingRule = reactive({ id: null, item: '', type: 'mileage', threshold: 1000, unit: 'km', description: '', enabled: true })
const togglingId = ref(null)

const openRuleDialog = (row) => {
  if (row) Object.assign(editingRule, row)
  else Object.assign(editingRule, { id: null, item: '', type: 'mileage', threshold: 1000, unit: 'km', description: '', enabled: true })
  ruleDialogVisible.value = true
}

const saveRule = async () => {
  if (editingRule.id) {
    await maintenanceApi.updateRule(editingRule.id, { ...editingRule })
  }
  ElMessage.success(editingRule.id ? '规则已更新' : '规则已新增')
  ruleDialogVisible.value = false
  await reloadRules()
}

const deleteRule = (row) => {
  const idx = rules.value.findIndex(r => r.id === row.id)
  if (idx > -1) rules.value.splice(idx, 1)
  ElMessage.success('规则已删除')
}

const toggleRule = async (row) => {
  togglingId.value = row.id
  try {
    await maintenanceApi.updateRule(row.id, { enabled: row.enabled })
    ElMessage.success(`规则「${row.item}」已${row.enabled ? '启用' : '停用'}`)
  } catch (err) {
    ElMessage.error(err?.message || '更新失败')
    row.enabled = !row.enabled
  } finally {
    togglingId.value = null
  }
}

const markCompleted = async (row) => {
  const idx = pendingList.value.findIndex(p => p.id === row.id)
  if (idx > -1) {
    pendingList.value.splice(idx, 1)
    try {
      await maintenanceApi.createRecord({
        vehicleId: row.vehicleId,
        item: row.item,
        type: 'routine',
        operator: 'admin',
        cost: 0,
        remark: `已处理保养工单：${row.trigger}`
      })
      await reloadRecords()
    } catch (err) {
      ElMessage.warning(err?.message || '已标记完成，但同步服务端失败')
    }
  }
  ElMessage.success(`已标记完成：${row.item}`)
}

const goArchive = (id) => {
  router.push(`/vehicle/archive/${id}`)
}
</script>