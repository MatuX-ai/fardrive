<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">易耗件库存</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">易耗件品类</div><div class="stat-value">{{ stats.total }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">库存预警</div><div class="stat-value" style="color: #f56c6c;">{{ stats.alertCount }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">库存总价值</div><div class="stat-value">¥{{ stats.stockValue }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="stat-label">供应商数</div><div class="stat-value">{{ stats.supplier }}</div></el-card></el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="易耗件列表" name="list">
        <el-card>
          <div class="search-bar">
            <el-input v-model="search.name" placeholder="名称/编码" clearable style="width: 200px;" />
            <el-select v-model="search.category" placeholder="分类" clearable style="width: 120px;">
              <el-option label="电池" value="battery" />
              <el-option label="轮胎" value="tire" />
              <el-option label="舵机" value="servo" />
              <el-option label="电调" value="esc" />
              <el-option label="摄像头" value="camera" />
              <el-option label="排线" value="cable" />
            </el-select>
            <el-select v-model="search.stockStatus" placeholder="库存状态" clearable style="width: 120px;">
              <el-option label="充足" value="ok" />
              <el-option label="预警" value="warning" />
              <el-option label="缺货" value="danger" />
            </el-select>
            <el-button type="primary" @click="search._v = Date.now()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <el-button type="success" @click="openConsumableDialog()">+ 新增易耗件</el-button>
            <el-button type="warning" @click="restockDialog = true">批量补货</el-button>
          </div>

          <el-table :data="filteredList" border stripe>
            <el-table-column prop="code" label="编码" width="130" />
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column label="分类" width="100">
              <template #default="{ row }">
                {{ categoryText(row.category) }}
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.price }} / {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column label="库存" width="180">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 600;">{{ row.stock }} {{ row.unit }}</span>
                  <el-tag size="small" :type="stockType(row)">{{ stockText(row) }}</el-tag>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(row.stock / row.safeStock * 50))"
                  :color="stockColor(row)"
                  :stroke-width="4"
                  :show-text="false"
                  style="margin-top: 4px;"
                />
              </template>
            </el-table-column>
            <el-table-column prop="safeStock" label="安全库存" width="90" />
            <el-table-column prop="supplier" label="供应商" width="120" />
            <el-table-column prop="compatibleModel" label="适配车型" width="120">
              <template #default="{ row }">
                {{ compatText(row.compatibleModel) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openConsumableDialog(row)">编辑</el-button>
                <el-button link type="success" size="small" @click="quickRestock(row)">入库 +10</el-button>
                <el-button link type="danger" size="small" @click="openConsumableOutbound(row)">出库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="库存预警" name="alerts">
        <el-card>
          <el-table :data="alerts" border stripe>
            <el-table-column prop="consumableCode" label="编码" width="130" />
            <el-table-column prop="consumableName" label="名称" min-width="180" />
            <el-table-column label="当前库存" width="100">
              <template #default="{ row }">
                {{ row.currentStock }}
              </template>
            </el-table-column>
            <el-table-column prop="safeStock" label="安全库存" width="100" />
            <el-table-column label="缺口" width="100">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.safeStock - row.currentStock }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="row.severity === 3 ? 'danger' : 'warning'">
                  {{ row.severity === 3 ? '严重' : '警告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="预警时间" width="160" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="generatePO(row)">生成采购单</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑易耗件' : '新增易耗件'" width="560px">
      <el-form :model="editing" label-width="100px">
        <el-form-item label="编码">
          <el-input v-model="editing.code" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="editing.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editing.category" style="width: 100%;">
            <el-option label="电池" value="battery" />
            <el-option label="轮胎" value="tire" />
            <el-option label="舵机" value="servo" />
            <el-option label="电调" value="esc" />
            <el-option label="摄像头" value="camera" />
            <el-option label="排线" value="cable" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number v-model="editing.price" :min="0" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="editing.unit" placeholder="如：块、只、根" />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input-number v-model="editing.stock" :min="0" />
        </el-form-item>
        <el-form-item label="安全库存">
          <el-input-number v-model="editing.safeStock" :min="0" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="editing.supplier" />
        </el-form-item>
        <el-form-item label="适配车型">
          <el-select v-model="editing.compatibleModel" style="width: 100%;">
            <el-option v-for="m in mockVehicleModels" :key="m.code" :label="m.name" :value="m.code" />
            <el-option label="通用" value="ALL" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConsumable">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="restockDialog" title="批量补货" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择易耗件">
          <el-select v-model="restockForm.consumableId" placeholder="选择易耗件" style="width: 100%;">
            <el-option v-for="c in mockConsumables" :key="c.id" :label="`${c.code} - ${c.name}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="补货数量">
          <el-input-number v-model="restockForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="restockForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restockDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">提交入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { mockConsumables, mockConsumableAlerts, mockVehicleModels } from '@/api/mock'

const activeTab = ref('list')

const consumables = reactive(mockConsumables.map(c => ({ ...c })))
const alerts = computed(() => consumables.filter(c => c.stock <= c.safeStock).map((c, idx) => ({
  id: idx + 1,
  consumableId: c.id,
  consumableCode: c.code,
  consumableName: c.name,
  currentStock: c.stock,
  safeStock: c.safeStock,
  severity: c.stock < c.safeStock / 2 ? 3 : 2,
  createdAt: '2026-09-07 08:00:00'
})))

const stats = computed(() => ({
  total: consumables.length,
  alertCount: alerts.value.length,
  stockValue: consumables.reduce((s, c) => s + c.price * c.stock, 0),
  supplier: new Set(consumables.map(c => c.supplier)).size
}))

const search = reactive({ name: '', category: '', stockStatus: '', _v: 0 })

const filteredList = computed(() => {
  void search._v
  return consumables.filter(c => {
    const matchName = !search.name || c.name.includes(search.name) || c.code.includes(search.name)
    const matchCat = !search.category || c.category === search.category
    const matchStatus = !search.stockStatus || stockStatus(c) === search.stockStatus
    return matchName && matchCat && matchStatus
  })
})

const stockStatus = (c) => {
  if (c.stock < c.safeStock / 2) return 'danger'
  if (c.stock <= c.safeStock) return 'warning'
  return 'ok'
}
const stockText = (c) => ({ ok: '充足', warning: '预警', danger: '缺货' })[stockStatus(c)]
const stockType = (c) => ({ ok: 'success', warning: 'warning', danger: 'danger' })[stockStatus(c)]
const stockColor = (c) => {
  const s = stockStatus(c)
  return ({ ok: '#67c23a', warning: '#e6a23c', danger: '#f56c6c' })[s]
}
const categoryText = (cat) => ({ battery: '电池', tire: '轮胎', servo: '舵机', esc: '电调', camera: '摄像头', cable: '排线' })[cat] || cat
const compatText = (code) => code === 'ALL' ? '通用' : (mockVehicleModels.find(m => m.code === code)?.name || code)

const resetSearch = () => {
  search.name = ''
  search.category = ''
  search.stockStatus = ''
}

const dialogVisible = ref(false)
const editing = reactive({ id: null, code: '', name: '', category: 'tire', price: 0, unit: '只', stock: 0, safeStock: 10, supplier: '', compatibleModel: 'ALL' })

const openConsumableDialog = (row) => {
  if (row) Object.assign(editing, row)
  else Object.assign(editing, { id: null, code: '', name: '', category: 'tire', price: 0, unit: '只', stock: 0, safeStock: 10, supplier: '', compatibleModel: 'ALL' })
  dialogVisible.value = true
}
const saveConsumable = () => {
  ElMessage.success(editing.id ? '易耗件已更新' : '易耗件已新增')
  dialogVisible.value = false
}

const quickRestock = (row) => {
  row.stock += 10
  ElMessage.success(`${row.name} 入库 10 ${row.unit}，当前库存 ${row.stock}`)
}

const openConsumableOutbound = (row) => {
  ElMessage.info(`出库流程：${row.name}（可对接加盟商申领单）`)
}

const generatePO = (row) => {
  ElMessage.success(`已生成采购单：${row.consumableName}，补货 ${row.safeStock - row.currentStock} 件`)
}

const restockDialog = ref(false)
const restockForm = reactive({ consumableId: null, quantity: 10, remark: '' })
const submitRestock = () => {
  if (!restockForm.consumableId) {
    ElMessage.warning('请选择易耗件')
    return
  }
  const c = consumables.find(x => x.id === restockForm.consumableId)
  if (c) c.stock += restockForm.quantity
  ElMessage.success(`入库成功：${c?.name} +${restockForm.quantity}`)
  restockDialog.value = false
}
</script>