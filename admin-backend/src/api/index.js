// 业务 API：按业务域拆分方法调用，全部基于 http 客户端
import * as http from './http'

export const authApi = {
  login: (username, password) => http.post('/api/auth/login', { username, password }),
  logout: () => http.post('/api/auth/logout')
}

export const franchiseeApi = {
  list: () => http.get('/api/franchisees'),
  create: (data) => http.post('/api/franchisees', data),
  update: (id, data) => http.put(`/api/franchisees/${id}`, data)
}

export const applicationApi = {
  list: () => http.get('/api/applications'),
  approve: (id, remark) => http.post(`/api/applications/${id}/approve`, { remark })
}

export const siteApi = {
  list: () => http.get('/api/sites')
}

export const vehicleApi = {
  list: () => http.get('/api/vehicles'),
  detail: (id) => http.get(`/api/vehicles/${id}`),
  create: (data) => http.post('/api/vehicles', data),
  standardParts: (id) => http.get(`/api/vehicles/${id}/standard-parts`),
  diagnosis: (id) => http.get(`/api/vehicles/${id}/diagnosis`),
  maintenance: (id) => http.get(`/api/vehicles/${id}/maintenance`),
  accidents: (id) => http.get(`/api/vehicles/${id}/accidents`),
  orders: (id) => http.get(`/api/vehicles/${id}/orders`),
  controlLogs: (id) => http.get(`/api/vehicles/${id}/control-logs`),
  sendCommand: (id, type) => http.post(`/api/vehicles/${id}/command`, { type })
}

export const batteryApi = {
  list: () => http.get('/api/batteries'),
  alerts: () => http.get('/api/battery-alerts')
}

export const otaApi = {
  tasks: () => http.get('/api/ota/tasks'),
  details: (id) => http.get(`/api/ota/tasks/${id}/details`),
  create: (data) => http.post('/api/ota/tasks', data)
}

export const maintenanceApi = {
  rules: () => http.get('/api/maintenance/rules'),
  list: () => http.get('/api/maintenance/rules'),
  updateRule: (id, data) => http.put(`/api/maintenance/rules/${id}`, data),
  createRecord: (data) => http.post('/api/maintenance/records', data)
}

export const accidentApi = {
  resolve: (id, data) => http.post(`/api/accidents/${id}/resolve`, data)
}

export const modelApi = {
  list: () => http.get('/api/vehicle-models'),
  create: (data) => http.post('/api/vehicle-models', data),
  update: (id, data) => http.put(`/api/vehicle-models/${id}`, data)
}

export const shellApi = {
  list: () => http.get('/api/shell-options')
}

export const consumableApi = {
  list: () => http.get('/api/consumables'),
  create: (data) => http.post('/api/consumables', data),
  update: (id, data) => http.put(`/api/consumables/${id}`, data),
  restock: (id, quantity) => http.post(`/api/consumables/${id}/restock`, { quantity }),
  alerts: () => http.get('/api/consumables/alerts')
}

export const financeApi = {
  settlements: () => http.get('/api/settlements'),
  withdrawals: () => http.get('/api/withdrawals')
}

export const orderApi = {
  list: () => http.get('/api/orders')
}