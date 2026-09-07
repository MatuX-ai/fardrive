// 兼容层：保留历史静态数据 + 工具函数，业务数据正逐步从 HTTP 拉取。
// 该文件保留导出名称以保持与现有页面的 import 兼容。
// 新业务接入请使用 @/api 模块。

const statusMap = {
  franchisee: { 0: '待审核', 1: '正常', 2: '冻结', 3: '退出' },
  vehicle: { 0: '空闲', 1: '驾驶中', 2: '充电', 3: '故障', 4: '离线', 5: '退役' },
  battery: { 1: '正常', 2: '建议退役', 3: '已退役' },
  settlement: { 0: '待确认', 1: '已确认', 2: '已结算', 3: '有差异' },
  withdrawal: { 0: '待审批', 1: '已通过', 2: '已打款', 3: '驳回' },
  application: { 0: '待提交', 1: '待审核', 2: '审核中', 3: '通过', 4: '驳回' },
  standardPart: { 1: '正常', 2: '建议更换', 3: '已更换' },
  maintenance: { 0: '待处理', 1: '已完成' },
  accident: { 0: '待定责', 1: '已结案' },
  otaTask: { 0: '待执行', 1: '升级中', 2: '已完成', 3: '失败' }
}

export const getStatusText = (type, status) => statusMap[type]?.[status] || '未知'

