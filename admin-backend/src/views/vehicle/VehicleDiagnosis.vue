<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="page-title">远程诊断与控制</div>
        <el-select v-model="selectedVehicleId" placeholder="选择车辆" style="width: 240px;" @change="onVehicleChange">
          <el-option
            v-for="v in vehicles"
            :key="v.id"
            :label="`${v.sn} - ${v.model}`"
            :value="v.id"
          />
        </el-select>
        <el-tag :type="statusType(vehicle?.status)">{{ getStatusText('vehicle', vehicle?.status) }}</el-tag>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6" v-for="item in telemetryCards" :key="item.label">
        <el-card class="stat-card" :body-style="{ padding: '16px' }">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :style="{ color: item.color, fontSize: '26px' }">{{ item.value }}</div>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">{{ item.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>信号质量</span>
          </template>
          <div v-if="diagnosis" class="signal-panel">
            <div class="signal-item">
              <span class="signal-label">RSRP</span>
              <el-progress :percentage="signalScore(diagnosis.signalRsrp)" :color="signalColor(diagnosis.signalRsrp)" :stroke-width="16" />
              <span class="signal-value">{{ diagnosis.signalRsrp }} dBm</span>
            </div>
            <div class="signal-item">
              <span class="signal-label">网络抖动</span>
              <el-progress :percentage="jitterScore(diagnosis.signalJitter)" :color="jitterColor(diagnosis.signalJitter)" :stroke-width="16" />
              <span class="signal-value">{{ diagnosis.signalJitter }} ms</span>
            </div>
            <div class="signal-item">
              <span class="signal-label">GPS</span>
              <el-tag :type="diagnosis.gpsStatus ? 'success' : 'danger'">
                {{ diagnosis.gpsStatus ? '正常' : '异常' }}
              </el-tag>
            </div>
            <div class="signal-item">
              <span class="signal-label">IMU</span>
              <el-tag :type="diagnosis.imuStatus ? 'success' : 'danger'">
                {{ diagnosis.imuStatus ? '正常' : '异常' }}
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无诊断数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>故障码</span>
          </template>
          <div v-if="diagnosis?.faultCodes?.length">
            <el-alert
              v-for="code in diagnosis.faultCodes"
              :key="code"
              :title="faultCodeText(code)"
              type="error"
              :closable="false"
              show-icon
              style="margin-bottom: 8px;"
            />
          </div>
          <el-empty v-else description="当前无故障码" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>远程控制</span>
          </template>
          <div class="control-panel">
            <div class="control-row">
              <el-button type="primary" size="large" :icon="Lock" :loading="cmdLoading" @click="sendCommand('lock')">远程锁车</el-button>
              <el-button type="success" size="large" :icon="Unlock" :loading="cmdLoading" @click="sendCommand('unlock')">远程解锁</el-button>
              <el-button type="warning" size="large" :icon="Lightning" :loading="cmdLoading" @click="sendCommand('flash')">灯闪找车</el-button>
            </div>
            <div class="control-row">
              <el-button type="danger" size="large" plain :icon="Warning" :loading="cmdLoading" @click="sendCommand('emergency_stop')">紧急制动</el-button>
              <el-button size="large" :icon="RefreshRight" :loading="diagLoading" @click="refreshDiagnosis">刷新诊断</el-button>
            </div>
            <el-alert
              title="安全提示"
              type="info"
              :closable="false"
              description="紧急制动将立即切断车辆动力并开启双闪，请仅在紧急情况下使用。"
              style="margin-top: 16px;"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>控制操作日志</span>
          </template>
          <el-timeline v-loading="logLoading">
            <el-timeline-item
              v-for="log in controlLogs"
              :key="log.id"
              :type="log.result === 'success' ? 'success' : 'danger'"
              :timestamp="log.createdAt"
            >
              <div style="font-weight: 500;">{{ controlTypeText(log.type) }}</div>
              <div style="font-size: 12px; color: #909399;">{{ log.message }}</div>
              <div style="font-size: 12px; color: #909399;">操作人：{{ log.operator }}</div>
            </el-timeline-item>
            <el-empty v-if="!controlLogs.length" description="暂无操作日志" />
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>历史诊断数据</span>
      </template>
      <el-table :data="historyData" border stripe size="small">
        <el-table-column prop="reportedAt" label="上报时间" width="160" />
        <el-table-column prop="soc" label="SOC%" width="90" />
        <el-table-column prop="voltage" label="电压(V)" width="100" />
        <el-table-column prop="current" label="电流(A)" width="100" />
        <el-table-column prop="temperature" label="温度(°C)" width="100" />
        <el-table-column prop="signalRsrp" label="RSRP" width="100" />
        <el-table-column prop="signalJitter" label="抖动(ms)" width="100" />
        <el-table-column prop="faultCodes" label="故障码" min-width="160">
          <template #default="{ row }">
            <el-tag v-if="row.faultCodes.length" type="danger" size="small">{{ row.faultCodes.join(', ') }}</el-tag>
            <span v-else style="color: #909399;">无</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Unlock, Lightning, Warning, RefreshRight } from '@element-plus/icons-vue'
import { vehicleApi } from '@/api'
import { getStatusText } from '@/api/mock'

const route = useRoute()
const router = useRouter()

// ===== 全局数据 =====
const vehicles = ref([])
const allDiagnosis = ref([])
const allBatteries = ref([])
const allLogs = ref({})
const cmdLoading = ref(false)
const diagLoading = ref(false)
const logLoading = ref(false)

