# GitHub 部署指南

本指南详细说明如何将跨境物流管理系统部署到GitHub。

## 目录

1. [准备阶段](#准备阶段)
2. [创建GitHub仓库](#创建github仓库)
3. [初始化Git仓库](#初始化git仓库)
4. [配置GitHub Actions](#配置github-actions)
5. [部署到GitHub Pages](#部署到github-pages)
6. [配置自定义域名](#配置自定义域名)
7. [自动部署流程](#自动部署流程)
8. [监控和维护](#监控和维护)
9. [故障排除](#故障排除)

## 准备阶段

### 1. 环境要求
- Git 2.30+
- Node.js 18.x
- GitHub 账户
- 本地项目代码

### 2. 检查项目状态
```bash
# 检查项目结构
ls -la

# 检查必要的文件
ls .github/workflows/
ls frontend/
ls backend/
ls wechat-bot/
```

## 创建GitHub仓库

### 1. 创建新仓库
1. 访问 https://github.com/new
2. 输入仓库名称：`cross-border-logistics`
3. 描述：`跨境物流管理系统 - 企业级物流解决方案`
4. 选择：公开 (Public)
5. 不要初始化README.md（我们已经有自己的）
6. 点击"创建仓库"

### 2. 获取仓库信息
- 仓库地址：`https://github.com/{您的用户名}/cross-border-logistics.git`
- 保存此地址备用

## 初始化Git仓库

### 1. 本地初始化
```bash
# 进入项目目录
cd /path/to/baojia

# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交初始版本
git commit -m "feat: 初始版本 - 跨境物流管理系统 v1.0.0"

# 添加远程仓库
git remote add origin https://github.com/{您的用户名}/cross-border-logistics.git

# 推送到GitHub
git push -u origin main
```

### 2. 配置Git信息
```bash
# 设置用户名和邮箱
git config user.name "您的姓名"
git config user.email "您的邮箱@example.com"

# 设置默认分支
git branch -M main
```

## 配置GitHub Actions

### 1. 必要的Secrets配置
在GitHub仓库设置中配置以下Secrets：

#### 必须配置
- 无需特殊Secrets即可运行基础CI/CD

#### 可选配置（高级功能）
```
# Docker镜像推送
DOCKERHUB_USERNAME=您的用户名
DOCKERHUB_TOKEN=您的token

# Kubernetes部署
KUBECONFIG_STAGING=base64编码的kubeconfig
KUBECONFIG_PRODUCTION=base64编码的kubeconfig

# 通知集成
SLACK_WEBHOOK_URL=SlackWebhookURL
DISCORD_WEBHOOK_URL=DiscordWebhookURL

# 自定义域名
CUSTOM_DOMAIN=您的域名.com
```

### 2. 启用GitHub Actions
1. 进入仓库 → Settings → Actions → General
2. 确保Actions已启用
3. 设置工作流权限：
   - ✅ 读仓库内容权限
   - ✅ 写包权限
   - ✅ 发送通知权限

### 3. 验证工作流文件
```yaml
# 检查工作流文件
cat .github/workflows/ci-cd.yml
cat .github/workflows/deploy-github-pages.yml
cat .github/workflows/code-quality.yml
cat .github/workflows/release.yml
```

## 部署到GitHub Pages

### 1. 启用GitHub Pages
1. 进入仓库 → Settings → Pages
2. 分支：`gh-pages`（自动创建）
3. 文件夹：`/(root)`
4. 点击"保存"

### 2. 手动触发首次部署
```bash
# 推送代码触发部署
git push origin main

# 或者通过GitHub界面
# 1. 进入 Actions 标签页
# 2. 找到 "Deploy to GitHub Pages"
# 3. 点击 "Run workflow"
```

### 3. 访问部署的网站
- 默认地址：`https://{您的用户名}.github.io/cross-border-logistics`
- 部署完成后会自动显示

## 配置自定义域名

### 1. 准备工作
1. 拥有一个域名（如：`logistics.example.com`）
2. 在域名注册商处配置DNS

### 2. 在GitHub配置
1. 进入仓库 → Settings → Pages
2. 在"Custom domain"输入您的域名
3. 点击"Save"

### 3. DNS配置示例
```dns
# A记录（指向GitHub IP）
@  A     185.199.108.153
@  A     185.199.109.153
@  A     185.199.110.153
@  A     185.199.111.153

# CNAME记录（子域名）
www CNAME {您的用户名}.github.io
```

### 4. HTTPS强制启用
1. 等待DNS传播（最多48小时）
2. 返回Pages设置
3. 勾选"Enforce HTTPS"

## 自动部署流程

### 1. CI/CD流水线触发条件
```yaml
# 自动触发
- push 到 main 分支
- push 到 develop 分支
- 创建 Pull Request
- 定时任务（每天凌晨2点）
- 手动触发（workflow_dispatch）
```

### 2. 部署阶段
```
1. 代码质量检查 (Lint + TypeScript)
2. 单元测试
3. 集成测试
4. 构建应用
5. Docker镜像构建
6. GitHub Pages部署
7. 创建Release
```

### 3. 部署状态检查
```bash
# 查看部署状态
# GitHub界面：Actions → 查看运行状态

# 部署成功后
# 1. 网站可用：https://{您的用户名}.github.io/cross-border-logistics
# 2. Release创建：Releases标签页
# 3. Docker镜像：Packages标签页
```

## 监控和维护

### 1. 监控面板
1. **GitHub Actions监控**：Actions标签页
2. **网站可用性**：Settings → Pages → 查看部署状态
3. **错误日志**：Actions运行日志

### 2. 维护任务
#### 每月检查
- 更新依赖包
- 检查安全漏洞
- 清理旧的工作流运行记录
- 备份重要数据

#### 季度检查
- 评估部署性能
- 优化工作流配置
- 更新文档
- 安全审计

### 3. 性能优化建议
```yaml
# 优化CI/CD性能
- 使用缓存：node_modules, Docker layers
- 并行运行测试
- 增量构建
- 按需触发工作流
```

## 故障排除

### 常见问题

#### 1. 部署失败 - 权限不足
**症状**：GitHub Actions运行失败，提示权限错误
**解决**：
1. 检查仓库Settings → Actions → General
2. 确保有足够的权限
3. 检查Secrets配置是否正确

#### 2. GitHub Pages 404错误
**症状**：网站返回404
**解决**：
1. 检查Pages设置是否正确
2. 查看Actions日志中的构建错误
3. 确认构建文件存在

#### 3. Docker构建失败
**症状**：Docker镜像构建超时或失败
**解决**：
1. 检查Dockerfile语法
2. 确保网络连接正常
3. 使用更小的基础镜像

#### 4. 自定义域名无法访问
**症状**：自定义域名显示GitHub 404页面
**解决**：
1. 检查DNS配置是否正确
2. 等待DNS传播
3. 检查GitHub Pages的Custom domain设置

### 调试命令
```bash
# 查看工作流运行状态
gh run list --workflow=deploy-github-pages.yml

# 查看详细日志
gh run watch <run-id> --log

# 重新运行失败的工作流
gh run rerun <run-id>
```

### 联系支持
- GitHub官方文档：https://docs.github.com
- GitHub社区：https://github.com/community
- 项目Issue：https://github.com/{您的用户名}/cross-border-logistics/issues

## 高级配置

### 1. 多环境部署
```yaml
# .github/workflows/deploy-multi-env.yml
# 支持开发、预生产、生产环境
```

### 2. 蓝绿部署
```yaml
# 零停机部署策略
# 使用Docker标签和Kubernetes滚动更新
```

### 3. 自动回滚
```yaml
# 当健康检查失败时自动回滚
# 基于Prometheus监控指标
```

### 4. 成本优化
```yaml
# 使用自托管Runner
# 优化缓存策略
# 按需运行工作流
```

## 最佳实践

### 1. 安全性
- 定期轮换Secrets
- 最小权限原则
- 代码安全扫描
- 依赖漏洞检查

### 2. 可靠性
- 部署前测试
- 回滚计划
- 监控告警
- 定期备份

### 3. 成本控制
- 优化工作流运行时间
- 清理旧的工作流记录
- 使用缓存减少构建时间

### 4. 性能优化
- 并行运行任务
- 增量构建
- 使用更小的基础镜像
- 优化网络请求

---

## 下一步

### 立即操作
1. ✅ 创建GitHub仓库
2. ✅ 推送代码到GitHub
3. ✅ 配置GitHub Pages
4. ✅ 触发首次部署
5. ✅ 访问部署的网站

### 后续优化
1. 🔄 配置自定义域名
2. 🔄 设置监控告警
3. 🔄 优化部署性能
4. 🔄 实现蓝绿部署

### 长期规划
1. 📅 多区域部署
2. 📅 自动扩缩容
3. 📅 AI驱动的运维
4. 📅 完整的DevSecOps流程

---

## 支持与帮助

如果您遇到问题或有改进建议：

1. 📖 查看详细文档：`docs/`目录
2. 🐛 报告问题：GitHub Issues
3. 💬 社区讨论：GitHub Discussions
4. 📧 联系维护者：您的邮箱

祝您部署顺利！🎉