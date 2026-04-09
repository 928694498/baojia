# 贡献指南

感谢您考虑为跨境物流管理系统项目做出贡献！以下是参与项目的指南。

## 代码贡献流程

### 1. 准备工作
- Fork 本仓库到您的 GitHub 账户
- Clone 您的 fork 到本地
- 设置上游仓库：`git remote add upstream https://github.com/{原仓库地址}.git`
- 确保您已经安装了 Node.js 18+ 和 Docker

### 2. 创建开发环境
```bash
# 安装依赖
cd frontend && npm install
cd ../backend && npm install
cd ../wechat-bot && npm install

# 启动开发环境
./deploy.sh dev
```

### 3. 创建功能分支
```bash
# 从最新主分支创建功能分支
git checkout -b feature/your-feature-name
```

### 4. 实现功能
- 遵循项目代码规范
- 编写测试代码
- 更新相关文档
- 确保 CI/CD 流程通过

### 5. 提交代码
```bash
# 添加更改
git add .

# 提交（使用语义化提交信息）
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复某个bug"
git commit -m "docs: 更新文档"
git commit -m "style: 代码格式调整"
git commit -m "refactor: 代码重构"
git commit -m "test: 添加测试"
git commit -m "chore: 构建过程或辅助工具的变动"

# 推送到您的 fork
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request
1. 在 GitHub 上创建 Pull Request
2. 确保 PR 描述清晰
3. 关联相关 Issue
4. 等待代码审查

## 代码规范

### 前端规范
- 使用 TypeScript 严格模式
- 使用 ESLint + Prettier
- 组件命名使用 PascalCase
- 函数命名使用 camelCase
- 遵循 React Hooks 最佳实践

### 后端规范
- 使用 TypeScript 严格模式
- 使用 Express.js 框架规范
- 服务层和控制器层分离
- 错误处理统一管理
- 日志记录规范化

### 数据库规范
- 使用 MongoDB 最佳实践
- 索引优化
- 数据验证
- 迁移脚本管理

## 测试要求

### 单元测试
- 覆盖率要求 > 80%
- 使用 Jest 测试框架
- Mock 外部依赖

### 集成测试
- API 端点测试
- 数据库集成测试
- 第三方服务集成测试

### E2E 测试
- 用户流程测试
- 跨浏览器测试

## 文档要求

### 代码文档
- 公共 API 需要 JSDoc 注释
- 复杂逻辑需要行内注释
- 保持 README 更新

### 技术文档
- API 文档使用 OpenAPI 规范
- 架构文档保持更新
- 部署文档详细清晰

## 发布流程

### 版本管理
- 使用语义化版本 (SemVer)
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能新增
- 修订版本号：向下兼容的问题修正

### 发布步骤
1. 创建发布分支
2. 更新版本号
3. 更新 CHANGELOG
4. 运行完整的 CI/CD 流程
5. 创建 GitHub Release
6. 部署到生产环境

## 安全注意事项

### 代码安全
- 避免硬编码敏感信息
- 使用环境变量管理配置
- 验证用户输入
- 防止 SQL/NoSQL 注入

### 依赖安全
- 定期更新依赖包
- 使用依赖漏洞扫描
- 审查第三方库的安全性

## 沟通渠道

- 问题讨论：GitHub Issues
- 代码审查：GitHub Pull Requests
- 紧急问题：使用 Issue 标签

## 行为准则

我们遵循 [贡献者公约](https://www.contributor-covenant.org/version/2/1/code_of_conduct/zh_cn/)。请确保您的行为符合该准则。

---

感谢您的贡献！🎉