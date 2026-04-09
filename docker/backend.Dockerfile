# 构建阶段
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY backend/package*.json ./

# 安装依赖（包括开发依赖，因为需要构建）
RUN npm ci

# 复制源代码
COPY backend/ ./

# 构建应用
RUN npm run build

# 清理开发依赖
RUN npm prune --production

# 生产阶段
FROM node:18-alpine

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# 复制配置文件
COPY docker/wait-for.sh /wait-for.sh
RUN chmod +x /wait-for.sh

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "dist/index.js"]