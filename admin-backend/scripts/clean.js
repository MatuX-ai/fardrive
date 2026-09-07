/**
 * 清理脚本
 * 删除 dist/ 与 marketing-site/admin/ 目录，确保全新构建
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const targetDir = path.resolve(projectRoot, '..', 'marketing-site', 'admin')

function removeDir(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`  - ${label || dir}: 不存在，跳过`)
    return
  }
  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`  ✓ 已清理 ${label || dir}`)
}

console.log('▶ 清理旧产物...')
removeDir(distDir, 'dist/')
removeDir(targetDir, 'marketing-site/admin/')