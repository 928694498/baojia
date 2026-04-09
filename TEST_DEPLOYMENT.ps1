# 跨境物流管理系统部署测试脚本
# 自动测试GitHub Pages部署状态

param(
    [string]$GitHubUser = "928694498",
    [string]$RepoName = "baojia"
)

$baseUrl = "https://$GitHubUser.github.io/$RepoName"
$githubRepo = "https://github.com/$GitHubUser/$RepoName"
$pagesSettings = "https://github.com/$GitHubUser/$RepoName/settings/pages"
$actionsStatus = "https://github.com/$GitHubUser/$RepoName/actions"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "跨境物流管理系统部署测试" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 测试参数：" -ForegroundColor Yellow
Write-Host "  GitHub用户: $GitHubUser"
Write-Host "  仓库名称: $RepoName"
Write-Host "  网站地址: $baseUrl"
Write-Host ""

Write-Host "🔍 第1步：检查GitHub Pages配置状态..." -ForegroundColor Yellow
Write-Host "  配置页面: $pagesSettings"
Write-Host "  请确保已配置："
Write-Host "    • Source: Deploy from a branch"
Write-Host "    • Branch: gh-pages 或 main"
Write-Host "    • Folder: /(root)"
Write-Host ""

Write-Host "🔍 第2步：检查GitHub Actions状态..." -ForegroundColor Yellow
Write-Host "  Actions面板: $actionsStatus"
Write-Host "  请确保以下工作流正常运行："
Write-Host "    • deploy-github-pages.yml"
Write-Host "    • ci-cd.yml"
Write-Host ""

Write-Host "🔍 第3步：测试网站访问..." -ForegroundColor Yellow
try {
    $testUrl = "$baseUrl"
    Write-Host "  测试访问: $testUrl"
    
    $response = Invoke-WebRequest -Uri $testUrl -Method Head -ErrorAction Stop
    $statusCode = $response.StatusCode
    $statusDescription = $response.StatusDescription
    
    if ($statusCode -eq 200) {
        Write-Host "  ✅ 网站可访问 (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ 网站返回非200状态码: HTTP $statusCode" -ForegroundColor Yellow
    }
    
} catch [System.Net.WebException] {
    $errorCode = $_.Exception.Response.StatusCode.value__
    if ($errorCode -eq 404) {
        Write-Host "  ❌ 网站返回404错误，正在部署中或未配置Pages" -ForegroundColor Red
        Write-Host "  ⏰ 请等待2-5分钟让部署完成" -ForegroundColor Yellow
    } elseif ($errorCode -eq 403) {
        Write-Host "  🔒 网站暂时不可访问（访问限制）" -ForegroundColor Red
    } else {
        Write-Host "  ❌ 网站访问失败: $errorCode" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️ 网站暂时不可访问或正在部署中..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 第4步：检查网络连接..." -ForegroundColor Yellow
try {
    $pingResult = Test-NetConnection -ComputerName "github.com" -Port 443 -ErrorAction Stop
    if ($pingResult.TcpTestSucceeded) {
        Write-Host "  ✅ 网络连接正常" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 网络连接失败，请检查网络" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️ 网络连接测试失败" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 第5步：检查DNS解析..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name "$GitHubUser.github.io" -ErrorAction Stop
    if ($dnsResult) {
        Write-Host "  ✅ DNS解析正常" -ForegroundColor Green
        $dnsResult | Select-Object -First 3 -Property Name, IPAddress | ForEach-Object {
            Write-Host "     $($_.Name) -> $($_.IPAddress)"
        }
    }
} catch {
    Write-Host "  ⚠️ DNS解析失败" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ 测试完成！" -ForegroundColor Green
Write-Host ""

Write-Host "📋 下一步操作：" -ForegroundColor Yellow
Write-Host "1. 访问GitHub Pages设置: $pagesSettings"
Write-Host "2. 配置部署分支为 gh-pages"
Write-Host "3. 等待2-5分钟让部署完成"
Write-Host "4. 访问网站: $baseUrl"
Write-Host ""

Write-Host "🚀 快速链接：" -ForegroundColor Green
Write-Host "• 配置Pages: $pagesSettings"
Write-Host "• 监控Actions: $actionsStatus"
Write-Host "• 访问仓库: $githubRepo"
Write-Host "• 访问网站: $baseUrl"

Write-Host ""
Write-Host "💡 提示：如果部署还未完成，请稍等几分钟后再次运行此脚本测试。" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 询问用户是否要打开配置页面
$response = Read-Host "是否要打开GitHub Pages配置页面？ (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process $pagesSettings
}

# 自动刷新功能（可选）
$refresh = Read-Host "是否要自动刷新检查部署状态？ (Y/N)"
if ($refresh -eq "Y" -or $refresh -eq "y") {
    $seconds = 30
    Write-Host "将在$seconds秒后自动刷新测试..."
    Start-Sleep -Seconds $seconds
    & $PSCommandPath
}