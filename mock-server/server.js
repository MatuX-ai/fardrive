// 无限远征 · 平台管理后台 · Mock API 服务
// 用 Node 原生 http 启动，无第三方依赖
// 启动：node server.js
// 默认端口：5175（与 Vite 前端 5173/5174 区分）

const http = require('http')
const url = require('url')

const PORT = process.env.PORT || 5175

// ============== 数据存储 ==============
const store = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', realName: '超级管理员', phone: '13800000001', roles: '超级管理员', status: 1, lastLoginAt: '2026-09-07 09:30:00' }
  ],
  tokens: new Map(),

  franchisees: [
    { id: 1, companyName: '北京越野侠科技有限公司', legalPerson: '张伟', contactName: '张伟', contactPhone: '13900000001', regionCode: '110000', status: 1, depositAmount: 50000, settleRatio: 0.15, joinedAt: '2026-01-15' },
    { id: 2, companyName: '成都荒野探索俱乐部', legalPerson: '李娜', contactName: '李娜', contactPhone: '13900000002', regionCode: '510100', status: 0, depositAmount: 0, settleRatio: 0.12, joinedAt: null },
    { id: 3, companyName: '广州极境体育文化有限公司', legalPerson: '王强', contactName: '王强', contactPhone: '13900000003', regionCode: '440100', status: 1, depositAmount: 50000, settleRatio: 0.18, joinedAt: '2026-03-10' },
    { id: 4, companyName: '杭州山野客户外运动', legalPerson: '赵敏', contactName: '赵敏', contactPhone: '13900000004', regionCode: '330100', status: 2, depositAmount: 50000, settleRatio: 0.15, joinedAt: '2025-11-20' }
  ],
  applications: [
    { id: 1, franchiseeId: 2, applicantName: '李娜', applicantPhone: '13900000002', status: 1, submittedAt: '2026-09-05 10:00:00', reviewRemark: '', businessLicenseUrl: '#' },
    { id: 2, franchiseeId: 5, applicantName: '刘洋', applicantPhone: '13900000005', status: 1, submittedAt: '2026-09-06 14:30:00', reviewRemark: '', businessLicenseUrl: '#' }
  ],
  sites: [
    { id: 1, franchiseeId: 1, name: '北京昌平越野基地', address: '北京市昌平区', signalLevel: 'S', onlineStatus: 1, mapStatus: 1 },
    { id: 2, franchiseeId: 3, name: '广州从化山地公园', address: '广州市从化区', signalLevel: 'A', onlineStatus: 1, mapStatus: 1 },
    { id: 3, franchiseeId: 4, name: '杭州余杭野外场地', address: '杭州市余杭区', signalLevel: 'B', onlineStatus: 0, mapStatus: 2 }
  ],
  vehicles: [
    { id: 1, siteId: 1, franchiseeId: 1, sn: 'FD20260001', model: '远征者 Pro', gearLevel: '1/10 全地形版', status: 1, totalMileage: 3200, onlineRate7d: 0.92, onlineRate30d: 0.89, deployedAt: '2026-02-01', lastOnlineAt: '2026-09-07 10:23:00', signalLevel: 'S', firmwareVersion: 'v1.2.3', batteryId: 1, orderCount: 128, totalRevenue: 32150, totalDrivingMinutes: 3840, repairCount: 2, accidentCount: 0, procuredAt: '2026-01-10', certifiedAt: '2026-01-25' },
    { id: 2, siteId: 1, franchiseeId: 1, sn: 'FD20260002', model: '远征者 Pro', gearLevel: '1/10 全地形版', status: 0, totalMileage: 1850, onlineRate7d: 0.88, onlineRate30d: 0.85, deployedAt: '2026-02-15', lastOnlineAt: '2026-09-07 09:45:00', signalLevel: 'S', firmwareVersion: 'v1.2.3', batteryId: 2, orderCount: 76, totalRevenue: 18980, totalDrivingMinutes: 2280, repairCount: 1, accidentCount: 1, procuredAt: '2026-01-20', certifiedAt: '2026-02-05' },
    { id: 3, siteId: 2, franchiseeId: 3, sn: 'FD20260003', model: '探索者 Lite', gearLevel: '1/16 竞速版', status: 3, totalMileage: 980, onlineRate7d: 0.65, onlineRate30d: 0.71, deployedAt: '2026-04-01', lastOnlineAt: '2026-09-06 16:30:00', signalLevel: 'A', firmwareVersion: 'v1.1.8', batteryId: 3, orderCount: 42, totalRevenue: 7560, totalDrivingMinutes: 1260, repairCount: 3, accidentCount: 0, procuredAt: '2026-03-15', certifiedAt: '2026-03-25' },
    { id: 4, siteId: 3, franchiseeId: 4, sn: 'FD20260004', model: '探索者 Lite', gearLevel: '1/16 竞速版', status: 4, totalMileage: 4200, onlineRate7d: 0.12, onlineRate30d: 0.34, deployedAt: '2025-12-10', lastOnlineAt: '2026-09-01 11:20:00', signalLevel: 'B', firmwareVersion: 'v1.1.5', batteryId: 4, orderCount: 156, totalRevenue: 24960, totalDrivingMinutes: 4680, repairCount: 5, accidentCount: 2, procuredAt: '2025-11-20', certifiedAt: '2025-12-05' }
  ],
  batteries: [
    { id: 1, vehicleId: 1, sn: 'BAT20260001', capacity: 50, soh: 94, cycleCount: 420, status: 1 },
    { id: 2, vehicleId: 2, sn: 'BAT20260002', capacity: 50, soh: 88, cycleCount: 680, status: 1 },
    { id: 3, vehicleId: 3, sn: 'BAT20260003', capacity: 50, soh: 76, cycleCount: 950, status: 2 },
    { id: 4, vehicleId: 4, sn: 'BAT20260004', capacity: 50, soh: 62, cycleCount: 1200, status: 3 }
  ],
  batteryAlerts: [
    { id: 1, batteryId: 3, batterySn: 'BAT20260003', alertType: 'soh_low', severity: 2, message: 'SOH 76%，建议退役转慢充备用', status: 0, createdAt: '2026-09-06 08:00:00' },
    { id: 2, batteryId: 4, batterySn: 'BAT20260004', alertType: 'soh_low', severity: 3, message: 'SOH 62%，已严重低于安全阈值', status: 0, createdAt: '2026-09-06 09:30:00' },
    { id: 3, batteryId: 2, batterySn: 'BAT20260002', alertType: 'cycle_threshold', severity: 1, message: '循环次数 680，接近复购阈值', status: 0, createdAt: '2026-09-05 16:00:00' }
  ],
  standardParts: [
    { id: 1, vehicleId: 1, name: '智能中控盒', sn: 'BOX20260001', model: 'RK3588-STD-V2', category: 'control', installedAt: '2026-01-15', status: 1 },
    { id: 2, vehicleId: 1, name: '标准电池组', sn: 'BAT20260001', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2026-01-15', status: 1 },
    { id: 3, vehicleId: 1, name: '前向图传摄像头', sn: 'CAM20260001', model: 'FD-CAM-120W', category: 'camera', installedAt: '2026-01-15', status: 1 },
    { id: 4, vehicleId: 1, name: '1/10 全地形底盘', sn: 'CHS20260001', model: 'FD-CHS-110', category: 'chassis', installedAt: '2026-01-15', status: 1 },
    { id: 5, vehicleId: 2, name: '智能中控盒', sn: 'BOX20260002', model: 'RK3588-STD-V2', category: 'control', installedAt: '2026-01-20', status: 1 },
    { id: 6, vehicleId: 2, name: '标准电池组', sn: 'BAT20260002', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2026-01-20', status: 1 },
    { id: 7, vehicleId: 2, name: '前向图传摄像头', sn: 'CAM20260002', model: 'FD-CAM-120W', category: 'camera', installedAt: '2026-01-20', status: 1 },
    { id: 8, vehicleId: 2, name: '1/10 全地形底盘', sn: 'CHS20260002', model: 'FD-CHS-110', category: 'chassis', installedAt: '2026-01-20', status: 1 },
    { id: 9, vehicleId: 3, name: '智能中控盒', sn: 'BOX20260003', model: 'RK3588-STD-V1', category: 'control', installedAt: '2026-03-15', status: 2 },
    { id: 10, vehicleId: 3, name: '标准电池组', sn: 'BAT20260003', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2026-03-15', status: 2 },
    { id: 11, vehicleId: 3, name: '前向图传摄像头', sn: 'CAM20260003', model: 'FD-CAM-120W', category: 'camera', installedAt: '2026-03-15', status: 1 },
    { id: 12, vehicleId: 3, name: '1/16 竞速版底盘', sn: 'CHS20260003', model: 'FD-CHS-116', category: 'chassis', installedAt: '2026-03-15', status: 1 },
    { id: 13, vehicleId: 4, name: '智能中控盒', sn: 'BOX20260004', model: 'RK3588-STD-V1', category: 'control', installedAt: '2025-11-20', status: 1 },
    { id: 14, vehicleId: 4, name: '标准电池组', sn: 'BAT20260004', model: 'FD-BAT-50Ah', category: 'battery', installedAt: '2025-11-20', status: 3 },
    { id: 15, vehicleId: 4, name: '前向图传摄像头', sn: 'CAM20260004', model: 'FD-CAM-120W', category: 'camera', installedAt: '2025-11-20', status: 1 },
    { id: 16, vehicleId: 4, name: '1/16 竞速版底盘', sn: 'CHS20260004', model: 'FD-CHS-116', category: 'chassis', installedAt: '2025-11-20', status: 1 }
  ],
  diagnosisSnapshots: [
    { id: 1, vehicleId: 1, reportedAt: '2026-09-07 10:23:00', soc: 67, voltage: 48.2, current: 12.5, temperature: 32, signalRsrp: -82, signalJitter: 18, faultCodes: [], gpsStatus: 1, imuStatus: 1 },
    { id: 2, vehicleId: 2, reportedAt: '2026-09-07 09:45:00', soc: 45, voltage: 47.1, current: 0, temperature: 28, signalRsrp: -88, signalJitter: 22, faultCodes: [], gpsStatus: 1, imuStatus: 1 },
    { id: 3, vehicleId: 3, reportedAt: '2026-09-06 16:30:00', soc: 12, voltage: 44.5, current: 0, temperature: 35, signalRsrp: -95, signalJitter: 35, faultCodes: ['BMS_001'], gpsStatus: 0, imuStatus: 1 },
    { id: 4, vehicleId: 4, reportedAt: '2026-09-01 11:20:00', soc: 0, voltage: 0, current: 0, temperature: 0, signalRsrp: -120, signalJitter: 0, faultCodes: ['NET_001', 'BMS_002'], gpsStatus: 0, imuStatus: 0 }
  ],
  maintenanceRecords: [
    { id: 1, vehicleId: 1, type: 'routine', item: '轮胎磨损检查', triggerMileage: 3000, triggerDate: null, completedAt: '2026-08-15', cost: 120, operator: '王师傅', status: 1, remark: '' },
    { id: 2, vehicleId: 2, type: 'routine', item: '电池健康检查', triggerMileage: null, triggerDate: '2026-09-10', completedAt: null, cost: 0, operator: '', status: 0, remark: '' },
    { id: 3, vehicleId: 3, type: 'repair', item: '转向舵机更换', triggerMileage: null, triggerDate: null, completedAt: '2026-08-20', cost: 280, operator: '李师傅', status: 1, remark: '' },
    { id: 4, vehicleId: 4, type: 'repair', item: '图传摄像头维修', triggerMileage: null, triggerDate: null, completedAt: '2026-08-01', cost: 350, operator: '张师傅', status: 1, remark: '' }
  ],
  accidentRecords: [
    { id: 1, vehicleId: 2, type: 'rollover', occurredAt: '2026-07-20 15:30:00', location: '北京昌平越野基地B区', description: '过驼峰时侧翻，车身无损伤', responsibility: 'player', repairCost: 0, status: 1 },
    { id: 2, vehicleId: 4, type: 'collision', occurredAt: '2026-06-15 10:20:00', location: '杭州余杭野外场地东侧', description: '转向舵机故障导致撞树', responsibility: 'device', repairCost: 420, status: 1 },
    { id: 3, vehicleId: 4, type: 'collision', occurredAt: '2026-07-08 14:10:00', location: '杭州余杭野外场地北侧', description: '玩家超速冲出围栏撞护栏', responsibility: 'player', repairCost: 680, status: 1 }
  ],
  otaRecords: [
    { id: 1, version: 'v1.2.3', description: '优化断线重连策略，修复低速抖动', releaseAt: '2026-08-01', targetCount: 12, successCount: 12, failedCount: 0, status: 2 },
    { id: 2, version: 'v1.2.2', description: '提升弱网码率自适应', releaseAt: '2026-07-15', targetCount: 12, successCount: 11, failedCount: 1, status: 2 },
    { id: 3, version: 'v1.2.4', description: '新增电子围栏分级限速', releaseAt: '2026-09-05', targetCount: 4, successCount: 2, failedCount: 0, status: 1 }
  ],
  otaTaskDetails: [
    { id: 1, taskId: 1, vehicleId: 1, vehicleSn: 'FD20260001', fromVersion: 'v1.2.2', toVersion: 'v1.2.3', status: 2, startedAt: '2026-08-01 10:00:00', finishedAt: '2026-08-01 10:15:00' },
    { id: 2, taskId: 1, vehicleId: 2, vehicleSn: 'FD20260002', fromVersion: 'v1.2.2', toVersion: 'v1.2.3', status: 2, startedAt: '2026-08-01 10:00:00', finishedAt: '2026-08-01 10:16:00' },
    { id: 3, taskId: 2, vehicleId: 1, vehicleSn: 'FD20260001', fromVersion: 'v1.2.1', toVersion: 'v1.2.2', status: 2, startedAt: '2026-07-15 10:00:00', finishedAt: '2026-07-15 10:14:00' },
    { id: 4, taskId: 2, vehicleId: 3, vehicleSn: 'FD20260003', fromVersion: 'v1.2.1', toVersion: 'v1.2.2', status: 3, startedAt: '2026-07-15 10:00:00', finishedAt: '2026-07-15 10:20:00' },
    { id: 5, taskId: 3, vehicleId: 1, vehicleSn: 'FD20260001', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 2, startedAt: '2026-09-05 09:00:00', finishedAt: '2026-09-05 09:18:00' },
    { id: 6, taskId: 3, vehicleId: 2, vehicleSn: 'FD20260002', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 1, startedAt: '2026-09-05 09:00:00', finishedAt: null },
    { id: 7, taskId: 3, vehicleId: 3, vehicleSn: 'FD20260003', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 0, startedAt: null, finishedAt: null },
    { id: 8, taskId: 3, vehicleId: 4, vehicleSn: 'FD20260004', fromVersion: 'v1.2.3', toVersion: 'v1.2.4', status: 0, startedAt: null, finishedAt: null }
  ],
  maintenanceRules: [
    { id: 1, type: 'mileage', item: '轮胎磨损检查', threshold: 3000, unit: 'km', enabled: true, description: '每 3000km 检查轮胎磨损情况' },
    { id: 2, type: 'mileage', item: '底盘螺丝紧固', threshold: 2000, unit: 'km', enabled: true, description: '每 2000km 检查底盘螺丝松动' },
    { id: 3, type: 'cycle', item: '电池健康检查', threshold: 600, unit: '次', enabled: true, description: '电池循环次数达到 600 次触发检查' },
    { id: 4, type: 'time', item: '每季度保养', threshold: 90, unit: '天', enabled: true, description: '距离上次保养 90 天触发' },
    { id: 5, type: 'temperature', item: '电机过热检查', threshold: 55, unit: '℃', enabled: false, description: '电机温度超过 55℃ 累计 3 次触发' }
  ],
  controlLogs: [
    { id: 1, vehicleId: 1, type: 'flash', operator: 'admin', result: 'success', message: '灯闪找车 5 秒', createdAt: '2026-09-07 09:10:00' },
    { id: 2, vehicleId: 1, type: 'lock', operator: '运营小张', result: 'success', message: '远程锁车，车辆进入维护状态', createdAt: '2026-09-06 18:30:00' },
    { id: 3, vehicleId: 1, type: 'unlock', operator: '运营小张', result: 'success', message: '远程解锁，车辆恢复可租状态', createdAt: '2026-09-06 19:00:00' },
    { id: 4, vehicleId: 3, type: 'emergency_stop', operator: '客服小李', result: 'success', message: '紧急制动触发，车辆已驻车', createdAt: '2026-09-06 16:35:00' },
    { id: 5, vehicleId: 2, type: 'flash', operator: 'admin', result: 'success', message: '灯闪找车 3 秒', createdAt: '2026-09-05 11:20:00' }
  ],
  vehicleModels: [
    { id: 1, code: 'FD-YZ-PRO', name: '远征者 Pro', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '田园/竹林/森林', basePrice: 30, image: '#', description: '主力走量车型，悬挂行程适中，覆盖多数地貌' },
    { id: 2, code: 'FD-TS-LITE', name: '探索者 Lite', gearLevel: '1/16 竞速版', type: 'racing', recommendedSite: '沙盘/室内', basePrice: 15, image: '#', description: '入门档车型，小型轻量化，引流走量' },
    { id: 3, code: 'FD-DS-MAX', name: '沙漠卡 MAX', gearLevel: '1/8 硬核越野版', type: 'desert', recommendedSite: '沙漠/草原', basePrice: 60, image: '#', description: '硬核越野，大行程强动力，赛事用车' },
    { id: 4, code: 'FD-ROCK', name: '岩石攀爬者', gearLevel: '1/10 全地形版', type: 'crawler', recommendedSite: '岩石/林道', basePrice: 35, image: '#', description: '岩石攀爬车型，扭矩大，低速扭矩强' }
  ],
  shellOptions: [
    { id: 1, name: '北京吉普 212 经典涂装', compatibleModel: 'FD-YZ-PRO', price: 0, description: '默认涂装，随车附带' },
    { id: 2, name: '切诺基 越野涂装', compatibleModel: 'FD-YZ-PRO', price: 80, description: '经典美式 SUV 涂装，磨砂黑 + 银饰条' },
    { id: 3, name: '沙漠卡 拉力涂装', compatibleModel: 'FD-DS-MAX', price: 120, description: '黄黑配色拉力涂装' },
    { id: 4, name: '岩石车 工业灰', compatibleModel: 'FD-ROCK', price: 60, description: '金属灰 + 防滚架' },
    { id: 5, name: '霓虹轮胎光效', compatibleModel: 'ALL', price: 30, description: '软件叠加效果，可在玩家端应用' },
    { id: 6, name: '专属车牌（4 位自定义）', compatibleModel: 'ALL', price: 80, description: '玩家可自定义车牌号' }
  ],
  consumables: [
    { id: 1, code: 'BAT-FD-50', name: '标准电池组 50Ah', category: 'battery', unit: '块', price: 800, stock: 28, safeStock: 10, supplier: '宁德时代', compatibleModel: 'ALL' },
    { id: 2, code: 'TIRE-110-AT', name: '1/10 全地形轮胎', category: 'tire', unit: '只', price: 60, stock: 120, safeStock: 50, supplier: '锦湖', compatibleModel: 'FD-YZ-PRO' },
    { id: 3, code: 'TIRE-116-RS', name: '1/16 竞速胎', category: 'tire', unit: '只', price: 35, stock: 80, safeStock: 40, supplier: '锦湖', compatibleModel: 'FD-TS-LITE' },
    { id: 4, code: 'TIRE-118-RC', name: '1/8 越野胎', category: 'tire', unit: '只', price: 110, stock: 12, safeStock: 30, supplier: '锦湖', compatibleModel: 'FD-DS-MAX' },
    { id: 5, code: 'SERVO-STD', name: '标准舵机', category: 'servo', unit: '个', price: 90, stock: 45, safeStock: 20, supplier: '辉盛', compatibleModel: 'ALL' },
    { id: 6, code: 'ESC-110', name: '1/10 电调', category: 'esc', unit: '个', price: 220, stock: 8, safeStock: 15, supplier: '好盈', compatibleModel: 'FD-YZ-PRO' },
    { id: 7, code: 'CAM-120W', name: '广角摄像头 120°', category: 'camera', unit: '个', price: 350, stock: 22, safeStock: 10, supplier: '海康', compatibleModel: 'ALL' },
    { id: 8, code: 'CAM-CABLE', name: '摄像头 FPC 排线', category: 'cable', unit: '根', price: 18, stock: 60, safeStock: 30, supplier: '立讯', compatibleModel: 'ALL' }
  ],
  settlements: [
    { id: 1, franchiseeId: 1, periodStart: '2026-08-01', periodEnd: '2026-08-31', totalAmount: 125800, platformAmount: 18870, franchiseeAmount: 106930, status: 2 },
    { id: 2, franchiseeId: 3, periodStart: '2026-08-01', periodEnd: '2026-08-31', totalAmount: 98600, platformAmount: 17748, franchiseeAmount: 80852, status: 1 },
    { id: 3, franchiseeId: 1, periodStart: '2026-09-01', periodEnd: '2026-09-06', totalAmount: 26800, platformAmount: 4020, franchiseeAmount: 22780, status: 0 }
  ],
  withdrawals: [
    { id: 1, franchiseeId: 1, amount: 50000, bankAccount: '中国银行 6222 **** 0001', status: 0, createdAt: '2026-09-07 10:00:00' },
    { id: 2, franchiseeId: 3, amount: 30000, bankAccount: '工商银行 6222 **** 0002', status: 2, paidAt: '2026-09-06 15:00:00', createdAt: '2026-09-05 11:00:00' }
  ],
  orders: [
    { id: 1, vehicleId: 1, siteId: 1, franchiseeId: 1, durationMin: 30, amount: 128, platformAmount: 19.2, franchiseeAmount: 108.8, status: 1, createdAt: '2026-09-07 09:00:00' },
    { id: 2, vehicleId: 2, siteId: 1, franchiseeId: 1, durationMin: 60, amount: 238, platformAmount: 35.7, franchiseeAmount: 202.3, status: 1, createdAt: '2026-09-07 08:30:00' },
    { id: 3, vehicleId: 3, siteId: 2, franchiseeId: 3, durationMin: 45, amount: 168, platformAmount: 30.24, franchiseeAmount: 137.76, status: 2, createdAt: '2026-09-06 16:00:00' }
  ]
}

let vehicleIdSeq = 100
let consumableIdSeq = 100
let maintenanceIdSeq = 100
let accidentIdSeq = 100
let otaTaskIdSeq = 100

// ============== 工具函数 ==============
const json = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  })
  res.end(JSON.stringify(body))
}

