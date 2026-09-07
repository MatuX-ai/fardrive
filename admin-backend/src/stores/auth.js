import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('fardrive_admin_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('fardrive_admin_user') || 'null'))

  const login = async (username, password) => {
    try {
      const data = await authApi.login(username, password)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('fardrive_admin_token', token.value)
      localStorage.setItem('fardrive_admin_user', JSON.stringify(user.value))
      return true
    } catch (e) {
      console.error('Login failed:', e)
      return false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore
    }
    token.value = ''
    user.value = null
    localStorage.removeItem('fardrive_admin_token')
    localStorage.removeItem('fardrive_admin_user')
  }

  return { token, user, login, logout }
})