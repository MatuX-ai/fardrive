// 市场数据 / BI 分析 - Mock 数据

// 整体营收概览
export const mockRevenueOverview = {
  today: 5320,
  thisWeek: 32180,
  thisMonth: 138560,
  total: 2158940,
  growth: { today: 12, week: 18, month: 23, total: 0 }
}

// 各场地销量 TOP10
export const mockSiteSales = [
  { site: '北京昌平越野基地', orders: 286, amount: 52480, growth: 18 },
  { site: '广州从化山地公园', orders: 232, amount: 41820, growth: 12 },
  { site: '杭州余杭野外场地', orders: 198, amount: 36720, growth: -5 },
  { site: '成都龙泉越野公园', orders: 176, amount: 32680, growth: 24 },
  { site: '上海青浦赛车谷', orders: 156, amount: 28960, growth: 9 },
  { site: '深圳大鹏半岛基地', orders: 142, amount: 26240, growth: 15 },
  { site: '西安秦岭野外公园', orders: 128, amount: 23160, growth: 7 },
  { site: '重庆南山基地', orders: 116, amount: 20880, growth: 11 },
  { site: '南京紫金山越野园', orders: 98, amount: 17520, growth: -3 },
  { site: '武汉东湖基地', orders: 86, amount: 15420, growth: 21 }
]

// 用户充值分析
export const mockRechargeData = {
  // 充值金额分段（漏斗形）
  amountBuckets: [
    { range: '50元以下', count: 1240, percent: 28.5 },
    { range: '50-200元', count: 1580, percent: 36.3 },
    { range: '200-500元', count: 920, percent: 21.1 },
    { range: '500-1000元', count: 460, percent: 10.6 },
    { range: '1000元以上', count: 156, percent: 3.5 }
  ],
  // 充值次数分布
  frequency: [
    { times: '1次', users: 3820 },
    { times: '2-3次', users: 1860 },
    { times: '4-6次', users: 920 },
    { times: '7-10次', users: 380 },
    { times: '10次以上', users: 220 }
  ],
  totalAmount: 568200,
  totalUsers: 7200
}

// 车型预订分布
export const mockModelDistribution = [
  { model: '远征者 Pro', orders: 1280, percent: 36.5, color: '#12233D' },
  { model: '探索者 Lite', orders: 960, percent: 27.4, color: '#1E3A5F' },
  { model: '征服者 X', orders: 620, percent: 17.7, color: '#E8A33D' },
  { model: '极速者 R', orders: 380, percent: 10.8, color: '#C97F1F' },
  { model: '入门版 S', orders: 268, percent: 7.6, color: '#5F7D5B' }
]

// 价格带预订分布
export const mockPriceDistribution = [
  { range: '0-50元', orders: 580, amount: 17400 },
  { range: '50-100元', orders: 820, amount: 65600 },
  { range: '100-200元', orders: 1120, amount: 156800 },
  { range: '200-300元', orders: 640, amount: 160000 },
  { range: '300-500元', orders: 280, amount: 112000 },
  { range: '500元以上', orders: 68, amount: 47600 }
]

// 营收趋势（近30天）
export const mockRevenueTrend30 = {
  dates: (() => {
    const dates = []
    const today = new Date('2026-09-07')
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth() + 1}.${d.getDate()}`)
    }
    return dates
  })(),
  platformIncome: [3200, 4100, 3800, 4500, 4200, 5100, 4800, 5300, 4900, 5600, 5400, 6100, 5800, 6300, 6000, 6700, 6500, 7200, 6900, 7500, 7300, 7800, 7600, 8100, 7900, 8400, 8200, 8500, 8300, 8700],
  franchiseeIncome: [21280, 27340, 25220, 29880, 27940, 33900, 31880, 35220, 32640, 37280, 35940, 40580, 38520, 41860, 39880, 44540, 43220, 47880, 45880, 49880, 48540, 51860, 50520, 53880, 52540, 55880, 54540, 56580, 55180, 57860]
}

// 预订时段分布（24h × 星期）
export const mockHourlyHeatmap = (() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return { days, hours, data: generateHeatmapData() }
})()

function generateHeatmapData() {
  // 周末高峰，工作日晚高峰
  const seed = [[12, 15, 26, 38, 62, 84, 96, 78, 52, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20],
    [12, 15, 28, 40, 64, 86, 98, 80, 54, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22],
    [12, 16, 30, 42, 66, 88, 100, 82, 56, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24],
    [14, 18, 32, 44, 68, 90, 102, 84, 58, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26],
    [20, 24, 36, 48, 72, 92, 106, 88, 62, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30],
    [80, 96, 110, 118, 124, 128, 132, 120, 95, 88, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58],
    [82, 98, 112, 120, 126, 130, 134, 122, 98, 90, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60]
  ]
  return seed
}

// 用户新增/复购趋势
export const mockUserTrend30 = {
  dates: (() => {
    const dates = []
    const today = new Date('2026-09-07')
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth() + 1}.${d.getDate()}`)
    }
    return dates
  })(),
  newUsers: [86, 92, 78, 96, 108, 124, 116, 132, 142, 138, 152, 168, 156, 172, 184, 192, 176, 198, 212, 204, 218, 232, 226, 248, 256, 268, 262, 284, 292, 308],
  returningUsers: [42, 46, 38, 52, 58, 64, 60, 72, 78, 76, 86, 92, 88, 96, 108, 112, 106, 124, 132, 128, 142, 156, 148, 168, 176, 188, 182, 208, 216, 232]
}