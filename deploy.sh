#!/bin/bash

# ============================================
# 跨境物流管理系统 - 部署脚本
# ============================================

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "跨境物流管理系统部署脚本"
    echo ""
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  build          构建所有Docker镜像"
    echo "  start          启动所有服务"
    echo "  stop           停止所有服务"
    echo "  restart        重启所有服务"
    echo "  logs [服务名]  查看日志"
    echo "  status         查看服务状态"
    echo "  update         更新代码并重启"
    echo "  backup         备份数据"
    echo "  restore        恢复数据"
    echo "  clean          清理未使用的资源"
    echo "  help           显示此帮助信息"
}

# 构建Docker镜像
build_images() {
    log_info "开始构建Docker镜像..."
    
    # 检查环境变量文件
    if [ ! -f .env ]; then
        log_warning ".env 文件不存在，正在从 .env.example 创建..."
        cp .env.example .env
        log_warning "请编辑 .env 文件配置环境变量"
        exit 1
    fi
    
    # 加载环境变量
    set -a
    source .env
    set +a
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -f docker/frontend.Dockerfile -t $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-frontend:$VERSION .
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -f docker/backend.Dockerfile -t $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-backend:$VERSION .
    
    # 构建微信机器人镜像
    log_info "构建微信机器人镜像..."
    docker build -f docker/wechat-bot.Dockerfile -t $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-wechat-bot:$VERSION .
    
    log_success "所有镜像构建完成"
}

# 推送镜像到仓库
push_images() {
    log_info "推送镜像到仓库..."
    
    # 登录Docker Registry
    echo $DOCKER_PASSWORD | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin
    
    # 推送镜像
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-frontend:$VERSION
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-backend:$VERSION
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-wechat-bot:$VERSION
    
    # 同时推送latest标签
    docker tag $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-frontend:$VERSION $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-frontend:latest
    docker tag $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-backend:$VERSION $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-backend:latest
    docker tag $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-wechat-bot:$VERSION $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-wechat-bot:latest
    
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-frontend:latest
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-backend:latest
    docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/cross-border-logistics-wechat-bot:latest
    
    log_success "镜像推送完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 检查Docker Compose文件
    if [ ! -f docker/docker-compose.yml ]; then
        log_error "docker-compose.yml 文件不存在"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f .env ]; then
        log_error ".env 文件不存在"
        exit 1
    fi
    
    # 启动服务
    docker-compose -f docker/docker-compose.yml up -d
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    check_services_status
    
    log_success "服务启动完成"
    
    # 显示访问信息
    show_access_info
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose -f docker/docker-compose.yml down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    start_services
    log_success "服务重启完成"
}

# 查看日志
view_logs() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        docker-compose -f docker/docker-compose.yml logs -f
    else
        docker-compose -f docker/docker-compose.yml logs -f $SERVICE
    fi
}

# 查看服务状态
check_services_status() {
    log_info "服务状态检查..."
    
    SERVICES=("mongodb" "redis" "rabbitmq" "backend" "frontend" "wechat-bot")
    
    for SERVICE in "${SERVICES[@]}"; do
        CONTAINER_ID=$(docker-compose -f docker/docker-compose.yml ps -q $SERVICE)
        
        if [ -z "$CONTAINER_ID" ]; then
            log_error "$SERVICE: 未运行"
            continue
        fi
        
        STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_ID)
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID 2>/dev/null || echo "N/A")
        
        if [ "$STATUS" = "running" ]; then
            if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "N/A" ]; then
                log_success "$SERVICE: 运行中 ($HEALTH)"
            else
                log_warning "$SERVICE: 运行中但健康检查失败 ($HEALTH)"
            fi
        else
            log_error "$SERVICE: $STATUS"
        fi
    done
}

# 更新代码并重启
update_services() {
    log_info "更新服务..."
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin main
    
    # 重新构建并启动
    build_images
    restart_services
    
    log_success "服务更新完成"
}

