<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">车辆参数库</div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="车型库" name="models">
        <el-card>
          <div class="search-bar">
            <el-input v-model="modelSearch.code" placeholder="车型编码" clearable style="width: 160px;" />
            <el-select v-model="modelSearch.gearLevel" placeholder="底盘档位" clearable style="width: 160px;">
              <el-option label="1/16 竞速版" value="1/16 竞速版" />
              <el-option label="1/10 全地形版" value="1/10 全地形版" />
              <el-option label="1/8 硬核越野版" value="1/8 硬核越野版" />
            </el-select>
            <el-button type="primary" @click="modelSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetModelSearch">重置</el-button>
            <el-button type="success" @click="openModelDialog()">+ 新增车型</el-button>
          </div>

          <el-table :data="filteredModels" border stripe>
            <el-table-column prop="code" label="车型编码" width="140" />
            <el-table-column prop="name" label="车型名称" width="140" />
            <el-table-column prop="gearLevel" label="底盘档位" width="130" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                {{ modelTypeText(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="recommendedSite" label="建议场地" width="160" />
            <el-table-column label="基础价" width="100">
              <template #default="{ row }">
                ¥{{ row.basePrice }} /30 分钟
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goPublish(row)">发布新车</el-button>
                <el-button link type="primary" size="small" @click="openModelDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="外壳选件" name="shells">
        <el-card>
          <div class="search-bar">
            <el-input v-model="shellSearch.name" placeholder="选件名称" clearable style="width: 200px;" />
            <el-select v-model="shellSearch.compatibleModel" placeholder="适配车型" clearable style="width: 180px;">
              <el-option v-for="m in mockVehicleModels" :key="m.code" :label="m.name" :value="m.code" />
              <el-option label="通用" value="ALL" />
            </el-select>
            <el-button type="primary" @click="shellSearch._v = Date.now()">查询</el-button>
            <el-button @click="resetShellSearch">重置</el-button>
            <el-button type="success" @click="openShellDialog()">+ 新增选件</el-button>
          </div>

          <el-table :data="filteredShells" border stripe>
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
            <el-table-column prop="description" label="说明" min-width="240" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openShellDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="modelDialogVisible" :title="editingModel.id ? '编辑车型' : '新增车型'" width="560px">
      <el-form :model="editingModel" label-width="100px">
        <el-form-item label="车型编码">
          <el-input v-model="editingModel.code" placeholder="例如：FD-YZ-PRO" />
        </el-form-item>
        <el-form-item label="车型名称">
          <el-input v-model="editingModel.name" />
        </el-form-item>
        <el-form-item label="底盘档位">
          <el-select v-model="editingModel.gearLevel" style="width: 100%;">
            <el-option label="1/16 竞速版" value="1/16 竞速版" />
            <el-option label="1/10 全地形版" value="1/10 全地形版" />
            <el-option label="1/8 硬核越野版" value="1/8 硬核越野版" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editingModel.type" style="width: 100%;">
            <el-option label="攀爬" value="crawler" />
            <el-option label="竞速" value="racing" />
            <el-option label="沙漠" value="desert" />
            <el-option label="岩石" value="rock" />
          </el-select>
        </el-form-item>
        <el-form-item label="建议场地">
          <el-input v-model="editingModel.recommendedSite" />
        </el-form-item>
        <el-form-item label="基础价(元/30分钟)">
          <el-input-number v-model="editingModel.basePrice" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingModel.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shellDialogVisible" :title="editingShell.id ? '编辑选件' : '新增选件'" width="500px">
      <el-form :model="editingShell" label-width="100px">
        <el-form-item label="选件名称">
          <el-input v-model="editingShell.name" />
        </el-form-item>
        <el-form-item label="适配车型">
          <el-select v-model="editingShell.compatibleModel" style="width: 100%;">
            <el-option v-for="m in mockVehicleModels" :key="m.code" :label="m.name" :value="m.code" />
            <el-option label="通用" value="ALL" />
          </el-select>
        </el-form-item>
        <el-form-item label="加价(元)">
          <el-input-number v-model="editingShell.price" :min="0" :max="9999" />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">0 表示标配</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="editingShell.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shellDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShell">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mockVehicleModels, mockShellOptions } from '@/api/mock'

const router = useRouter()
const activeTab = ref('models')

const modelSearch = reactive({ code: '', gearLevel: '', _v: 0 })
const shellSearch = reactive({ name: '', compatibleModel: '', _v: 0 })

const filteredModels = computed(() => {
  void modelSearch._v
  return mockVehicleModels.filter(m => {
    const matchCode = !modelSearch.code || m.code.includes(modelSearch.code)
    const matchGear = !modelSearch.gearLevel || m.gearLevel === modelSearch.gearLevel
    return matchCode && matchGear
  })
})

const filteredShells = computed(() => {
  void shellSearch._v
  return mockShellOptions.filter(s => {
    const matchName = !shellSearch.name || s.name.includes(shellSearch.name)
    const matchCompat = !shellSearch.compatibleModel || s.compatibleModel === shellSearch.compatibleModel
    return matchName && matchCompat
  })
})

const modelTypeText = (t) => ({ crawler: '攀爬', racing: '竞速', desert: '沙漠', rock: '岩石' })[t] || t
const shellCompatText = (code) => {
  if (code === 'ALL') return '通用'
  return mockVehicleModels.find(m => m.code === code)?.name || code
}

const resetModelSearch = () => {
  modelSearch.code = ''
  modelSearch.gearLevel = ''
}
const resetShellSearch = () => {
  shellSearch.name = ''
  shellSearch.compatibleModel = ''
}

const modelDialogVisible = ref(false)
const editingModel = reactive({ id: null, code: '', name: '', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '', basePrice: 30, description: '' })

const openModelDialog = (row) => {
  if (row) Object.assign(editingModel, row)
  else Object.assign(editingModel, { id: null, code: '', name: '', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '', basePrice: 30, description: '' })
  modelDialogVisible.value = true
}
const saveModel = () => {
  ElMessage.success(editingModel.id ? '车型已更新' : '车型已新增')
  modelDialogVisible.value = false
}

const shellDialogVisible = ref(false)
const editingShell = reactive({ id: null, name: '', compatibleModel: 'ALL', price: 0, description: '' })

const openShellDialog = (row) => {
  if (row) Object.assign(editingShell, row)
  else Object.assign(editingShell, { id: null, name: '', compatibleModel: 'ALL', price: 0, description: '' })
  shellDialogVisible.value = true
}
const saveShell = () => {
  ElMessage.success(editingShell.id ? '选件已更新' : '选件已新增')
  shellDialogVisible.value = false
}

const goPublish = (row) => {
  router.push({ path: '/vehicle/publish', query: { model: row.code } })
}
</script>