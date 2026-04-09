import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Button, Space, Breadcrumb } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  CalculatorOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  FileTextOutlined,
  WechatOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

// 导入页面组件
import Dashboard from '@/pages/Dashboard'
import LogisticsProducts from '@/pages/LogisticsProducts'
import QuoteManager from '@/pages/QuoteManager'
import OrderManager from '@/pages/OrderManager'
import SalesMethods from '@/pages/SalesMethods'
import Analytics from '@/pages/Analytics'
import WeChatBot from '@/pages/WeChatBot'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'

// 导入自定义组件
import Logo from './Logo'
import LoadingSpinner from './LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const { Header, Sider, Content } = AntdLayout

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // 如果没有登录，重定向到登录页面
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板'
    },
    {
      key: 'logistics',
      icon: <ShoppingOutlined />,
      label: '物流管理',
      children: [
        {
          key: 'products',
          label: '物流产品'
        },
        {
          key: 'quotes',
          label: '报价管理'
        },
        {
          key: 'orders',
          label: '订单管理'
        }
      ]
    },
    {
      key: 'sales',
      icon: <TeamOutlined />,
      label: '销售管理',
      children: [
        {
          key: 'methods',
          label: '销售方法'
        },
        {
          key: 'agents',
          label: '代理管理'
        }
      ]
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析'
    },
    {
      key: 'wechat',
      icon: <WechatOutlined />,
      label: '微信机器人'
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: '文档管理'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料'
    },
    {
      key: 'theme',
      icon: theme === 'light' ? <DashboardOutlined /> : <DashboardOutlined />,
      label: theme === 'light' ? '切换到暗色主题' : '切换到亮色主题',
      onClick: toggleTheme
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    }
  ]

  // 面包屑配置
  const breadcrumbItems = [
    { title: '首页', href: '/' },
    { title: '当前页面' }
  ]

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={theme}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <Logo collapsed={collapsed} />
        <Menu
          theme={theme}
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <AntdLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: theme === 'light' ? '#fff' : '#001529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
            <Breadcrumb items={breadcrumbItems} />
          </Space>
          
          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  src={user.avatar} 
                  icon={<UserOutlined />}
                  size="default"
                />
                <span style={{ color: theme === 'light' ? '#000' : '#fff' }}>
                  {user.username}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: theme === 'light' ? '#fff' : '#141414',
          borderRadius: 8,
          minHeight: 280,
          overflow: 'auto'
        }}>
          <React.Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logistics/products" element={<LogisticsProducts />} />
              <Route path="/logistics/quotes" element={<QuoteManager />} />
              <Route path="/logistics/orders" element={<OrderManager />} />
              <Route path="/sales/methods" element={<SalesMethods />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/wechat" element={<WeChatBot />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </React.Suspense>
        </Content>
      </AntdLayout>
    </AntdLayout>
  )
}

export default Layout