const ok = (res, data = null, message = 'OK') => json(res, 200, { code: 0, message, data })
const fail = (res, status, message) => json(res, status, { code: status, message, data: null })

const readBody = (req) => new Promise(resolve => {
  let buf = ''
  req.on('data', chunk => buf += chunk)
  req.on('end', () => {
    try { resolve(buf ? JSON.parse(buf) : {}) } catch { resolve({}) }
  })
})

const getAuthToken = (req) => {
  const h = req.headers['authorization'] || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

const requireAuth = (req, res) => {
  const token = getAuthToken(req)
  if (!token || !store.tokens.has(token)) {
    fail(res, 401, '未授权，请先登录')
    return false
  }
  return true
}

const nextId = (arr) => arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1

// ============== 路由分发 ==============
const routes = []

const addRoute = (method, pattern, handler) => {
  const regex = new RegExp('^' + pattern.replace(/:[a-zA-Z]+/g, '([^/]+)') + '$')
  routes.push({ method, regex, handler })
}

// ====== 认证 ======
addRoute('POST', '/api/auth/login', async (req, res, body) => {
  const { username, password } = body
  const user = store.users.find(u => u.username === username && u.password === password)
  if (!user) return fail(res, 401, '用户名或密码错误')
  const token = 'mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
  store.tokens.set(token, user.id)
  user.lastLoginAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return ok(res, {
    token,
    user: { id: user.id, username: user.username, realName: user.realName, roles: user.roles, avatar: '' }
  }, '登录成功')
})

addRoute('POST', '/api/auth/logout', (req, res) => {
  const token = getAuthToken(req)
  if (token) store.tokens.delete(token)
  return ok(res, null, '已退出')
})

// ====== 加盟商 ======
addRoute('GET', '/api/franchisees', (req, res) => ok(res, store.franchisees))
addRoute('POST', '/api/franchisees', (req, res, body) => {
  const f = { id: nextId(store.franchisees), status: 0, joinedAt: null, ...body }
  store.franchisees.push(f); return ok(res, f, '创建成功')
})
addRoute('PUT', '/api/franchisees/:id', (req, res, body, params) => {
  const f = store.franchisees.find(x => x.id === Number(params[0]))
  if (!f) return fail(res, 404, '未找到')
  Object.assign(f, body); return ok(res, f, '更新成功')
})

// ====== 加盟商审核 ======
addRoute('GET', '/api/applications', (req, res) => ok(res, store.applications))
addRoute('POST', '/api/applications/:id/approve', (req, res, body, params) => {
  const a = store.applications.find(x => x.id === Number(params[0]))
  if (!a) return fail(res, 404, '未找到')
  a.status = 3; a.reviewRemark = body.remark || ''
  return ok(res, a, '审核通过')
})

// ====== 场地 ======
addRoute('GET', '/api/sites', (req, res) => ok(res, store.sites))

// ====== 车辆 ======
addRoute('GET', '/api/vehicles', (req, res) => ok(res, store.vehicles))
addRoute('GET', '/api/vehicles/:id', (req, res, body, params) => {
  const v = store.vehicles.find(x => x.id === Number(params[0]))
  return v ? ok(res, v) : fail(res, 404, '未找到')
})
addRoute('GET', '/api/vehicles/:id/standard-parts', (req, res, body, params) => {
  return ok(res, store.standardParts.filter(p => p.vehicleId === Number(params[0])))
})
addRoute('GET', '/api/vehicles/:id/diagnosis', (req, res, body, params) => {
  return ok(res, store.diagnosisSnapshots.find(d => d.vehicleId === Number(params[0])) || null)
})
addRoute('GET', '/api/vehicles/:id/maintenance', (req, res, body, params) => {
  return ok(res, store.maintenanceRecords.filter(r => r.vehicleId === Number(params[0])))
})
addRoute('GET', '/api/vehicles/:id/accidents', (req, res, body, params) => {
  return ok(res, store.accidentRecords.filter(r => r.vehicleId === Number(params[0])))
})
addRoute('GET', '/api/vehicles/:id/orders', (req, res, body, params) => {
  return ok(res, store.orders.filter(o => o.vehicleId === Number(params[0])))
})
addRoute('GET', '/api/vehicles/:id/control-logs', (req, res, body, params) => {
  return ok(res, store.controlLogs.filter(l => l.vehicleId === Number(params[0])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
})
addRoute('POST', '/api/vehicles/:id/command', (req, res, body, params) => {
  const v = store.vehicles.find(x => x.id === Number(params[0]))
  if (!v) return fail(res, 404, '未找到')
  const { type } = body
  const messages = { lock: '远程锁车成功', unlock: '远程解锁成功', flash: '灯闪指令已发送', emergency_stop: '紧急制动已触发' }
  store.controlLogs.push({
    id: nextId(store.controlLogs),
    vehicleId: v.id,
    type,
    operator: 'admin',
    result: 'success',
    message: messages[type] || '指令已发送',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  return ok(res, null, messages[type] || '指令已发送')
})

addRoute('POST', '/api/vehicles', (req, res, body) => {
  const v = { id: ++vehicleIdSeq, status: 0, totalMileage: 0, onlineRate7d: 0, onlineRate30d: 0, orderCount: 0, totalRevenue: 0, totalDrivingMinutes: 0, repairCount: 0, accidentCount: 0, lastOnlineAt: null, ...body }
  store.vehicles.push(v); return ok(res, v, '车辆已入库')
})

// ====== 电池 ======
addRoute('GET', '/api/batteries', (req, res) => ok(res, store.batteries))
addRoute('GET', '/api/battery-alerts', (req, res) => ok(res, store.batteryAlerts))

// ====== OTA ======
addRoute('GET', '/api/ota/tasks', (req, res) => ok(res, store.otaRecords))
addRoute('GET', '/api/ota/tasks/:id/details', (req, res, body, params) => {
  return ok(res, store.otaTaskDetails.filter(t => t.taskId === Number(params[0])))
})
addRoute('POST', '/api/ota/tasks', (req, res, body) => {
  const task = {
    id: nextId(store.otaRecords),
    successCount: 0,
    failedCount: 0,
    status: 1,
    releaseAt: new Date().toISOString().slice(0, 10),
    ...body
  }
  store.otaRecords.push(task)
  // 自动生成任务详情
  const targetVehicleIds = body.targetVehicleIds || []
  targetVehicleIds.forEach(vid => {
    const v = store.vehicles.find(x => x.id === vid)
    if (v) {
      store.otaTaskDetails.push({
        id: nextId(store.otaTaskDetails),
        taskId: task.id,
        vehicleId: vid,
        vehicleSn: v.sn,
        fromVersion: v.firmwareVersion,
        toVersion: task.version,
        status: 0,
        startedAt: null,
        finishedAt: null
      })
    }
  })
  return ok(res, task, 'OTA 任务已创建')
})

// ====== 保养规则 ======
addRoute('GET', '/api/maintenance/rules', (req, res) => ok(res, store.maintenanceRules))
addRoute('PUT', '/api/maintenance/rules/:id', (req, res, body, params) => {
  const r = store.maintenanceRules.find(x => x.id === Number(params[0]))
  if (!r) return fail(res, 404, '未找到')
  Object.assign(r, body); return ok(res, r, '规则已更新')
})
addRoute('POST', '/api/maintenance/records', (req, res, body) => {
  const r = { id: ++maintenanceIdSeq, status: 1, completedAt: new Date().toISOString().slice(0, 10), ...body }
  store.maintenanceRecords.push(r); return ok(res, r, '维修记录已录入')
})
addRoute('POST', '/api/maintenance/pending', (req, res, body) => {
  // 标记待保养为完成
  return ok(res, null, '已标记完成')
})

// ====== 事故定责 ======
addRoute('POST', '/api/accidents/:id/resolve', (req, res, body, params) => {
  const a = store.accidentRecords.find(x => x.id === Number(params[0]))
  if (!a) return fail(res, 404, '未找到')
  a.responsibility = body.responsibility
  a.repairCost = body.repairCost || 0
  a.status = 1
  return ok(res, a, '定责完成')
})

// ====== 车型库 ======
addRoute('GET', '/api/vehicle-models', (req, res) => ok(res, store.vehicleModels))
addRoute('POST', '/api/vehicle-models', (req, res, body) => {
  const m = { id: nextId(store.vehicleModels), ...body }
  store.vehicleModels.push(m); return ok(res, m, '车型已新增')
})
addRoute('PUT', '/api/vehicle-models/:id', (req, res, body, params) => {
  const m = store.vehicleModels.find(x => x.id === Number(params[0]))
  if (!m) return fail(res, 404, '未找到')
  Object.assign(m, body); return ok(res, m, '车型已更新')
})

// ====== 外壳选件 ======
addRoute('GET', '/api/shell-options', (req, res) => ok(res, store.shellOptions))

// ====== 易耗件库存 ======
addRoute('GET', '/api/consumables', (req, res) => ok(res, store.consumables))
addRoute('POST', '/api/consumables', (req, res, body) => {
  const c = { id: ++consumableIdSeq, ...body }
  store.consumables.push(c); return ok(res, c, '易耗件已新增')
})
addRoute('PUT', '/api/consumables/:id', (req, res, body, params) => {
  const c = store.consumables.find(x => x.id === Number(params[0]))
  if (!c) return fail(res, 404, '未找到')
  Object.assign(c, body); return ok(res, c, '易耗件已更新')
})
addRoute('POST', '/api/consumables/:id/restock', (req, res, body, params) => {
  const c = store.consumables.find(x => x.id === Number(params[0]))
  if (!c) return fail(res, 404, '未找到')
  c.stock += body.quantity || 0
  return ok(res, c, `入库成功 +${body.quantity}`)
})
addRoute('GET', '/api/consumables/alerts', (req, res) => {
  const alerts = store.consumables.filter(c => c.stock <= c.safeStock).map((c, idx) => ({
    id: idx + 1,
    consumableId: c.id,
    consumableCode: c.code,
    consumableName: c.name,
    currentStock: c.stock,
    safeStock: c.safeStock,
    severity: c.stock < c.safeStock / 2 ? 3 : 2,
    createdAt: '2026-09-07 08:00:00'
  }))
  return ok(res, alerts)
})

// ====== 财务 ======
addRoute('GET', '/api/settlements', (req, res) => ok(res, store.settlements))
addRoute('GET', '/api/withdrawals', (req, res) => ok(res, store.withdrawals))

// ====== 订单 ======
addRoute('GET', '/api/orders', (req, res) => ok(res, store.orders))

// ============== 启动 ==============
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return json(res, 200, {})
  }
  const parsed = url.parse(req.url, true)
  const path = parsed.pathname
  const matched = routes.find(r => r.method === req.method && r.regex.test(path))
  if (!matched) return fail(res, 404, `接口不存在: ${req.method} ${path}`)
  // 登录接口无需鉴权
  if (path !== '/api/auth/login') {
    if (!requireAuth(req, res)) return
  }
  const params = path.match(matched.regex).slice(1)
  const body = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {}
  try {
    return matched.handler(req, res, body, params)
  } catch (e) {
    console.error('Route error:', e)
    return fail(res, 500, e.message || '服务器内部错误')
  }
})

server.listen(PORT, () => {
  console.log(`[mock-server] http://localhost:${PORT}`)
  console.log('默认账号: admin / admin123')
})