# 备份数据
backup_data() {
    log_info "开始备份数据..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/backup_$TIMESTAMP"
    
    mkdir -p $BACKUP_DIR
    
    # 备份MongoDB
    log_info "备份MongoDB..."
    docker-compose -f docker/docker-compose.yml exec -T mongodb mongodump \
        --username $MONGO_ROOT_USER \
        --password $MONGO_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --archive > $BACKUP_DIR/mongodb_backup.archive
    
    # 备份Redis
    log_info "备份Redis..."
    docker-compose -f docker/docker-compose.yml exec -T redis redis-cli \
        --rdb /data/dump.rdb \
        --pass $REDIS_PASSWORD
    docker cp logistics-redis:/data/dump.rdb $BACKUP_DIR/redis_backup.rdb
    
    # 备份上传文件
    log_info "备份上传文件..."
    docker cp logistics-backend:/app/uploads $BACKUP_DIR/uploads
    
    # 创建备份压缩包
    tar -czf backups/backup_$TIMESTAMP.tar.gz $BACKUP_DIR
    
    # 清理临时文件
    rm -rf $BACKUP_DIR
    
    log_success "数据备份完成: backups/backup_$TIMESTAMP.tar.gz"
    
    # 保留最近7天的备份
    find backups -name "backup_*.tar.gz" -mtime +7 -delete
}

# 恢复数据
restore_data() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "请指定备份文件"
        echo "可用备份文件:"
        ls -la backups/backup_*.tar.gz 2>/dev/null || echo "无备份文件"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "备份文件不存在: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "从 $BACKUP_FILE 恢复数据..."
    
    # 停止服务
    stop_services
    
    # 解压备份文件
    TEMP_DIR="restore_$(date +%s)"
    mkdir -p $TEMP_DIR
    tar -xzf $BACKUP_FILE -C $TEMP_DIR
    
    # 恢复MongoDB
    log_info "恢复MongoDB..."
    docker-compose -f docker/docker-compose.yml up -d mongodb
    sleep 10
    
    cat $TEMP_DIR/*/mongodb_backup.archive | docker-compose -f docker/docker-compose.yml exec -T mongodb mongorestore \
        --username $MONGO_ROOT_USER \
        --password $MONGO_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --archive --drop
    
    # 恢复Redis
    log_info "恢复Redis..."
    docker-compose -f docker/docker-compose.yml up -d redis
    sleep 5
    
    docker cp $TEMP_DIR/*/redis_backup.rdb logistics-redis:/data/dump.rdb
    docker-compose -f docker/docker-compose.yml exec -T redis redis-cli --pass $REDIS_PASSWORD shutdown
    docker-compose -f docker/docker-compose.yml up -d redis
    
    # 恢复上传文件
    log_info "恢复上传文件..."
    docker-compose -f docker/docker-compose.yml up -d backend
    sleep 5
    
    docker cp $TEMP_DIR/*/uploads/. logistics-backend:/app/uploads
    
    # 清理临时文件
    rm -rf $TEMP_DIR
    
    # 启动所有服务
    start_services
    
    log_success "数据恢复完成"
}

# 清理资源
clean_resources() {
    log_info "清理未使用的资源..."
    
    # 清理未使用的镜像
    docker image prune -af
    
    # 清理未使用的容器
    docker container prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理构建缓存
    docker builder prune -af
    
    log_success "资源清理完成"
}

# 显示访问信息
show_access_info() {
    log_info "================== 访问信息 =================="
    log_info "前端应用: http://localhost:3001"
    log_info "后端API: http://localhost:3000"
    log_info "API文档: http://localhost:3000/api/docs"
    log_info "微信机器人: http://localhost:3002"
    log_info "RabbitMQ管理: http://localhost:15672"
    log_info "Grafana监控: http://localhost:3003"
    log_info "=============================================="
}

# 主函数
main() {
    # 检查必要命令
    check_command docker
    check_command docker-compose
    
    # 设置版本号
    VERSION=${VERSION:-$(date +%Y%m%d_%H%M%S)}
    
    case $1 in
        build)
            build_images
            ;;
        push)
            push_images
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            view_logs $2
            ;;
        status)
            check_services_status
            ;;
        update)
            update_services
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data $2
            ;;
        clean)
            clean_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"