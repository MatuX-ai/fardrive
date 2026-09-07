<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">车辆资产管理</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">车辆总数</div>
          <div class="stat-value">{{ stats.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">驾驶中</div>
          <div class="stat-value" style="color: #409eff;">{{ stats.driving }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">故障/离线</div>
          <div class="stat-value" style="color: #f56c6c;">{{ stats.fault + stats.offline }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">今日营收</div>
          <div class="stat-value">¥{{ stats.todayRevenue }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="search-bar">
        <el-button type="success" :icon="Plus" @click="goPublish">+ 新车发布</el-button>
        <el-divider direction="vertical" />
        <el-input v-model="search.sn" placeholder="车辆SN" clearable style="width: 160px;" />
        <el-select v-model="search.siteId" placeholder="所属场地" clearable style="width: 160px;">
          <el-option v-for="site in sites" :key="site.id" :label="site.name" :value="site.id" />
        </el-select>
        <el-select v-model="search.franchiseeId" placeholder="加盟商" clearable style="width: 180px;">
          <el-option v-for="f in franchisees" :key="f.id" :label="f.companyName" :value="f.id" />
        </el-select>
        <el-select v-model="search.gearLevel" placeholder="底盘档位" clearable style="width: 140px;">
          <el-option label="1/16 竞速版" value="1/16 竞速版" />
          <el-option label="1/10 全地形版" value="1/10 全地形版" />
          <el-option label="1/8 硬核越野版" value="1/8 硬核越野版" />
        </el-select>
        <el-select v-model="search.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="空闲" :value="0" />
          <el-option label="驾驶中" :value="1" />
          <el-option label="充电" :value="2" />
          <el-option label="故障" :value="3" />
          <el-option label="离线" :value="4" />
          <el-option label="退役" :value="5" />
        </el-select>
        <el-date-picker
          v-model="search.deployRange"
          type="daterange"
          range-separator="至"
          start-placeholder="部署开始"
          end-placeholder="部署结束"
          value-format="YYYY-MM-DD"
          style="width: 240px;"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="pagedList" border stripe v-loading="loading">
        <el-table-column prop="sn" label="车辆SN" width="130" />
        <el-table-column prop="model" label="车型" width="120" />
        <el-table-column prop="gearLevel" label="底盘档位" width="120" />
        <el-table-column label="所属场地" min-width="160">
          <template #default="{ row }">
            <div>{{ row._siteName }}</div>
            <div style="font-size: 12px; color: #909399;">{{ row._franchiseeName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="信号认证" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="signalType(row.signalLevel)">{{ row.signalLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电池SOH" width="110">
          <template #default="{ row }">
            <el-progress :percentage="row._batterySoh" :color="sohColor(row._batterySoh)" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="totalMileage" label="累计里程(km)" width="120" />
        <el-table-column label="在线率" width="100">
          <template #default="{ row }">
            <div>7天: {{ (row.onlineRate7d * 100).toFixed(0) }}%</div>
            <div style="font-size: 12px; color: #909399;">30天: {{ (row.onlineRate30d * 100).toFixed(0) }}%</div>
          </template>
        </el-table-column>
        <el-table-column prop="lastOnlineAt" label="最近在线" width="150" />
        <el-table-column label="运营数据" width="130">
          <template #default="{ row }">
            <div>{{ row.orderCount }} 单</div>
            <div style="font-size: 12px; color: #909399;">¥{{ row.totalRevenue }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" fixed="right">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ getStatusText('vehicle', row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="goArchive(row)">档案</el-button>
            <el-button link type="primary" size="small" @click="goDiagnosis(row)">诊断</el-button>
            <el-dropdown size="small" @command="(cmd) => handleCommand(cmd, row)">
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="lock">远程锁车</el-dropdown-item>
                  <el-dropdown-item command="unlock">远程解锁</el-dropdown-item>
                  <el-dropdown-item command="flash">灯闪找车</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="filteredList.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="车辆详情" width="700px">
      <el-descriptions :column="2" border v-if="currentVehicle">
        <el-descriptions-item label="车辆SN">{{ currentVehicle.sn }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ currentVehicle.model }}</el-descriptions-item>
        <el-descriptions-item label="底盘档位">{{ currentVehicle.gearLevel }}</el-descriptions-item>
        <el-descriptions-item label="固件版本">{{ currentVehicle.firmwareVersion }}</el-descriptions-item>
        <el-descriptions-item label="所属场地">{{ currentVehicle._siteName }}</el-descriptions-item>
        <el-descriptions-item label="加盟商">{{ currentVehicle._franchiseeName }}</el-descriptions-item>
        <el-descriptions-item label="信号认证">{{ currentVehicle.signalLevel }} 级</el-descriptions-item>
        <el-descriptions-item label="累计里程">{{ currentVehicle.totalMileage }} km</el-descriptions-item>
        <el-descriptions-item label="电池SOH">{{ currentVehicle._batterySoh }}%</el-descriptions-item>
        <el-descriptions-item label="7天在线率">{{ (currentVehicle.onlineRate7d * 100).toFixed(0) }}%</el-descriptions-item>
        <el-descriptions-item label="30天在线率">{{ (currentVehicle.onlineRate30d * 100).toFixed(0) }}%</el-descriptions-item>
        <el-descriptions-item label="最近在线">{{ currentVehicle.lastOnlineAt }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ currentVehicle.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="累计营收">¥{{ currentVehicle.totalRevenue }}</el-descriptions-item>
        <el-descriptions-item label="部署日期">{{ currentVehicle.deployedAt }}</el-descriptions-item>
        <el-descriptions-item label="采购日期">{{ currentVehicle.procuredAt }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="goArchive(currentVehicle); detailVisible = false">查看完整档案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Plus } from '@element-plus/icons-vue'
import { vehicleApi, siteApi, franchiseeApi, batteryApi, orderApi } from '@/api'
import { useAsync } from '@/composables/useAsync'
import { getStatusText } from '@/api/mock'

const router = useRouter()

// ===== 数据加载（HTTP）） =====
const sites = ref([])
const franchisees = ref([])
const { loading, data: vehicles, reload } = useAsync(() => vehicleApi.list(), { defaultValue: [] })
const { data: batteries } = useAsync(() => batteryApi.list(), { defaultValue: [] })
const { data: orders } = useAsync(() => orderApi.list(), { defaultValue: [] })

const loadDeps = async () => {
  const [s, f] = await Promise.all([siteApi.list(), franchiseeApi.list()])
  sites.value = s
  franchisees.value = f
}
loadDeps()

const enrichedVehicles = computed(() => {
  const today = '2026-09-07'
  return vehicles.value.map(v => {
    const site = sites.value.find(s => s.id === v.siteId)
    const franchisee = franchisees.value.find(f => f.id === v.franchiseeId)
    const battery = batteries.value.find(b => b.vehicleId === v.id)
    return {
      ...v,
      _siteName: site?.name || '-',
      _franchiseeName: franchisee?.companyName || '-',
      _batterySoh: battery?.soh || 0,
      _todayAmount: orders.value.filter(o => o.vehicleId === v.id && o.createdAt.startsWith(today)).reduce((s, o) => s + o.amount, 0)
    }
  })
})

const stats = computed(() => ({
  total: vehicles.value.length,
  driving: vehicles.value.filter(v => v.status === 1).length,
  fault: vehicles.value.filter(v => v.status === 3).length,
  offline: vehicles.value.filter(v => v.status === 4).length,
  todayRevenue: orders.value.filter(o => o.createdAt.startsWith('2026-09-07')).reduce((s, o) => s + o.amount, 0)
}))

// ===== 查询与分页（前端过滤）） =====
const search = reactive({
  sn: '',
  siteId: '',
  franchiseeId: '',
  gearLevel: '',
  status: '',
  deployRange: []
})

const page = reactive({ current: 1, size: 10 })

const filteredList = computed(() => {
  return enrichedVehicles.value.filter(item => {
    const matchSn = !search.sn || item.sn.includes(search.sn)
    const matchSite = search.siteId === '' || item.siteId === search.siteId
    const matchFranchisee = search.franchiseeId === '' || item.franchiseeId === search.franchiseeId
    const matchGear = !search.gearLevel || item.gearLevel === search.gearLevel
    const matchStatus = search.status === '' || item.status === search.status
    const matchDeploy = !search.deployRange?.length ||
      (item.deployedAt >= search.deployRange[0] && item.deployedAt <= search.deployRange[1])
    return matchSn && matchSite && matchFranchisee && matchGear && matchStatus && matchDeploy
  })
})

const pagedList = computed(() => {
  const start = (page.current - 1) * page.size
  return filteredList.value.slice(start, start + page.size)
})

// ===== 操作 =====
const detailVisible = ref(false)
const currentVehicle = ref(null)

const statusType = (status) => ({ 0: 'success', 1: 'primary', 2: 'warning', 3: 'danger', 4: 'info', 5: '' })[status]
const signalType = (level) => ({ S: 'success', A: 'primary', B: 'warning', F: 'danger' })[level] || 'info'
const sohColor = (soh) => soh >= 90 ? '#67c23a' : soh >= 80 ? '#e6a23c' : '#f56c6c'

const showDetail = (row) => { currentVehicle.value = row; detailVisible.value = true }

const goArchive = (row) => router.push(`/vehicle/archive/${row.id}`)
const goDiagnosis = (row) => router.push(`/vehicle/diagnosis/${row.id}`)
const goPublish = () => router.push('/vehicle/publish')

const handleCommand = async (cmd, row) => {
  const map = { lock: 'lock', unlock: 'unlock', flash: 'flash' }
  try {
    await vehicleApi.sendCommand(row.id, map[cmd])
    ElMessage.success(`${cmd === 'lock' ? '远程锁车' : cmd === 'unlock' ? '远程解锁' : '灯闪找车'}指令已发送：${row.sn}`)
  } catch (err) {
    ElMessage.error(err?.message || '指令发送失败')
  }
}

const handleSearch = () => { page.current = 1 }
const resetSearch = () => {
  search.sn = ''
  search.siteId = ''
  search.franchiseeId = ''
  search.gearLevel = ''
  search.status = ''
  search.deployRange = []
  page.current = 1
}
</script>