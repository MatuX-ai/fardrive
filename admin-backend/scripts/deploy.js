/**
 * 部署脚本：把 Vite 构建产物自动复制到 marketing-site/admin/
 * 执行 npm run build 时会自动调用此脚本。
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const targetDir = path.resolve(projectRoot, '..', 'marketing-site', 'admin')

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`源目录不存在: ${src}（请先执行 vite build）`)
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function collectFiles(dir, baseDir = dir) {
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      result.push(...collectFiles(p, baseDir))
    } else {
      result.push({
        relative: path.relative(baseDir, p).replace(/\\/g, '/'),
        size: stat.size
      })
    }
  }
  return result
}

console.log('▶ 开始部署到 marketing-site/admin/')

try {
  console.log(`  源: ${distDir}`)
  console.log(`  目标: ${targetDir}`)

  console.log('  - 清理旧产物...')
  removeDir(targetDir)

  console.log('  - 复制新产物...')
  copyDir(distDir, targetDir)

  const files = collectFiles(targetDir)
  const totalSize = files.reduce((s, f) => s + f.size, 0)

  console.log(`\n✅ 部署完成：${files.length} 个文件，合计 ${formatSize(totalSize)}`)
  console.log(`   入口: ${path.join(targetDir, 'index.html').replace(/\\/g, '/')}`)
  console.log('\n下一步:')
  console.log('  - 推送至部署平台（Vercel 等）')
  console.log('  - 访问 https://<your-domain>/admin 验证')
  console.log('  - 登录账号：admin / admin123')
} catch (err) {
  console.error('\n❌ 部署失败:', err.message)
  process.exit(1)
}