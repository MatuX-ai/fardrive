// 异步数据加载 composable：封装 loading / error / data 三态
// 用法：const { loading, error, data, run, reload } = useAsync(() => vehicleApi.list())
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ApiError } from '@/api/http'

export const useAsync = (loader, options = {}) => {
  const { immediate = true, silent = false, defaultValue = null } = options

  const loading = ref(false)
  const error = ref(null)
  const data = ref(defaultValue)

  const run = async (...args) => {
    loading.value = true
    error.value = null
    try {
      const result = await loader(...args)
      data.value = result
      return result
    } catch (e) {
      error.value = e
      if (!silent && !(e instanceof ApiError && e.code === 401)) {
        ElMessage.error(e?.message || '请求失败')
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const reload = (...args) => run(...args)

  if (immediate) {
    run()
  }

  return { loading, error, data, run, reload }
}