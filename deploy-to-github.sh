#!/bin/bash

# 跨境物流管理系统 - GitHub部署脚本
# 一键将项目部署到GitHub

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "跨境物流管理系统 - GitHub部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  init          初始化Git仓库并推送到GitHub"
    echo "  deploy        部署到GitHub Pages"
    echo "  status        检查部署状态"
    echo "  config        配置GitHub仓库"
    echo "  cleanup       清理本地Git文件"
    echo "  all           执行所有部署步骤"
    echo "  help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init       # 初始化并推送到GitHub"
    echo "  $0 deploy     # 部署到GitHub Pages"
    echo "  $0 all        # 执行完整部署流程"
}

# 检查环境
check_environment() {
    print_info "检查环境要求..."
    
    check_command git
    check_command node
    check_command npm
    
    # 检查Node.js版本
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "需要Node.js 18+，当前版本: $(node --version)"
        exit 1
    fi
    
    # 检查Git版本
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    print_info "Git版本: $GIT_VERSION"
    print_info "Node.js版本: $(node --version)"
    
    print_success "环境检查通过"
}

# 初始化Git仓库
init_git() {
    print_info "初始化Git仓库..."
    
    # 检查是否已经是Git仓库
    if [ -d ".git" ]; then
        print_warning "已经是Git仓库，跳过初始化"
        return 0
    fi
    
    # 初始化仓库
    git init
    
    # 配置Git
    if [ -z "$(git config user.name)" ]; then
        print_info "配置Git用户名..."
        read -p "请输入Git用户名: " git_name
        git config user.name "$git_name"
    fi
    
    if [ -z "$(git config user.email)" ]; then
        print_info "配置Git邮箱..."
        read -p "请输入Git邮箱: " git_email
        git config user.email "$git_email"
    fi
    
    # 设置默认分支
    git branch -M main
    
    # 添加所有文件
    print_info "添加文件到Git..."
    git add .
    
    # 提交初始版本
    print_info "提交初始版本..."
    git commit -m "feat: 初始版本 - 跨境物流管理系统 v1.0.0"
    
    print_success "Git仓库初始化完成"
}

# 配置GitHub仓库
configure_github() {
    print_info "配置GitHub仓库..."
    
    # 检查远程仓库是否已配置
    if git remote | grep -q "origin"; then
        print_warning "远程仓库已配置"
        CURRENT_ORIGIN=$(git remote get-url origin)
        print_info "当前远程仓库: $CURRENT_ORIGIN"
        
        read -p "是否更新远程仓库地址？ (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "请输入新的GitHub仓库URL:"
            read github_url
            git remote set-url origin "$github_url"
            print_success "远程仓库地址已更新"
        fi
    else
        print_info "请输入GitHub仓库URL (例如: https://github.com/username/repo.git):"
        read github_url
        
        if [ -z "$github_url" ]; then
            print_error "GitHub仓库URL不能为空"
            exit 1
        fi
        
        git remote add origin "$github_url"
        print_success "远程仓库已添加"
    fi
}

# 推送到GitHub
push_to_github() {
    print_info "推送到GitHub..."
    
    # 检查是否需要拉取
    print_info "检查远程仓库..."
    if ! git ls-remote --exit-code origin &> /dev/null; then
        print_error "无法连接到远程仓库，请检查网络和URL"
        exit 1
    fi
    
    # 尝试推送
    print_info "推送代码到GitHub..."
    if git push -u origin main; then
        print_success "代码推送成功"
    else
        print_error "推送失败，可能的原因："
        print_error "1. 远程仓库不存在"
        print_error "2. 权限不足"
        print_error "3. 网络问题"
        
        # 提供创建仓库的建议
        print_info ""
        print_info "如果仓库不存在，请先在GitHub创建仓库："
        print_info "1. 访问 https://github.com/new"
        print_info "2. 创建名为 cross-border-logistics 的仓库"
        print_info "3. 不要初始化README.md"
        print_info "4. 获取仓库URL并重新运行脚本"
        exit 1
    fi
}

