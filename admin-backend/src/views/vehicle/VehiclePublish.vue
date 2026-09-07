<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">新车发布</div>
    </div>

    <el-steps :active="step" finish-status="success" simple style="margin-bottom: 24px;">
      <el-step title="选择车型" />
      <el-step title="选装外壳与参数" />
      <el-step title="配置易耗件与价格" />
      <el-step title="部署并上架" />
    </el-steps>

    <el-card v-if="step === 0">
      <template #header>
        <span>第 1 步：选择车型</span>
      </template>
      <div class="model-radio-group">
        <div
          v-for="m in mockVehicleModels"
          :key="m.code"
          class="model-card"
          :class="{ active: form.modelCode === m.code }"
          @click="selectModel(m.code)"
        >
          <div class="model-name">{{ m.name }}</div>
          <div class="model-code">{{ m.code }}</div>
          <el-tag size="small">{{ m.gearLevel }}</el-tag>
          <div class="model-desc">{{ m.description }}</div>
          <div class="model-price">基础价 ¥{{ m.basePrice }} / 30 分钟</div>
        </div>
      </div>
    </el-card>

    <el-card v-if="step === 1" style="margin-top: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>第 2 步：选装外壳与附加选件</span>
          <span style="font-size: 14px; color: #909399;">已选 {{ form.shellIds.length }} 项</span>
        </div>
      </template>
      <el-table :data="availableShells" border @selection-change="onShellSelectionChange" ref="shellTableRef">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="选件名称" min-width="200" />
        <el-table-column label="适配车型" width="140">
          <template #default="{ row }">
            {{ shellCompatText(row.compatibleModel) }}
          </template>
        </el-table-column>
        <el-table-column label="加价" width="100">
          <template #default="{ row }">
            <el-tag :type="row.price > 0 ? 'warning' : 'success'" size="small">
              {{ row.price > 0 ? `+¥${row.price}` : '标配' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-card v-if="step === 2" style="margin-top: 16px;">
      <template #header>
        <span>第 3 步：配置易耗件与定价</span>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="起步时长(分钟)">
          <el-input-number v-model="form.baseDuration" :min="10" :max="180" :step="10" />
        </el-form-item>
        <el-form-item label="每 30 分钟单价">
          <el-input-number v-model="form.unitPrice" :min="1" />
          <span style="margin-left: 8px;">元</span>
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">系统推荐：¥{{ currentModel?.basePrice || '-' }}</span>
        </el-form-item>
        <el-form-item label="关联易耗件包">
          <el-checkbox-group v-model="form.consumableIds">
            <el-checkbox v-for="c in compatibleConsumables" :key="c.id" :label="c.id">
              {{ c.name }}（¥{{ c.price }} / {{ c.unit }}，库存 {{ c.stock }}）
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="预估售价">
          <div class="price-summary">
            <div>基础价：¥{{ form.unitPrice }}</div>
            <div>外壳加价：+¥{{ shellExtra }}</div>
            <div class="price-total">最终单价：¥{{ finalPrice }}</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="step === 3" style="margin-top: 16px;">
      <template #header>
        <span>第 4 步：部署并上架</span>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="加盟商">
          <el-select v-model="form.franchiseeId" placeholder="选择加盟商" style="width: 280px;">
            <el-option v-for="f in mockFranchisees" :key="f.id" :label="f.companyName" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属场地">
          <el-select v-model="form.siteId" placeholder="选择场地" style="width: 280px;">
            <el-option v-for="s in mockSites" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆 SN">
          <el-input v-model="form.sn" placeholder="例如：FD20260005" style="width: 280px;" />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-radio-group v-model="form.publishStatus">
            <el-radio value="draft">仅入库（待部署）</el-radio>
            <el-radio value="ready">即将上架</el-radio>
            <el-radio value="online">立即上架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="预计部署日期">
          <el-date-picker v-model="form.deployDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>

      <el-divider />
      <h4>发布预览</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="车型">{{ currentModel?.name }}</el-descriptions-item>
        <el-descriptions-item label="底盘">{{ currentModel?.gearLevel }}</el-descriptions-item>
        <el-descriptions-item label="外壳选件">
          {{ selectedShellNames || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="每 30 分钟单价">¥{{ finalPrice }}</el-descriptions-item>
        <el-descriptions-item label="上架状态">
          <el-tag :type="publishTagType(form.publishStatus)">{{ publishTagText(form.publishStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联场地">{{ selectedSiteName }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="step-footer">
      <el-button v-if="step > 0" @click="step--">上一步</el-button>
      <el-button v-if="step < 3" type="primary" @click="nextStep">下一步</el-button>
      <el-button v-if="step === 3" type="success" @click="submit">提交发布</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mockVehicleModels, mockShellOptions, mockConsumables, mockFranchisees, mockSites } from '@/api/mock'

const route = useRoute()
const router = useRouter()

const step = ref(0)
const form = reactive({
  modelCode: '',
  shellIds: [],
  consumableIds: [],
  baseDuration: 30,
  unitPrice: 30,
  franchiseeId: '',
  siteId: '',
  sn: '',
  publishStatus: 'draft',
  deployDate: new Date().toISOString().slice(0, 10),
  remark: ''
})

const shellTableRef = ref(null)

const currentModel = computed(() => mockVehicleModels.find(m => m.code === form.modelCode))

const availableShells = computed(() => {
  if (!form.modelCode) return mockShellOptions
  return mockShellOptions.filter(s => s.compatibleModel === 'ALL' || s.compatibleModel === form.modelCode)
})

const compatibleConsumables = computed(() => {
  if (!form.modelCode) return mockConsumables
  return mockConsumables.filter(c => c.compatibleModel === 'ALL' || c.compatibleModel === form.modelCode)
})

const selectedShellNames = computed(() => mockShellOptions.filter(s => form.shellIds.includes(s.id)).map(s => s.name).join('、'))

const shellExtra = computed(() => mockShellOptions
  .filter(s => form.shellIds.includes(s.id))
  .reduce((sum, s) => sum + s.price, 0)
)

const finalPrice = computed(() => Number(form.unitPrice || 0) + shellExtra.value)

const selectedSiteName = computed(() => mockSites.find(s => s.id === form.siteId)?.name || '-')

const selectModel = (code) => {
  form.modelCode = code
  const m = currentModel.value
  if (m) form.unitPrice = m.basePrice
  form.shellIds = []
  form.consumableIds = []
}

const onShellSelectionChange = (rows) => {
  form.shellIds = rows.map(r => r.id)
}

const shellCompatText = (code) => {
  if (code === 'ALL') return '通用'
  return mockVehicleModels.find(m => m.code === code)?.name || code
}

const publishTagText = (s) => ({ draft: '仅入库', ready: '即将上架', online: '立即上架' })[s] || s
const publishTagType = (s) => ({ draft: 'info', ready: 'warning', online: 'success' })[s] || ''

const nextStep = () => {
  if (step.value === 0 && !form.modelCode) {
    ElMessage.warning('请先选择车型')
    return
  }
  if (step.value === 3) return
  step.value += 1
  if (step.value === 1) {
    nextTick(() => {
      availableShells.value.forEach(s => {
        if (form.shellIds.includes(s.id)) {
          shellTableRef.value?.toggleRowSelection(s, true)
        }
      })
    })
  }
}

const submit = () => {
  if (!form.franchiseeId || !form.siteId || !form.sn) {
    ElMessage.warning('请补全加盟商、场地、车辆 SN')
    return
  }
  ElMessage.success(`车辆 ${form.sn} 已发布（${publishTagText(form.publishStatus)}）`)
  setTimeout(() => router.push('/vehicle/list'), 800)
}

onMounted(() => {
  const queryModel = route.query.model
  if (queryModel) {
    form.modelCode = queryModel
    selectModel(queryModel)
  }
})
</script>

<style scoped>
.model-radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.model-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-card:hover {
  border-color: #409eff;
}

.model-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.model-code {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.model-desc {
  font-size: 13px;
  color: #606266;
  margin: 8px 0;
  min-height: 40px;
}

.model-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
}

.price-summary {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
}

.price-summary > div {
  margin: 4px 0;
}

.price-total {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  margin-top: 8px;
}

.step-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>