const selectedVehicleId = ref(Number(route.params.id) || null)

const vehicle = computed(() => vehicles.value.find(v => v.id === selectedVehicleId.value))
const battery = computed(() => allBatteries.value.find(b => b.vehicleId === selectedVehicleId.value))
const diagnosis = computed(() => allDiagnosis.value.find(d => d.vehicleId === selectedVehicleId.value))
const controlLogs = computed(() => allLogs.value[selectedVehicleId.value] || [])

const telemetryCards = computed(() => ({
  SOC: { value: diagnosis.value ? `${diagnosis.value.soc}%` : '--', sub: `电压 ${diagnosis.value?.voltage || '--'} V`, color: socColor(diagnosis.value?.soc) },
  电流: { value: diagnosis.value ? `${diagnosis.value.current} A` : '--', sub: diagnosis.value?.current > 0 ? '放电中' : '待机', color: '#409eff' },
  温度: { value: diagnosis.value ? `${diagnosis.value.temperature} °C` : '--', sub: diagnosis.value?.temperature > 40 ? '偏高' : '正常', color: tempColor(diagnosis.value?.temperature) },
  累计里程: { value: vehicle.value ? `${vehicle.value.totalMileage} km` : '--', sub: `电池 SOH ${battery.value?.soh || '--'}%`, color: '#67c23a' }
}))

const historyData = computed(() => {
  const d = diagnosis.value
  if (!d) return []
  return [
    { ...d },
    { ...d, reportedAt: '2026-09-06 10:00:00', soc: d.soc - 12, voltage: d.voltage - 0.8, current: 8.5, temperature: d.temperature - 2, signalRsrp: d.signalRsrp - 5, signalJitter: d.signalJitter + 4, faultCodes: [] },
    { ...d, reportedAt: '2026-09-05 10:00:00', soc: d.soc - 25, voltage: d.voltage - 1.5, current: 0, temperature: d.temperature - 4, signalRsrp: d.signalRsrp - 2, signalJitter: d.signalJitter + 2, faultCodes: [] }
  ]
})

const statusType = (status) => ({ 0: 'success', 1: 'primary', 2: 'warning', 3: 'danger', 4: 'info', 5: '' })[status]
const socColor = (soc) => soc === undefined ? '#909399' : soc >= 50 ? '#67c23a' : soc >= 20 ? '#e6a23c' : '#f56c6c'
const tempColor = (temp) => temp === undefined ? '#909399' : temp < 45 ? '#67c23a' : temp < 55 ? '#e6a23c' : '#f56c6c'
const signalScore = (rsrp) => rsrp >= -80 ? 100 : rsrp >= -95 ? 70 : rsrp >= -110 ? 40 : 10
const signalColor = (rsrp) => rsrp >= -80 ? '#67c23a' : rsrp >= -95 ? '#e6a23c' : '#f56c6c'
const jitterScore = (j) => j <= 20 ? 100 : j <= 50 ? 60 : 30
const jitterColor = (j) => j <= 20 ? '#67c23a' : j <= 50 ? '#e6a23c' : '#f56c6c'
const faultCodeText = (code) => ({
  BMS_001: 'BMS_001：电池管理系统通信异常',
  BMS_002: 'BMS_002：电池欠压保护',
  NET_001: 'NET_001：车端网络模块离线',
  MOT_001: 'MOT_001：电机过热保护',
  STE_001: 'STE_001：转向舵机无响应'
})[code] || code
const controlTypeText = (type) => ({ lock: '远程锁车', unlock: '远程解锁', flash: '灯闪找车', emergency_stop: '紧急制动' })[type] || type

const onVehicleChange = (id) => {
  router.replace(`/vehicle/diagnosis/${id}`)
  ensureLogsFor(id)
}

const sendCommand = async (type) => {
  cmdLoading.value = true
  try {
    const res = await vehicleApi.sendCommand(selectedVehicleId.value, type)
    ElMessage.success(res?.message || `指令已发送：${controlTypeText(type)}`)
    await ensureLogsFor(selectedVehicleId.value)
  } catch (err) {
    ElMessage.error(err?.message || '指令发送失败')
  } finally {
    cmdLoading.value = false
  }
}

const refreshDiagnosis = async () => {
  diagLoading.value = true
  try {
    const list = await Promise.all(vehicles.value.map(v => vehicleApi.diagnosis(v.id)))
    allDiagnosis.value = list.filter(Boolean)
    ElMessage.success('诊断数据已刷新')
  } finally {
    diagLoading.value = false
  }
}

const ensureLogsFor = async (id) => {
  if (!id) return
  if (allLogs.value[id]) return
  logLoading.value = true
  try {
    allLogs.value[id] = await vehicleApi.controlLogs(id)
  } finally {
    logLoading.value = false
  }
}

// 首次加载
const init = async () => {
  vehicles.value = await vehicleApi.list()
  if (!selectedVehicleId.value && vehicles.value.length) {
    selectedVehicleId.value = vehicles.value[0].id
    router.replace(`/vehicle/diagnosis/${selectedVehicleId.value}`)
  }
  await Promise.all([
    refreshDiagnosis(),
    (async () => {
      allBatteries.value = await (await import('@/api')).batteryApi.list()
    })(),
    ensureLogsFor(selectedVehicleId.value)
  ])
}
init()
</script>

<style scoped>
.signal-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.signal-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.signal-label {
  width: 70px;
  font-size: 14px;
  color: #606266;
}
.signal-value {
  width: 90px;
  text-align: right;
  font-size: 14px;
  color: #303133;
}
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.control-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>