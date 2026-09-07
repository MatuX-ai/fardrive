// HTTP 客户端：统一封装 fetch，统一处理鉴权与错误
import { useAuthStore } from '@/stores/auth'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175'

if (typeof window !== 'undefined') {
  console.info('[api] BASE =', BASE)
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const authStore = useAuthStore()
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }
  if (authStore.token) {
    finalHeaders['Authorization'] = `Bearer ${authStore.token}`
  }
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch (e) {
    throw new ApiError(-1, `网络错误：${e.message}`)
  }
  if (res.status === 401) {
    authStore.logout()
    throw new ApiError(401, '登录已过期，请重新登录')
  }
  let payload
  try {
    payload = await res.json()
  } catch {
    throw new ApiError(res.status, `响应解析失败 (HTTP ${res.status})`)
  }
  if (payload.code !== 0) {
    throw new ApiError(payload.code, payload.message || '请求失败')
  }
  return payload.data
}

export const get = (path) => request(path, { method: 'GET' })
export const post = (path, body) => request(path, { method: 'POST', body })
export const put = (path, body) => request(path, { method: 'PUT', body })
export const del = (path) => request(path, { method: 'DELETE' })