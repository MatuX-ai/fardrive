<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button @click="goBack">返回</el-button>
        <div class="page-title">车辆档案：{{ vehicle?.sn }}</div>
        <el-tag :type="statusType(vehicle?.status)">{{ getStatusText('vehicle', vehicle?.status) }}</el-tag>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="4" v-for="stat in statCards" :key="stat.label">
        <el-card class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-bottom: 16px;">
      <template #header>
        <span>基础信息</span>
      </template>
      <el-descriptions :column="4" border v-loading="loading">
        <el-descriptions-item label="车辆SN">{{ vehicle?.sn }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ vehicle?.model }}</el-descriptions-item>
        <el-descriptions-item label="底盘档位">{{ vehicle?.gearLevel }}</el-descriptions-item>
        <el-descriptions-item label="固件版本">{{ vehicle?.firmwareVersion }}</el-descriptions-item>
        <el-descriptions-item label="所属场地">{{ site?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="加盟商">{{ franchisee?.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="信号认证">{{ vehicle?.signalLevel }} 级</el-descriptions-item>
        <el-descriptions-item label="电池SN">{{ battery?.sn || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>全生命周期</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in lifecycleItems"
              :key="index"
              :type="item.type"
              :timestamp="item.time"
            >
              {{ item.title }}
              <div style="font-size: 12px; color: #909399; margin-top: 4px;">{{ item.desc }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>实时诊断快照</span>
          </template>
          <el-descriptions :column="2" border v-if="diagnosis">
            <el-descriptions-item label="SOC">{{ diagnosis.soc }}%</el-descriptions-item>
            <el-descriptions-item label="电压">{{ diagnosis.voltage }} V</el-descriptions-item>
            <el-descriptions-item label="电流">{{ diagnosis.current }} A</el-descriptions-item>
            <el-descriptions-item label="温度">{{ diagnosis.temperature }} °C</el-descriptions-item>
            <el-descriptions-item label="RSRP">{{ diagnosis.signalRsrp }} dBm</el-descriptions-item>
            <el-descriptions-item label="抖动">{{ diagnosis.signalJitter }} ms</el-descriptions-item>
            <el-descriptions-item label="GPS">{{ diagnosis.gpsStatus ? '正常' : '异常' }}</el-descriptions-item>
            <el-descriptions-item label="IMU">{{ diagnosis.imuStatus ? '正常' : '异常' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无诊断数据" />
          <div v-if="diagnosis?.faultCodes?.length" style="margin-top: 12px;">
            <el-alert
              v-for="code in diagnosis.faultCodes"
              :key="code"
              :title="`故障码：${code}`"
              type="error"
              :closable="false"
              style="margin-bottom: 8px;"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-bottom: 16px;">
      <template #header>
        <span>标准件清单</span>
      </template>
      <el-table :data="standardParts" border stripe size="small" v-loading="partsLoading">
        <el-table-column prop="name" label="名称" width="140" />
        <el-table-column prop="sn" label="SN" width="140" />
        <el-table-column prop="model" label="型号" width="140" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            {{ categoryText(row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="installedAt" label="安装日期" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="partStatusType(row.status)">{{ getStatusText('standardPart', row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>保养/维修记录</span>
          </template>
          <el-table :data="maintenanceRecords" border stripe size="small" v-loading="maintLoading">
            <el-table-column prop="item" label="项目" min-width="140" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'routine' ? 'primary' : 'warning'" size="small">
                  {{ row.type === 'routine' ? '保养' : '维修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="120" />
            <el-table-column prop="cost" label="费用" width="90">
              <template #default="{ row }">
                {{ row.cost ? `¥${row.cost}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ getStatusText('maintenance', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>事故记录</span>
          </template>
          <el-table :data="accidentRecords" border stripe size="small" v-loading="accLoading">
            <el-table-column prop="type" label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="row.type === 'rollover' ? 'danger' : 'warning'" size="small">
                  {{ row.type === 'rollover' ? '翻车' : '碰撞' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occurredAt" label="发生时间" width="140" />
            <el-table-column prop="responsibility" label="定责" width="90">
              <template #default="{ row }">
                {{ responsibilityText(row.responsibility) }}
              </template>
            </el-table-column>
            <el-table-column prop="repairCost" label="维修费用" width="90">
              <template #default="{ row }">
                {{ row.repairCost ? `¥${row.repairCost}` : '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>最近订单</span>
      </template>
      <el-table :data="orders" border stripe size="small" v-loading="orderLoading">
        <el-table-column prop="id" label="订单ID" width="90" />
        <el-table-column prop="createdAt" label="下单时间" width="160" />
        <el-table-column prop="durationMin" label="时长(分)" width="90" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已完成' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { vehicleApi, siteApi, franchiseeApi, batteryApi } from '@/api'
import { getStatusText } from '@/api/mock'

const route = useRoute()
const router = useRouter()
const vehicleId = computed(() => Number(route.params.id))

const vehicle = ref(null)
const site = ref(null)
const franchisee = ref(null)
const battery = ref(null)
const diagnosis = ref(null)
const standardParts = ref([])
const maintenanceRecords = ref([])
const accidentRecords = ref([])
const orders = ref([])

const loading = ref(false)
const partsLoading = ref(false)
const maintLoading = ref(false)
const accLoading = ref(false)
const orderLoading = ref(false)

const loadVehicle = async (id) => {
  loading.value = true
  try {
    const v = await vehicleApi.detail(id)
    vehicle.value = v
    const [s, f, b, d] = await Promise.all([
      siteApi.list(),
      franchiseeApi.list(),
      batteryApi.list(),
      vehicleApi.diagnosis(id)
    ])
    site.value = s.find(x => x.id === v.siteId) || null
    franchisee.value = f.find(x => x.id === v.franchiseeId) || null
    battery.value = b.find(x => x.vehicleId === id) || null
    diagnosis.value = d
  } finally {
    loading.value = false
  }
}

const loadRelations = async (id) => {
  partsLoading.value = true
  maintLoading.value = true
  accLoading.value = true
  orderLoading.value = true
  try {
    const [p, m, a, o] = await Promise.all([
      vehicleApi.standardParts(id),
      vehicleApi.maintenance(id),
      vehicleApi.accidents(id),
      vehicleApi.orders(id)
    ])
    standardParts.value = p
    maintenanceRecords.value = m
    accidentRecords.value = a
    orders.value = o
  } finally {
    partsLoading.value = false
    maintLoading.value = false
    accLoading.value = false
    orderLoading.value = false
  }
}

watch(vehicleId, (id) => {
  if (id) {
    loadVehicle(id)
    loadRelations(id)
  }
}, { immediate: true })

const statCards = computed(() => {
  const v = vehicle.value
  if (!v) return []
  return [
    { label: '累计里程', value: `${v.totalMileage} km`, color: '#409eff' },
    { label: '累计订单', value: `${v.orderCount} 单`, color: '#67c23a' },
    { label: '累计营收', value: `¥${v.totalRevenue}`, color: '#e6a23c' },
    { label: '累计驾驶', value: `${Math.round(v.totalDrivingMinutes / 60)} h`, color: '#909399' },
    { label: '维修次数', value: `${v.repairCount}`, color: '#f56c6c' },
    { label: '事故次数', value: `${v.accidentCount}`, color: '#f56c6c' }
  ]
})

const lifecycleItems = computed(() => {
  const v = vehicle.value
  if (!v) return []
  return [
    { title: '采购入库', time: v.procuredAt, desc: '车辆完成采购并录入资产系统', type: 'primary' },
    { title: '标准件装配', time: v.procuredAt, desc: '中控盒、电池、摄像头、底盘完成装配', type: 'success' },
    { title: '场地认证', time: v.certifiedAt, desc: '通过平台标准件与场地实测认证', type: 'warning' },
    { title: '现场部署', time: v.deployedAt, desc: `部署至 ${ site.value?.name || '-' }`, type: 'primary' },
    { title: '持续运营', time: v.lastOnlineAt, desc: `最近在线，累计运营 ${v.totalMileage} km`, type: v.status === 5 ? 'info' : 'success' }
  ]
})

const statusType = (status) => ({ 0: 'success', 1: 'primary', 2: 'warning', 3: 'danger', 4: 'info', 5: '' })[status]
const partStatusType = (status) => ({ 1: 'success', 2: 'warning', 3: 'info' })[status]
const categoryText = (cat) => ({ control: '中控', battery: '电池', camera: '摄像头', chassis: '底盘' })[cat] || cat
const responsibilityText = (r) => ({ player: '玩家', device: '设备', platform: '平台', unknown: '待定责' })[r] || r

const goBack = () => router.back()
</script>