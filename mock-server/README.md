# Far Drive · Mock API 服务

基于 Node 原生 `http` 模块启动的轻量 mock 后端服务，无需任何第三方依赖。

## 启动

```bash
node server.js
# 或
node mock-server/server.js
```

默认监听 `http://localhost:5175`，可通过环境变量 `PORT` 修改。

## 默认账号

| 用户名 | 密码 | 角色 |
|:---|:---|:---|
| `admin` | `admin123` | 超级管理员 |

## 接口约定

所有接口统一返回结构：

```json
{
  "code": 0,
  "message": "OK",
  "data": { ... }
}
```

- `code`: 0 表示成功；非 0 表示业务失败（401/404/500 等）
- 除 `/api/auth/login` 外，其他接口需要在请求头携带 `Authorization: Bearer <token>`

## 已实现接口

### 认证
- `POST /api/auth/login` 登录
- `POST /api/auth/logout` 退出

### 加盟商 / 场地 / 审核
- `GET /api/franchisees` 加盟商列表
- `POST /api/franchisees` 新建加盟商
- `PUT /api/franchisees/:id` 更新加盟商
- `GET /api/applications` 准入审核列表
- `POST /api/applications/:id/approve` 审核通过
- `GET /api/sites` 场地列表

### 车辆
- `GET /api/vehicles` 车辆列表
- `GET /api/vehicles/:id` 车辆详情
- `POST /api/vehicles` 新车入库
- `GET /api/vehicles/:id/standard-parts` 标准件清单
- `GET /api/vehicles/:id/diagnosis` 诊断快照
- `GET /api/vehicles/:id/maintenance` 维修记录
- `GET /api/vehicles/:id/accidents` 事故记录
- `GET /api/vehicles/:id/orders` 订单
- `GET /api/vehicles/:id/control-logs` 控制日志
- `POST /api/vehicles/:id/command` 远程控制（lock/unlock/flash/emergency_stop）

### 电池
- `GET /api/batteries` 电池列表
- `GET /api/battery-alerts` 复购预警

### OTA
- `GET /api/ota/tasks` OTA 任务
- `GET /api/ota/tasks/:id/details` 任务详情
- `POST /api/ota/tasks` 创建 OTA 任务

### 保养
- `GET /api/maintenance/rules` 保养规则
- `PUT /api/maintenance/rules/:id` 更新规则
- `POST /api/maintenance/records` 录入维修
- `POST /api/maintenance/pending` 标记待保养完成

### 事故
- `POST /api/accidents/:id/resolve` 事故定责

### 车型库 / 选件 / 易耗件
- `GET /api/vehicle-models` 车型库
- `POST /api/vehicle-models` 新增车型
- `PUT /api/vehicle-models/:id` 更新车型
- `GET /api/shell-options` 外壳选件
- `GET /api/consumables` 易耗件
- `POST /api/consumables` 新增易耗件
- `PUT /api/consumables/:id` 更新易耗件
- `POST /api/consumables/:id/restock` 入库
- `GET /api/consumables/alerts` 库存预警

### 财务 / 订单
- `GET /api/settlements` 结算单
- `GET /api/withdrawals` 提现审批
- `GET /api/orders` 订单列表

## 与前端联调

前端 `admin-backend` 已切换为 HTTP 调用（`src/api/http.js`），跨域由 mock server 通过 `Access-Control-Allow-Origin: *` 处理。前端默认基地址 `http://localhost:5175`，可通过 `VITE_API_BASE` 覆盖。