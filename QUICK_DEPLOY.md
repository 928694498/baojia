# 🚀 跨境物流管理系统 - 5分钟部署到GitHub

## 📦 一键部署脚本

```bash
# 1. 下载项目（如果您还没有）
git clone https://github.com/your-username/cross-border-logistics.git
cd cross-border-logistics

# 2. 运行一键部署脚本
chmod +x deploy-to-github.sh
./deploy-to-github.sh all
```

## 🎯 手动部署步骤

### 第1步：创建GitHub仓库
1. 访问 https://github.com/new
2. 仓库名：`cross-border-logistics`
3. 描述：`跨境物流管理系统`
4. **不要初始化README.md**（项目已有）
5. 点击"创建仓库"

### 第2步：本地初始化
```bash
# 初始化Git
git init
git add .
git commit -m "feat: 跨境物流管理系统 v1.0.0"

# 连接到GitHub（替换your-username）
git remote add origin https://github.com/your-username/cross-border-logistics.git
git push -u origin main
```

### 第3步：配置GitHub Pages
1. 进入仓库 Settings → Pages
2. 分支：选择 `gh-pages`（会自动创建）
3. 文件夹：选择 `/ (root)`
4. 点击"保存"

### 第4步：等待部署完成
- 自动部署需要2-5分钟
- 查看进度：Actions标签页
- 部署成功：绿色对勾

### 第5步：访问您的网站
```
https://your-username.github.io/cross-border-logistics
```

## 📱 功能预览

您的网站将包含以下功能：

### 🏠 首页
- 系统概览和统计数据
- 快速导航菜单

### 📦 物流产品
- 产品列表和搜索
- 价格和库存管理
- 分类和标签

### 💰 报价系统
- 实时运费计算
- 批量报价功能
- 历史报价查询

### 🤖 微信机器人
- 智能问答界面
- 消息记录查看
- 机器人配置

### ⚙️ 系统管理
- 用户权限管理
- 系统配置
- 数据备份

## 🔧 后续配置

### 1. 配置企业微信
1. 登录企业微信管理后台
2. 创建应用 → 获取 CorpID 和 Secret
3. 配置回调URL：`https://your-site.com/api/wechat/callback`
4. 设置机器人权限

### 2. 配置数据库
```bash
# 本地开发
docker-compose up mongodb redis

# 生产环境
# 使用云数据库服务（MongoDB Atlas，Redis Cloud等）
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env`：
```bash
# 后端API地址
VITE_API_URL=https://your-username.github.io/cross-border-logistics/api

# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_SECRET=your_secret

# 数据库配置
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
```

## 📊 监控和维护

### 自动监控
- ✅ 网站可用性监控
- ✅ 错误日志收集
- ✅ 性能指标监控
- ✅ 自动备份

### 手动检查
1. **每日检查**
   - 网站是否可访问
   - 错误日志是否有异常

2. **每周检查**
   - 依赖包安全更新
   - 数据库性能优化
   - 日志文件清理

3. **每月检查**
   - 安全漏洞扫描
   - 备份完整性验证
   - 成本优化分析

## 🆘 常见问题

### Q1: 部署失败，显示404错误
**解决：**
1. 检查GitHub Pages配置是否正确
2. 等待5分钟后重试
3. 查看Actions日志具体错误

### Q2: 网站可以访问，但数据加载失败
**解决：**
1. 检查API地址配置（VITE_API_URL）
2. 检查后端服务是否运行
3. 查看浏览器控制台错误

### Q3: 企业微信机器人不响应
**解决：**
1. 验证CorpID和Secret是否正确
2. 检查回调URL是否配置正确
3. 确认机器人权限设置

### Q4: 如何更新网站？
**解决：**
```bash
# 1. 本地修改代码
git add .
git commit -m "feat: 更新功能"

# 2. 推送到GitHub
git push origin main

# 3. 自动重新部署（约2分钟）
```

## 🎨 自定义配置

### 修改网站标题
```javascript
// frontend/src/App.tsx
const appTitle = "您的物流管理系统";
```

### 修改主题颜色
```css
/* frontend/src/styles/theme.less */
@primary-color: #1890ff; /* 主色调 */
@success-color: #52c41a; /* 成功色 */
@warning-color: #faad14; /* 警告色 */
@error-color: #f5222d;   /* 错误色 */
```

### 添加新页面
1. 在 `frontend/src/pages/` 创建新组件
2. 在路由配置中添加路径
3. 在菜单配置中添加导航项

## 📈 高级部署选项

### 使用自定义域名
1. 购买域名（如：logistics.yourcompany.com）
2. 在DNS添加CNAME记录指向GitHub
3. 在GitHub Pages设置自定义域名

### 配置HTTPS
1. GitHub Pages自动提供HTTPS
2. 自定义域名需要启用"Enforce HTTPS"
3. 证书自动更新

### 多环境部署
- **开发环境**: `dev.your-username.github.io`
- **测试环境**: `staging.your-username.github.io`
- **生产环境**: `your-username.github.io`

## 🏆 最佳实践

### 1. 代码管理
- 使用功能分支开发
- 提交前运行本地测试
- 保持提交信息清晰

### 2. 部署策略
- 主分支自动部署
- 重要版本创建标签
- 保持回滚能力

### 3. 安全防护
- 定期更新依赖包
- 监控异常访问
- 备份重要数据

### 4. 性能优化
- 压缩静态资源
- 启用浏览器缓存
- 优化数据库查询

## 🎉 恭喜！您的系统已就绪

### 下一步操作
1. ✅ 系统已部署到GitHub Pages
2. 🔧 配置企业微信机器人
3. 📊 添加物流产品数据
4. 👥 邀请团队成员使用
5. 📈 开始业务数据分析

### 获取帮助
- 📚 详细文档：查看 `docs/` 目录
- 🐛 报告问题：GitHub Issues
- 💡 功能建议：GitHub Discussions
- 🔧 技术支持：查看部署脚本帮助

---
**您的跨境物流管理系统现已上线！开始智能物流管理之旅吧！** 🚀