# 部署到GitHub Pages
deploy_to_pages() {
    print_info "部署到GitHub Pages..."
    
    # 检查GitHub Actions工作流
    if [ ! -f ".github/workflows/deploy-github-pages.yml" ]; then
        print_error "GitHub Pages部署工作流不存在"
        exit 1
    fi
    
    print_info "GitHub Pages部署流程："
    print_info "1. 代码推送到main分支"
    print_info "2. GitHub Actions自动触发"
    print_info "3. 构建前端应用"
    print_info "4. 部署到GitHub Pages"
    print_info "5. 网站地址: https://{用户名}.github.io/{仓库名}"
    
    # 提示用户操作
    print_info ""
    print_info "请按以下步骤操作："
    print_info "1. 确保代码已推送到GitHub"
    print_info "2. 访问GitHub仓库页面"
    print_info "3. 进入 Settings → Pages"
    print_info "4. 配置分支为 gh-pages，文件夹为 /(root)"
    print_info "5. 等待部署完成（约2-5分钟）"
    
    # 提供快速链接
    REPO_NAME=$(basename $(git remote get-url origin) .git)
    USER_NAME=$(echo $(git remote get-url origin) | sed -n 's|.*github.com/\([^/]*\)/.*|\1|p')
    
    print_info ""
    print_info "快速链接："
    print_info "仓库页面: https://github.com/$USER_NAME/$REPO_NAME"
    print_info "Actions: https://github.com/$USER_NAME/$REPO_NAME/actions"
    print_info "Pages设置: https://github.com/$USER_NAME/$REPO_NAME/settings/pages"
}

# 检查部署状态
check_deployment_status() {
    print_info "检查部署状态..."
    
    # 获取仓库信息
    if ! REPO_URL=$(git remote get-url origin 2>/dev/null); then
        print_error "未配置远程仓库"
        return 1
    fi
    
    USER_NAME=$(echo $REPO_URL | sed -n 's|.*github.com/\([^/]*\)/.*|\1|p')
    REPO_NAME=$(basename $REPO_URL .git)
    
    print_info "GitHub仓库: $USER_NAME/$REPO_NAME"
    print_info "预计网站地址: https://$USER_NAME.github.io/$REPO_NAME"
    
    # 检查是否可以访问
    print_info "测试网站可访问性..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$USER_NAME.github.io/$REPO_NAME" | grep -q "200\|302"; then
        print_success "网站可正常访问"
        print_info "请访问: https://$USER_NAME.github.io/$REPO_NAME"
    else
        print_warning "网站可能还未部署完成"
        print_info "请稍后访问或检查部署状态"
        print_info "部署状态: https://github.com/$USER_NAME/$REPO_NAME/deployments"
    fi
}

# 清理本地Git文件
cleanup_local() {
    print_info "清理本地Git文件..."
    
    # 备份当前状态
    if [ -d ".git" ]; then
        print_warning "这将删除.git目录，请确保代码已推送到远程仓库"
        read -p "确认清理？ (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf .git
            print_success "本地Git文件已清理"
        else
            print_info "取消清理"
        fi
    else
        print_info "没有找到.git目录"
    fi
}

# 完整部署流程
full_deployment() {
    print_info "开始完整部署流程..."
    
    # 1. 检查环境
    check_environment
    
    # 2. 初始化Git
    init_git
    
    # 3. 配置GitHub
    configure_github
    
    # 4. 推送到GitHub
    push_to_github
    
    # 5. 部署到GitHub Pages
    deploy_to_pages
    
    # 6. 检查状态
    sleep 5  # 等待一下
    check_deployment_status
    
    print_success "部署流程完成！"
    print_info "下一步："
    print_info "1. 访问GitHub仓库配置Pages"
    print_info "2. 等待Actions完成部署"
    print_info "3. 访问部署的网站"
}

# 主函数
main() {
    COMMAND=${1:-"help"}
    
    case $COMMAND in
        init)
            check_environment
            init_git
            configure_github
            push_to_github
            ;;
        deploy)
            deploy_to_pages
            ;;
        status)
            check_deployment_status
            ;;
        config)
            configure_github
            ;;
        cleanup)
            cleanup_local
            ;;
        all)
            full_deployment
            ;;
        help)
            show_help
            ;;
        *)
            print_error "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"