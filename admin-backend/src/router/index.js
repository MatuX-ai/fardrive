import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      },
      {
        path: 'market',
        name: 'MarketData',
        component: () => import('@/views/market/MarketDataView.vue'),
        meta: { title: '市场数据', icon: 'DataAnalysis' }
      },
      {
        path: 'franchisee',
        name: 'Franchisee',
        redirect: '/franchisee/list',
        meta: { title: '运营管理', icon: 'OfficeBuilding' },
        children: [
          {
            path: 'list',
            name: 'FranchiseeList',
            component: () => import('@/views/franchisee/FranchiseeList.vue'),
            meta: { title: '加盟商列表' }
          },
          {
            path: 'audit',
            name: 'FranchiseeAudit',
            component: () => import('@/views/franchisee/FranchiseeAudit.vue'),
            meta: { title: '准入审核' }
          },
          {
            path: 'promotion-admin',
            name: 'PromotionAdmin',
            component: () => import('@/views/franchisee/PromotionAdmin.vue'),
            meta: { title: '推广总览' }
          }
        ]
      },
      {
        path: 'merchant',
        name: 'Merchant',
        redirect: '/merchant/center',
        meta: { title: '加盟商中心', icon: 'Shop' },
        children: [
          {
            path: 'center',
            name: 'FranchiseeCenter',
            component: () => import('@/views/franchisee/FranchiseeCenter.vue'),
            meta: { title: '我的商户中心' }
          },
          {
            path: 'promotion',
            name: 'FranchiseePromotion',
            component: () => import('@/views/franchisee/PromotionCenter.vue'),
            meta: { title: '我的推广' }
          },
          {
            path: 'detail/:id',
            name: 'FranchiseeDetail',
            component: () => import('@/views/franchisee/FranchiseeDetail.vue'),
            meta: { title: '商户详情', hidden: true }
          }
        ]
      },
      {
        path: 'vehicle',
        name: 'Vehicle',
        redirect: '/vehicle/list',
        meta: { title: '车辆资产', icon: 'Van' },
        children: [
          {
            path: 'list',
            name: 'VehicleList',
            component: () => import('@/views/vehicle/VehicleList.vue'),
            meta: { title: '车辆列表' }
          },
          {
            path: 'archive/:id',
            name: 'VehicleDetail',
            component: () => import('@/views/vehicle/VehicleDetail.vue'),
            meta: { title: '车辆档案', hidden: true }
          },
          {
            path: 'diagnosis/:id',
            name: 'VehicleDiagnosis',
            component: () => import('@/views/vehicle/VehicleDiagnosis.vue'),
            meta: { title: '远程诊断', hidden: true }
          },
          {
            path: 'ota',
            name: 'OtaManage',
            component: () => import('@/views/vehicle/OtaManage.vue'),
            meta: { title: 'OTA 管理' }
          },
          {
            path: 'maintenance',
            name: 'Maintenance',
            component: () => import('@/views/vehicle/Maintenance.vue'),
            meta: { title: '保养提醒' }
          },
          {
            path: 'publish',
            name: 'VehiclePublish',
            component: () => import('@/views/vehicle/VehiclePublish.vue'),
            meta: { title: '新车发布' }
          },
          {
            path: 'models',
            name: 'VehicleModels',
            component: () => import('@/views/vehicle/VehicleModels.vue'),
            meta: { title: '车辆参数库' }
          },
          {
            path: 'consumables',
            name: 'Consumables',
            component: () => import('@/views/vehicle/Consumables.vue'),
            meta: { title: '易耗件库存' }
          },
          {
            path: 'accidents',
            name: 'AccidentRecord',
            component: () => import('@/views/vehicle/AccidentRecord.vue'),
            meta: { title: '维修/事故' }
          },
          {
            path: 'analytics',
            name: 'VehicleAnalytics',
            component: () => import('@/views/vehicle/VehicleAnalytics.vue'),
            meta: { title: '车辆分析' }
          }
        ]
      },
      {
        path: 'battery',
        name: 'Battery',
        redirect: '/battery/monitor',
        meta: { title: '电池监控', icon: 'Lightning' },
        children: [
          {
            path: 'monitor',
            name: 'BatteryMonitor',
            component: () => import('@/views/battery/BatteryMonitor.vue'),
            meta: { title: '健康度监控' }
          },
          {
            path: 'alert',
            name: 'BatteryAlert',
            component: () => import('@/views/battery/BatteryAlert.vue'),
            meta: { title: '复购预警' }
          }
        ]
      },
      {
        path: 'finance',
        name: 'Finance',
        redirect: '/finance/settlement',
        meta: { title: '财务结算', icon: 'Money' },
        children: [
          {
            path: 'settlement',
            name: 'SettlementList',
            component: () => import('@/views/finance/SettlementList.vue'),
            meta: { title: '结算单' }
          },
          {
            path: 'withdrawal',
            name: 'WithdrawalList',
            component: () => import('@/views/finance/WithdrawalList.vue'),
            meta: { title: '提现审批' }
          }
        ]
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user',
            name: 'UserList',
            component: () => import('@/views/system/UserList.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'role',
            name: 'RoleList',
            component: () => import('@/views/system/RoleList.vue'),
            meta: { title: '角色权限' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (!to.meta.public && !authStore.token) {
    next('/login')
  } else if (to.path === '/login' && authStore.token) {
    next('/')
  } else {
    next()
  }
})

export { routes }

export default router
