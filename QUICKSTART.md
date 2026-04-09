# 跨境物流管理系统 - 快速启动指南

## 系统要求

### 硬件要求
- **CPU**: 2核以上
- **内存**: 4GB以上
- **磁盘**: 10GB可用空间

### 软件要求
- **操作系统**: Windows 10+/macOS 10.15+/Linux Ubuntu 20.04+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (仅开发需要)
- **Git**: 2.30+

## 快速启动

### 方法一：使用Docker Compose（推荐）

1. **克隆项目**
```bash
git clone <your-repository-url>
cd baojia
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

3. **启动所有服务**
```bash
# 给予执行权限
chmod +x deploy.sh

# 启动服务
./deploy.sh start
```

4. **访问系统**
- 前端应用: http://localhost:3001
- 后端API: http://localhost:3000
- API文档: http://localhost:3000/api/docs
- 微信机器人: http://localhost:3002

### 方法二：手动安装（开发环境）

1. **安装后端依赖**
```bash
cd backend
npm install
```

2. **安装前端依赖**
```bash
cd frontend
npm install
```

3. **安装微信机器人依赖**
```bash
cd wechat-bot
npm install
```

4. **启动数据库服务**
```bash
cd ..
docker-compose up mongodb redis rabbitmq -d
```

5. **启动后端服务**
```bash
cd backend
npm run dev
```

6. **启动前端服务**
```bash
cd frontend
npm run dev
```

7. **启动微信机器人服务**
```bash
cd wechat-bot
npm run dev
```

## 初始配置

### 1. 数据库初始化
系统首次启动时会自动创建必要的数据库和索引。

### 2. 管理员账户
默认管理员账户：
- **用户名**: admin@logistics.com
- **密码**: admin123

首次登录后请立即修改密码。

### 3. 企业微信机器人配置
1. 在企业微信后台创建应用
2. 获取以下信息并配置到 `.env` 文件：
   - `WECHAT_CORP_ID`: 企业ID
   - `WECHAT_AGENT_ID`: 应用AgentId
   - `WECHAT_SECRET`: 应用Secret
   - `WECHAT_TOKEN`: 接收消息Token
   - `WECHAT_ENCODING_AES_KEY`: 加密EncodingAESKey

3. 配置回调URL：`http://your-domain.com/wechat/callback`

### 4. 物流产品导入
系统提供了示例数据导入功能：
1. 登录管理员账户
2. 进入"物流管理" → "物流产品"
3. 点击"批量导入"按钮
4. 下载模板文件，填写数据后上传

## 核心功能演示

### 1. 物流产品查询
1. 访问 http://localhost:3001
2. 登录后进入"物流管理" → "物流产品"
3. 使用筛选条件搜索物流产品
4. 查看产品详情和价格信息

### 2. 获取报价
1. 进入"物流管理" → "报价管理"
2. 点击"新建报价"按钮
3. 填写起运地、目的地、包裹信息
4. 系统自动计算多个物流方案的价格
5. 选择合适方案并保存报价

### 3. 创建订单
1. 在报价页面选择"创建订单"
2. 填写收货人信息和支付方式
3. 确认订单并支付
4. 在"订单管理"中跟踪订单状态

### 4. 使用微信机器人
1. 在企业微信中添加机器人
2. 发送以下指令测试：
   - "查询产品"
   - "从上海到纽约，10kg包裹报价"
   - "订单状态 ABC123"
   - "帮助"

## 开发和测试

### 运行测试
```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test

# 集成测试
cd backend
npm run test:integration
```

### 代码质量检查
```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 部署到生产环境

### 1. 准备生产环境
```bash
# 修改环境变量为生产配置
cp .env.production.example .env.production

# 构建生产镜像
./deploy.sh build

# 推送镜像到仓库
./deploy.sh push
```

### 2. 服务器部署
```bash
# 在服务器上克隆项目
git clone <your-repository-url>
cd baojia

# 配置生产环境变量
vim .env.production

# 启动生产服务
./deploy.sh start
```

### 3. 使用Kubernetes部署（高级）
```bash
# 应用Kubernetes配置
kubectl apply -f kubernetes/production/

# 查看部署状态
kubectl get pods -n logistics-production

# 查看服务
kubectl get services -n logistics-production
```

## 常见问题

### Q1: 服务启动失败怎么办？
A: 检查以下内容：
1. Docker和Docker Compose是否已安装
2. 端口是否被占用（3000, 3001, 3002, 27017, 6379）
3. 环境变量配置文件是否正确
4. 查看日志：`./deploy.sh logs`

### Q2: 如何备份数据？
A: 使用备份脚本：
```bash
./deploy.sh backup
```

### Q3: 如何更新系统？
A: 使用更新脚本：
```bash
./deploy.sh update
```

### Q4: 如何添加新的物流产品？
A: 有几种方式：
1. 在Web界面手动添加
2. 使用批量导入功能
3. 通过API接口添加

### Q5: 如何监控系统状态？
A: 访问监控面板：
- Grafana: http://localhost:3003 (用户名: admin, 密码: admin)
- 查看服务状态：`./deploy.sh status`

## 获取帮助

### 文档资源
- [架构设计](./docs/ARCHITECTURE.md)
- [API文档](http://localhost:3000/api/docs)
- [用户手册](./docs/USER_GUIDE.md)

### 技术支持
- **GitHub Issues**: 报告问题和功能请求
- **Email**: support@logistics.com
- **企业微信群**: 扫描二维码加入技术支持群

### 社区支持
- 加入我们的开发者社区
- 参与开源贡献
- 分享使用经验

---

## 下一步

1. **配置企业微信机器人** - 实现智能客服功能
2. **导入物流产品数据** - 完善产品库
3. **设置支付网关** - 开通在线支付
4. **配置邮件通知** - 设置系统通知
5. **设置监控告警** - 确保系统稳定运行

**提示**: 建议在生产环境部署前，先在测试环境充分测试所有功能。

---

*快速启动指南版本: v1.0*
*最后更新: 2024年1月*