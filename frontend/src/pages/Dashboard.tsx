import React from 'react'
import { Row, Col, Card, Statistic, Space, Button, Progress, List, Tag } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { Line, Pie, Column } from '@ant-design/charts'
import { useQuery } from '@tanstack/react-query'

// 导入服务
import { dashboardService } from '@/services/dashboard.service'
import LoadingSpinner from '@/components/LoadingSpinner'

// 统计卡片组件
const StatCard: React.FC<{
  title: string
  value: number | string
  prefix?: React.ReactNode
  suffix?: string
  trend?: number
  icon: React.ReactNode
  color?: string
}> = ({ title, value, prefix, suffix, trend, icon, color = '#1890ff' }) => (
  <Card>
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
        <div style={{ fontSize: 24, color }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend >= 0 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#f5222d' }} />
          )}
          <span style={{ color: trend >= 0 ? '#52c41a' : '#f5222d', fontSize: 12 }}>
            {Math.abs(trend)}% 较上月
          </span>
        </div>
      )}
    </Space>
  </Card>
)

const Dashboard: React.FC = () => {
  // 获取仪表板数据
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    refetchInterval: 30000 // 30秒刷新一次
  })

  if (isLoading || !dashboardData) {
    return <LoadingSpinner />
  }

  const {
    stats,
    recentOrders,
    topProducts,
    monthlyTrend,
    carrierPerformance
  } = dashboardData

  // 订单趋势图配置
  const orderTrendConfig = {
    data: monthlyTrend,
    xField: 'month',
    yField: 'orders',
    point: {
      size: 5,
      shape: 'diamond'
    },
    label: {
      style: {
        fill: '#aaa'
      }
    },
    color: '#1890ff'
  }

  // 收入趋势图配置
  const revenueTrendConfig = {
    data: monthlyTrend,
    xField: 'month',
    yField: 'revenue',
    point: {
      size: 5,
      shape: 'circle'
    },
    color: '#52c41a'
  }

  // 产品分布图配置
  const productDistributionConfig = {
    data: topProducts,
    angleField: 'count',
    colorField: 'product',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}'
    },
    interactions: [{ type: 'element-active' }]
  }

  // 承运商性能图配置
  const carrierPerformanceConfig = {
    data: carrierPerformance,
    xField: 'carrier',
    yField: 'onTimeRate',
    label: {
      style: {
        fill: '#aaa'
      }
    },
    color: '#722ed1'
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>仪表板</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          跨境物流管理系统概览 {new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="总订单数"
            value={stats.totalOrders}
            trend={12.5}
            icon={<ShoppingOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="总收入"
            value={stats.totalRevenue}
            suffix="USD"
            trend={8.3}
            icon={<DollarOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="活跃客户"
            value={stats.activeCustomers}
            trend={5.7}
            icon={<TeamOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="准时送达率"
            value={stats.onTimeDeliveryRate}
            suffix="%"
            trend={2.1}
            icon={<ClockCircleOutlined />}
            color="#fa8c16"
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="订单趋势" extra={<Button type="link">详情</Button>}>
            <Line {...orderTrendConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收入趋势" extra={<Button type="link">详情</Button>}>
            <Line {...revenueTrendConfig} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="热门物流产品分布">
            <Pie {...productDistributionConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="承运商准时率">
            <Column {...carrierPerformanceConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* 最近订单和快速操作 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="最近订单" 
            extra={<Button type="link">查看全部</Button>}
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={recentOrders}
              renderItem={(order) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">查看</Button>,
                    <Button type="link" size="small">跟踪</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      order.status === 'delivered' ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : order.status === 'shipped' ? (
                        <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
                      )
                    }
                    title={
                      <Space>
                        <span>订单 #{order.orderNumber}</span>
                        <Tag color={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'shipped' ? 'processing' :
                          'warning'
                        }>
                          {order.status}
                        </Tag>
                      </Space>
                    }
                    description={`${order.origin} → ${order.destination} | ${order.serviceLevel}`}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                      ${order.totalAmount}
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {order.createdAt}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block icon={<ShoppingOutlined />}>
                新建报价
              </Button>
              <Button block icon={<TeamOutlined />}>
                管理客户
              </Button>
              <Button block icon={<DollarOutlined />}>
                查看财务报表
              </Button>
              <Button block icon={<ClockCircleOutlined />}>
                处理待办事项
              </Button>
            </Space>
            
            <div style={{ marginTop: 24 }}>
              <h4>系统状态</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>API服务</span>
                    <Tag color="success">正常</Tag>
                  </div>
                  <Progress percent={100} size="small" status="active" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>数据库</span>
                    <Tag color="success">正常</Tag>
                  </div>
                  <Progress percent={85} size="small" status="active" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>缓存服务</span>
                    <Tag color="success">正常</Tag>
                  </div>
                  <Progress percent={92} size="small" status="active" />
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 底部信息 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#666' }}>今日待处理：</span>
                <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                  {stats.pendingTasks} 个任务
                </span>
              </div>
              <div>
                <span style={{ color: '#666' }}>数据更新时间：</span>
                <span style={{ marginLeft: 8 }}>
                  {new Date().toLocaleTimeString('zh-CN')}
                </span>
              </div>
              <Button type="link" size="small">刷新数据</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard