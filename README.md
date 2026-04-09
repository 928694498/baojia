# 跨境物流管理系统 (Cross-border Logistics Management System)

## 🚀 一键部署到GitHub
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live-success)](https://github.com/your-username/cross-border-logistics)
[![CI/CD](https://github.com/your-username/cross-border-logistics/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/cross-border-logistics/actions/workflows/ci-cd.yml)
[![Deploy](https://github.com/your-username/cross-border-logistics/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/your-username/cross-border-logistics/actions/workflows/deploy-github-pages.yml)

## 📖 项目概述
一个完整的跨境物流管理系统，提供产品查询、实时报价、销售管理功能，并集成企业微信机器人API实现智能问答。支持一键部署到GitHub Pages。

## ✨ 核心功能
- **🌐 跨境物流产品查询**: 支持多种物流渠道、运输方式、时效查询
- **💰 跨境物流报价**: 实时计算物流费用，支持批量报价
- **📦 产品售卖方法**: 销售策略、渠道管理、客户关系管理
- **🤖 企业微信机器人**: 集成企业微信API，实现智能问答
- **🖥️ 可视化Web界面**: 现代化管理后台，数据可视化展示
- **⚡ 一键GitHub部署**: 自动化CI/CD，GitHub Pages托管

## 🛠️ 技术栈
- **前端**: React 18 + TypeScript + Ant Design + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: MongoDB + Redis
- **消息队列**: RabbitMQ
- **CI/CD**: GitHub Actions
- **部署**: Docker + Kubernetes + GitHub Pages
- **监控**: Prometheus + Grafana

## 📁 项目结构
```
baojia/
├── frontend/          # 前端React应用
├── backend/           # 后端Node.js服务
├── wechat-bot/        # 企业微信机器人服务
├── shared/            # 共享代码和类型定义
├── docker/            # Docker配置
├── kubernetes/        # K8s部署配置
├── .github/           # GitHub Actions工作流
├── docs/              # 项目文档
├── deploy-to-github.sh # GitHub部署脚本
└── deploy.sh          # 本地部署脚本
```

## 🚀 GitHub部署指南

### 快速部署（推荐）
```bash
# 使用一键部署脚本
chmod +x deploy-to-github.sh
./deploy-to-github.sh all
```

### 手动部署步骤
1. **创建GitHub仓库**
   ```bash
   # 初始化Git
   git init
   git add .
   git commit -m "feat: 初始版本"
   
   # 推送到GitHub
   git remote add origin https://github.com/your-username/cross-border-logistics.git
   git push -u origin main
   ```

2. **配置GitHub Pages**
   - 进入仓库 Settings → Pages
   - 分支: `gh-pages`
   - 文件夹: `/ (root)`
   - 保存设置

3. **触发部署**
   ```bash
   git push origin main
   ```

4. **访问网站**
   - 地址: `https://your-username.github.io/cross-border-logistics`
   - 等待约2-5分钟部署完成

### 部署脚本说明
```bash
# 查看可用命令
./deploy-to-github.sh help

# 完整部署流程
./deploy-to-github.sh all

# 单独步骤
./deploy-to-github.sh init      # 初始化Git
./deploy-to-github.sh deploy    # 部署到Pages
./deploy-to-github.sh status    # 检查部署状态
./deploy-to-github.sh config    # 配置仓库
```

## 🎯 本地开发

### 快速开始
```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test
```

### Docker开发
```bash
# 启动所有服务
./deploy.sh dev

# 构建镜像
./deploy.sh build

# 停止服务
./deploy.sh stop
```

## 🔧 环境配置
复制 `.env.example` 为 `.env` 并配置相应变量。

```bash
# 前端环境变量
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=跨境物流管理系统

# 后端环境变量
MONGODB_URI=mongodb://localhost:27017/logistics
REDIS_URL=redis://localhost:6379

# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_SECRET=your_secret
```

## 📚 API文档
访问 `http://localhost:3000/api/docs` 查看Swagger API文档。

## 🤖 企业微信配置
1. 在企业微信后台创建应用
2. 配置回调URL和Token
3. 设置机器人权限
4. 获取CorpID和Secret

## 🔒 安全性
- JWT认证和授权
- 输入验证和过滤
- SQL/NoSQL注入防护
- XSS和CSRF防护
- API速率限制

## 📊 监控与日志
- 实时性能监控
- 错误追踪
- 用户行为分析
- 系统健康检查

## 🏗️ 部署架构
```
GitHub → GitHub Actions → Docker Hub → GitHub Pages
    ↓           ↓             ↓            ↓
前端构建 ← 测试验证 ← 镜像构建 ← 网站部署
    ↓           ↓             ↓            ↓
 用户访问 ← 健康检查 ← 监控告警 ← 日志收集
```

## 🤝 贡献指南
请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与贡献。

## 📄 许可证
MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 支持与帮助
- 📖 详细文档: [docs/](docs/)
- 🐛 报告问题: [GitHub Issues](https://github.com/your-username/cross-border-logistics/issues)
- 💬 讨论区: [GitHub Discussions](https://github.com/your-username/cross-border-logistics/discussions)

## 🎉 开始使用
1. 部署到GitHub: `./deploy-to-github.sh all`
2. 访问网站: `https://your-username.github.io/cross-border-logistics`
3. 配置企业微信机器人
4. 添加物流产品和报价规则
5. 开始使用智能物流管理系统！

---
*让跨境物流管理更智能、更高效！*