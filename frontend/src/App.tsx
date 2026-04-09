import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from 'react-error-boundary'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 导入组件
import Layout from '@/components/Layout'
import ErrorFallback from '@/components/ErrorFallback'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// 配置dayjs本地化
dayjs.locale('zh-cn')

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000 // 10分钟
    }
  }
})

// 主题配置
const themeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: 14
  },
  components: {
    Button: {
      borderRadius: 6
    },
    Card: {
      borderRadius: 8
    },
    Input: {
      borderRadius: 6
    }
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={zhCN} theme={themeConfig}>
            <AntdApp>
              <ThemeProvider>
                <AuthProvider>
                  <BrowserRouter>
                    <Layout />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 3000,
                        style: {
                          borderRadius: '6px',
                          background: '#333',
                          color: '#fff'
                        }
                      }}
                    />
                  </BrowserRouter>
                </AuthProvider>
              </ThemeProvider>
            </AntdApp>
          </ConfigProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App