export const mockUsers = []
export const mockRoles = []
export const mockFranchisees = [
  { id: 1, companyName: '北京越野侠科技有限公司', legalPerson: '张伟', contactName: '张伟', contactPhone: '13900000001', regionCode: '110000', status: 1, depositAmount: 50000, settleRatio: 0.15, joinedAt: '2026-01-15' },
  { id: 3, companyName: '广州极境体育文化有限公司', legalPerson: '王强', contactName: '王强', contactPhone: '13900000003', regionCode: '440100', status: 1, depositAmount: 50000, settleRatio: 0.18, joinedAt: '2026-03-10' },
  { id: 4, companyName: '杭州山野客户外运动', legalPerson: '赵敏', contactName: '赵敏', contactPhone: '13900000004', regionCode: '330100', status: 2, depositAmount: 50000, settleRatio: 0.15, joinedAt: '2025-11-20' }
]
export const mockApplications = []
export const mockSites = [
  { id: 1, franchiseeId: 1, name: '北京昌平越野基地', address: '北京市昌平区', signalLevel: 'S', onlineStatus: 1, mapStatus: 1 },
  { id: 2, franchiseeId: 3, name: '广州从化山地公园', address: '广州市从化区', signalLevel: 'A', onlineStatus: 1, mapStatus: 1 },
  { id: 3, franchiseeId: 4, name: '杭州余杭野外场地', address: '杭州市余杭区', signalLevel: 'B', onlineStatus: 0, mapStatus: 2 }
]
export const mockVehicles = [
  { id: 1, siteId: 1, franchiseeId: 1, sn: 'FD20260001', model: '远征者 Pro', gearLevel: '1/10 全地形版', status: 1, totalMileage: 3200, onlineRate7d: 0.92, onlineRate30d: 0.89, deployedAt: '2026-02-01', lastOnlineAt: '2026-09-07 10:23:00', signalLevel: 'S', firmwareVersion: 'v1.2.3', batteryId: 1, orderCount: 128, totalRevenue: 32150, totalDrivingMinutes: 3840, repairCount: 2, accidentCount: 0, procuredAt: '2026-01-10', certifiedAt: '2026-01-25' },
  { id: 2, siteId: 1, franchiseeId: 1, sn: 'FD20260002', model: '远征者 Pro', gearLevel: '1/10 全地形版', status: 0, totalMileage: 1850, onlineRate7d: 0.88, onlineRate30d: 0.85, deployedAt: '2026-02-15', lastOnlineAt: '2026-09-07 09:45:00', signalLevel: 'S', firmwareVersion: 'v1.2.3', batteryId: 2, orderCount: 76, totalRevenue: 18980, totalDrivingMinutes: 2280, repairCount: 1, accidentCount: 1, procuredAt: '2026-01-20', certifiedAt: '2026-02-05' },
  { id: 3, siteId: 2, franchiseeId: 3, sn: 'FD20260003', model: '探索者 Lite', gearLevel: '1/16 竞速版', status: 3, totalMileage: 980, onlineRate7d: 0.65, onlineRate30d: 0.71, deployedAt: '2026-04-01', lastOnlineAt: '2026-09-06 16:30:00', signalLevel: 'A', firmwareVersion: 'v1.1.8', batteryId: 3, orderCount: 42, totalRevenue: 7560, totalDrivingMinutes: 1260, repairCount: 3, accidentCount: 0, procuredAt: '2026-03-15', certifiedAt: '2026-03-25' },
  { id: 4, siteId: 3, franchiseeId: 4, sn: 'FD20260004', model: '探索者 Lite', gearLevel: '1/16 竞速版', status: 4, totalMileage: 4200, onlineRate7d: 0.12, onlineRate30d: 0.34, deployedAt: '2025-12-10', lastOnlineAt: '2026-09-01 11:20:00', signalLevel: 'B', firmwareVersion: 'v1.1.5', batteryId: 4, orderCount: 156, totalRevenue: 24960, totalDrivingMinutes: 4680, repairCount: 5, accidentCount: 2, procuredAt: '2025-11-20', certifiedAt: '2025-12-05' }
]
export const mockBatteries = [
  { id: 1, vehicleId: 1, sn: 'BAT20260001', capacity: 50, soh: 94, cycleCount: 420, status: 1 },
  { id: 2, vehicleId: 2, sn: 'BAT20260002', capacity: 50, soh: 88, cycleCount: 680, status: 1 },
  { id: 3, vehicleId: 3, sn: 'BAT20260003', capacity: 50, soh: 76, cycleCount: 950, status: 2 },
  { id: 4, vehicleId: 4, sn: 'BAT20260004', capacity: 50, soh: 62, cycleCount: 1200, status: 3 }
]
export const mockBatteryAlerts = [
  { id: 1, batteryId: 3, batterySn: 'BAT20260003', alertType: 'soh_low', severity: 2, message: 'SOH 76%，建议退役转慢充备用', status: 0, createdAt: '2026-09-06 08:00:00' },
  { id: 2, batteryId: 4, batterySn: 'BAT20260004', alertType: 'soh_low', severity: 3, message: 'SOH 62%，已严重低于安全阈值', status: 0, createdAt: '2026-09-06 09:30:00' },
  { id: 3, batteryId: 2, batterySn: 'BAT20260002', alertType: 'cycle_threshold', severity: 1, message: '循环次数 680，接近复购阈值', status: 0, createdAt: '2026-09-05 16:00:00' }
]
export const mockStandardParts = [
  { id: 1, vehicleId: 1, name: '智能中控盒', sn: 'BOX20260001', model: 'RK3588-STD-V2', category: 'control', installedAt: '2026-01-15', status: 1 },
  { id: 2, vehicleId: 1, name: '标准电池组', sn: 'BAT20260001', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2026-01-15', status: 1 },
  { id: 3, vehicleId: 1, name: '前向图传摄像头', sn: 'CAM20260001', model: 'FD-CAM-120W', category: 'camera', installedAt: '2026-01-15', status: 1 },
  { id: 4, vehicleId: 1, name: '1/10 全地形底盘', sn: 'CHS20260001', model: 'FD-CHS-110', category: 'chassis', installedAt: '2026-01-15', status: 1 },
  { id: 5, vehicleId: 2, name: '智能中控盒', sn: 'BOX20260002', model: 'RK3588-STD-V2', category: 'control', installedAt: '2026-01-20', status: 1 },
  { id: 6, vehicleId: 2, name: '标准电池组', sn: 'BAT20260002', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2026-01-20', status: 1 },
  { id: 7, vehicleId: 2, name: '前向图传摄像头', sn: 'CAM20260002', model: 'FD-CAM-120W', category: 'camera', installedAt: '2026-01-20', status: 1 },
  { id: 8, vehicleId: 2, name: '1/10 全地形底盘', sn: 'CHS20260002', model: 'FD-CHS-110', category: 'chassis', installedAt: '2026-01-20', status: 1 }
]
export const mockDiagnosisSnapshots = [
  { id: 1, vehicleId: 1, reportedAt: '2026-09-07 10:23:00', soc: 67, voltage: 48.2, current: 12.5, temperature: 32, signalRsrp: -82, signalJitter: 18, faultCodes: [], gpsStatus: 1, imuStatus: 1 },
  { id: 2, vehicleId: 2, reportedAt: '2026-09-07 09:45:00', soc: 45, voltage: 47.1, current: 0, temperature: 28, signalRsrp: -88, signalJitter: 22, faultCodes: [], gpsStatus: 1, imuStatus: 1 },
  { id: 3, vehicleId: 3, reportedAt: '2026-09-06 16:30:00', soc: 12, voltage: 44.5, current: 0, temperature: 35, signalRsrp: -95, signalJitter: 35, faultCodes: ['BMS_001'], gpsStatus: 0, imuStatus: 1 },
  { id: 4, vehicleId: 4, reportedAt: '2026-09-01 11:20:00', soc: 0, voltage: 0, current: 0, temperature: 0, signalRsrp: -120, signalJitter: 0, faultCodes: ['NET_001', 'BMS_002'], gpsStatus: 0, imuStatus: 0 }
]
export const mockMaintenanceRecords = [
  { id: 1, vehicleId: 1, type: 'routine', item: '轮胎磨损检查', triggerMileage: 3000, triggerDate: null, completedAt: '2026-08-15', cost: 120, operator: '王师傅', status: 1 },
  { id: 2, vehicleId: 2, type: 'routine', item: '电池健康检查', triggerMileage: null, triggerDate: '2026-09-10', completedAt: null, cost: 0, operator: '', status: 0 },
  { id: 3, vehicleId: 3, type: 'repair', item: '转向舵机更换', triggerMileage: null, triggerDate: null, completedAt: '2026-08-20', cost: 280, operator: '李师傅', status: 1 },
  { id: 4, vehicleId: 4, type: 'repair', item: '图传摄像头维修', triggerMileage: null, triggerDate: null, completedAt: '2026-08-01', cost: 350, operator: '张师傅', status: 1 }
]
export const mockAccidentRecords = [
  { id: 1, vehicleId: 2, type: 'rollover', occurredAt: '2026-07-20 15:30:00', location: '北京昌平越野基地B区', description: '过驼峰时侧翻，车身无损伤', responsibility: 'player', repairCost: 0, status: 1 },
  { id: 2, vehicleId: 4, type: 'collision', occurredAt: '2026-06-15 10:20:00', location: '杭州余杭野外场地东侧', description: '转向舵机故障导致撞树', responsibility: 'device', repairCost: 420, status: 1 },
  { id: 3, vehicleId: 4, type: 'collision', occurredAt: '2026-07-08 14:10:00', location: '杭州余杭野外场地北侧', description: '玩家超速冲出围栏撞护栏', responsibility: 'player', repairCost: 680, status: 1 }
]
export const mockOtaRecords = [
  { id: 1, version: 'v1.2.3', description: '优化断线重连策略，修复低速抖动', releaseAt: '2026-08-01', targetCount: 12, successCount: 12, failedCount: 0, status: 2 },
  { id: 2, version: 'v1.2.2', description: '提升弱网码率自适应', releaseAt: '2026-07-15', targetCount: 12, successCount: 11, failedCount: 1, status: 2 },
  { id: 3, version: 'v1.2.4', description: '新增电子围栏分级限速', releaseAt: '2026-09-05', targetCount: 4, successCount: 2, failedCount: 0, status: 1 }
]
export const mockOtaTaskDetails = [
  { id: 1, taskId: 1, vehicleId: 1, vehicleSn: 'FD20260001', fromVersion: 'v1.2.2', toVersion: 'v1.2.3', status: 2, startedAt: '2026-08-01 10:00:00', finishedAt: '2026-08-01 10:15:00' },
  { id: 5, taskId: 3, vehicleId: 1, vehicleSn: 'FD20260001', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 2, startedAt: '2026-09-05 09:00:00', finishedAt: '2026-09-05 09:18:00' },
  { id: 6, taskId: 3, vehicleId: 2, vehicleSn: 'FD20260002', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 1, startedAt: '2026-09-05 09:00:00', finishedAt: null },
  { id: 7, taskId: 3, vehicleId: 3, vehicleSn: 'FD20260003', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 0, startedAt: null, finishedAt: null },
  { id: 8, taskId: 3, vehicleId: 4, vehicleSn: 'FD20260004', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 0, startedAt: null, finishedAt: null }
]
export const mockMaintenanceRules = [
  { id: 1, type: 'mileage', item: '轮胎磨损检查', threshold: 3000, unit: 'km', enabled: true, description: '每 3000km 检查轮胎磨损情况' },
  { id: 2, type: 'mileage', item: '底盘螺丝紧固', threshold: 2000, unit: 'km', enabled: true, description: '每 2000km 检查底盘螺丝松动' },
  { id: 3, type: 'cycle', item: '电池健康检查', threshold: 600, unit: '次', enabled: true, description: '电池循环次数达到 600 次触发检查' },
  { id: 4, type: 'time', item: '每季度保养', threshold: 90, unit: '天', enabled: true, description: '距离上次保养 90 天触发' },
  { id: 5, type: 'temperature', item: '电机过热检查', threshold: 55, unit: '℃', enabled: false, description: '电机温度超过 55℃ 累计 3 次触发' }
]
export const mockControlLogs = []
export const mockVehicleModels = [
  { id: 1, code: 'FD-YZ-PRO', name: '远征者 Pro', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '田园/竹林/森林', basePrice: 30, image: '#', description: '主力走量车型，悬挂行程适中，覆盖多数地貌' },
  { id: 2, code: 'FD-TS-LITE', name: '探索者 Lite', gearLevel: '1/16 竞速版', type: 'racing', recommendedSite: '沙盘/室内', basePrice: 15, image: '#', description: '入门档车型，小型轻量化，引流走量' },
  { id: 3, code: 'FD-DS-MAX', name: '沙漠卡 MAX', gearLevel: '1/8 硬核越野版', type: 'desert', recommendedSite: '沙漠/草原', basePrice: 60, image: '#', description: '硬核越野，大行程强动力，赛事用车' },
  { id: 4, code: 'FD-ROCK', name: '岩石攀爬者', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '岩石/林道', basePrice: 35, image: '#', description: '岩石攀爬车型，扭矩大，低速扭矩强' }
]
export const mockShellOptions = [
  { id: 1, name: '北京吉普 212 经典涂装', compatibleModel: 'FD-YZ-PRO', price: 0, description: '默认涂装，随车附带' },
  { id: 2, name: '切诺基 越野涂装', compatibleModel: 'FD-YZ-PRO', price: 80, description: '经典美式 SUV 涂装，磨砂黑 + 银饰条' },
  { id: 3, name: '沙漠卡 拉力涂装', compatibleModel: 'FD-DS-MAX', price: 120, description: '黄黑配色拉力涂装' },
  { id: 4, name: '岩石车 工业灰', compatibleModel: 'FD-ROCK', price: 60, description: '金属灰 + 防滚架' },
  { id: 5, name: '霓虹轮胎光效', compatibleModel: 'ALL', price: 30, description: '软件叠加效果，可在玩家端应用' },
  { id: 6, name: '专属车牌（4 位自定义）', compatibleModel: 'ALL', price: 80, description: '玩家可自定义车牌号' }
]
export const mockConsumables = [
  { id: 1, code: 'BAT-FD-50', name: '标准电池组 50Ah', category: 'battery', unit: '块', price: 800, stock: 28, safeStock: 10, supplier: '宁德时代', compatibleModel: 'ALL' },
  { id: 2, code: 'TIRE-110-AT', name: '1/10 全地形轮胎', category: 'tire', unit: '只', price: 60, stock: 120, safeStock: 50, supplier: '锦湖', compatibleModel: 'FD-YZ-PRO' },
  { id: 3, code: 'TIRE-116-RS', name: '1/16 竞速胎', category: 'tire', unit: '只', price: 35, stock: 80, safeStock: 40, supplier: '锦湖', compatibleModel: 'FD-TS-LITE' },
  { id: 4, code: 'TIRE-118-RC', name: '1/8 越野胎', category: 'tire', unit: '只', price: 110, stock: 12, safeStock: 30, supplier: '锦湖', compatibleModel: 'FD-DS-MAX' },
  { id: 5, code: 'SERVO-STD', name: '标准舵机', category: 'servo', unit: '个', price: 90, stock: 45, safeStock: 20, supplier: '辉盛', compatibleModel: 'ALL' },
  { id: 6, code: 'ESC-110', name: '1/10 电调', category: 'esc', unit: '个', price: 220, stock: 8, safeStock: 15, supplier: '好盈', compatibleModel: 'FD-YZ-PRO' },
  { id: 7, code: 'CAM-120W', name: '广角摄像头 120°', category: 'camera', unit: '个', price: 350, stock: 22, safeStock: 10, supplier: '海康', compatibleModel: 'ALL' },
  { id: 8, code: 'CAM-CABLE', name: '摄像头 FPC 排线', category: 'cable', unit: '根', price: 18, stock: 60, safeStock: 30, supplier: '立讯', compatibleModel: 'ALL' }
]
export const mockConsumableAlerts = [
  { id: 1, consumableId: 4, consumableCode: 'TIRE-118-RC', consumableName: '1/8 越野胎', currentStock: 12, safeStock: 30, severity: 3, createdAt: '2026-09-07 08:00:00' },
  { id: 2, consumableId: 6, consumableCode: 'ESC-110', consumableName: '1/10 电调', currentStock: 8, safeStock: 15, severity: 2, createdAt: '2026-09-07 08:00:00' }
]
export const mockSettlements = [
  { id: 1, franchiseeId: 1, periodStart: '2026-08-01', periodEnd: '2026-08-31', totalAmount: 125800, platformAmount: 18870, franchiseeAmount: 106930, status: 2 },
  { id: 2, franchiseeId: 3, periodStart: '2026-08-01', periodEnd: '2026-08-31', totalAmount: 98600, platformAmount: 17748, franchiseeAmount: 80852, status: 1 },
  { id: 3, franchiseeId: 1, periodStart: '2026-09-01', periodEnd: '2026-09-06', totalAmount: 26800, platformAmount: 4020, franchiseeAmount: 22780, status: 0 }
]
export const mockWithdrawals = [
  { id: 1, franchiseeId: 1, amount: 50000, bankAccount: '中国银行 6222 **** 0001', status: 0, createdAt: '2026-09-07 10:00:00' },
  { id: 2, franchiseeId: 3, amount: 30000, bankAccount: '工商银行 6222 **** 0002', status: 2, paidAt: '2026-09-06 15:00:00', createdAt: '2026-09-05 11:00:00' }
]
export const mockOrders = [
  { id: 1, vehicleId: 1, siteId: 1, franchiseeId: 1, durationMin: 30, amount: 128, platformAmount: 19.2, franchiseeAmount: 108.8, status: 1, createdAt: '2026-09-07 09:00:00' },
  { id: 2, vehicleId: 2, siteId: 1, franchiseeId: 1, durationMin: 60, amount: 238, platformAmount: 35.7, franchiseeAmount: 202.3, status: 1, createdAt: '2026-09-07 08:30:00' },
  { id: 3, vehicleId: 3, siteId: 2, franchiseeId: 3, durationMin: 45, amount: 168, platformAmount: 30.24, franchiseeAmount: 137.76, status: 2, createdAt: '2026-09-06 16:00:00' }
]

export const findSite = (siteId) => mockSites.find(s => s.id === siteId)
export const findFranchisee = (franchiseeId) => mockFranchisees.find(f => f.id === franchiseeId)
export const findBattery = (batteryId) => mockBatteries.find(b => b.id === batteryId)
export const findVehicleBattery = (vehicleId) => mockBatteries.find(b => b.vehicleId === vehicleId)
export const findStandardParts = (vehicleId) => mockStandardParts.filter(p => p.vehicleId === vehicleId)
export const findDiagnosisSnapshot = (vehicleId) => mockDiagnosisSnapshots.find(d => d.vehicleId === vehicleId)
export const findMaintenanceRecords = (vehicleId) => mockMaintenanceRecords.filter(r => r.vehicleId === vehicleId)
export const findAccidentRecords = (vehicleId) => mockAccidentRecords.filter(r => r.vehicleId === vehicleId)
export const findVehicleOrders = (vehicleId) => mockOrders.filter(o => o.vehicleId === vehicleId)
export const findControlLogs = (vehicleId) => mockControlLogs.filter(l => l.vehicleId === vehicleId)
export const findOtaTaskDetails = (taskId) => mockOtaTaskDetails.filter(t => t.taskId === taskId)