# 跨境物流管理系统 - GitHub部署脚本 (PowerShell版本)
# 一键将项目部署到GitHub

Write-Host "=== 跨境物流管理系统 GitHub部署 ===" -ForegroundColor Cyan
Write-Host ""

# 颜色定义
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# 检查Git状态
function Check-GitStatus {
    Write-Host "[INFO] 检查Git状态..." -ForegroundColor $InfoColor
    
    try {
        $status = git status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Git仓库已初始化" -ForegroundColor $SuccessColor
            return $true
        } else {
            Write-Host "[ERROR] Git仓库未初始化" -ForegroundColor $ErrorColor
            return $false
        }
    } catch {
        Write-Host "[ERROR] Git未安装或出现错误" -ForegroundColor $ErrorColor
        return $false
    }
}

# 检查当前提交
function Check-CommitStatus {
    Write-Host "[INFO] 检查提交状态..." -ForegroundColor $InfoColor
    
    try {
        $commit = git log --oneline -1 2>&1
        if ($LASTEXITCODE -eq 0 -and $commit) {
            Write-Host "[SUCCESS] 最新提交: $commit" -ForegroundColor $SuccessColor
            return $true
        } else {
            Write-Host "[WARNING] 没有提交记录" -ForegroundColor $WarningColor
            return $false
        }
    } catch {
        Write-Host "[ERROR] 检查提交状态失败" -ForegroundColor $ErrorColor
        return $false
    }
}

# 配置远程仓库
function Configure-RemoteRepository {
    param(
        [string]$GitHubUrl
    )
    
    Write-Host "[INFO] 配置GitHub远程仓库..." -ForegroundColor $InfoColor
    
    if ([string]::IsNullOrWhiteSpace($GitHubUrl)) {
        $GitHubUrl = Read-Host "请输入GitHub仓库URL (格式: https://github.com/用户名/仓库名.git)"
    }
    
    if ([string]::IsNullOrWhiteSpace($GitHubUrl)) {
        Write-Host "[ERROR] GitHub仓库URL不能为空" -ForegroundColor $ErrorColor
        return $false
    }
    
    # 检查是否已配置远程仓库
    $remotes = git remote -v 2>&1
    if ($remotes -like "*origin*") {
        Write-Host "[WARNING] 远程仓库已配置" -ForegroundColor $WarningColor
        $current = git remote get-url origin 2>&1
        Write-Host "[INFO] 当前远程仓库: $current" -ForegroundColor $InfoColor
        
        $choice = Read-Host "是否更新远程仓库地址？ (y/n)"
        if ($choice.ToLower() -eq 'y') {
            git remote set-url origin $GitHubUrl 2>&1
            Write-Host "[SUCCESS] 远程仓库地址已更新" -ForegroundColor $SuccessColor
        } else {
            Write-Host "[INFO] 使用现有远程仓库" -ForegroundColor $InfoColor
        }
    } else {
        git remote add origin $GitHubUrl 2>&1
        Write-Host "[SUCCESS] 远程仓库已添加" -ForegroundColor $SuccessColor
    }
    
    return $true
}

# 推送到GitHub
function Push-ToGitHub {
    Write-Host "[INFO] 推送到GitHub..." -ForegroundColor $InfoColor
    
    # 检查远程连接
    Write-Host "[INFO] 检查远程仓库连接..." -ForegroundColor $InfoColor
    $test = git ls-remote origin 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 无法连接到远程仓库" -ForegroundColor $ErrorColor
        Write-Host "[ERROR] 请检查：" -ForegroundColor $ErrorColor
        Write-Host "[ERROR] 1. GitHub仓库是否存在" -ForegroundColor $ErrorColor
        Write-Host "[ERROR] 2. 网络连接是否正常" -ForegroundColor $ErrorColor
        Write-Host "[ERROR] 3. URL是否正确" -ForegroundColor $ErrorColor
        return $false
    }
    
    # 推送代码
    Write-Host "[INFO] 推送代码到GitHub..." -ForegroundColor $InfoColor
    $push = git push -u origin main 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] 代码推送成功！" -ForegroundColor $SuccessColor
        return $true
    } else {
        Write-Host "[ERROR] 推送失败" -ForegroundColor $ErrorColor
        Write-Host "[ERROR] 错误信息: $push" -ForegroundColor $ErrorColor
        return $false
    }
}

# 显示部署指南
function Show-DeploymentGuide {
    param(
        [string]$Username,
        [string]$RepoName
    )
    
    if ([string]::IsNullOrWhiteSpace($Username) -or [string]::IsNullOrWhiteSpace($RepoName)) {
        # 尝试从远程URL中提取信息
        $remoteUrl = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0 -and $remoteUrl -match "github\.com/([^/]+)/([^\.]+)") {
            $Username = $matches[1]
            $RepoName = $matches[2]
        } else {
            $Username = "YOUR_USERNAME"
            $RepoName = "cross-border-logistics"
        }
    }
    
    Write-Host ""
    Write-Host "=== 部署指南 ===" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🎯 GitHub仓库信息：" -ForegroundColor Green
    Write-Host "   仓库地址: https://github.com/$Username/$RepoName" -ForegroundColor Yellow
    Write-Host "   Actions: https://github.com/$Username/$RepoName/actions" -ForegroundColor Yellow
    Write-Host "   Pages设置: https://github.com/$Username/$RepoName/settings/pages" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "🚀 后续步骤：" -ForegroundColor Green
    Write-Host "   1. 访问GitHub仓库: https://github.com/$Username/$RepoName" -ForegroundColor Yellow
    Write-Host "   2. 点击 Settings → Pages" -ForegroundColor Yellow
    Write-Host "   3. 配置分支: gh-pages, 文件夹: /(root)" -ForegroundColor Yellow
    Write-Host "   4. 等待2-5分钟完成部署" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "🌐 网站地址：" -ForegroundColor Green
    Write-Host "   https://$Username.github.io/$RepoName" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "📊 监控部署：" -ForegroundColor Green
    Write-Host "   - Actions状态: https://github.com/$Username/$RepoName/actions" -ForegroundColor Yellow
    Write-Host "   - 部署状态: https://github.com/$Username/$RepoName/deployments" -ForegroundColor Yellow
}

# 主菜单
function Show-MainMenu {
    Clear-Host
    Write-Host "=== 跨境物流管理系统 GitHub部署 ===" -ForegroundColor Cyan
    Write-Host ""
    
    $gitStatus = Check-GitStatus
    $commitStatus = Check-CommitStatus
    
    Write-Host ""
    Write-Host "请选择操作：" -ForegroundColor Green
    Write-Host "1. 配置GitHub仓库并推送代码" -ForegroundColor Yellow
    Write-Host "2. 查看部署指南" -ForegroundColor Yellow
    Write-Host "3. 检查Git状态" -ForegroundColor Yellow
    Write-Host "4. 查看提交记录" -ForegroundColor Yellow
    Write-Host "5. 退出" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "请输入选择 (1-5)"
    
    switch ($choice) {
        "1" {
            # 配置并推送
            if (-not $gitStatus) {
                Write-Host "[ERROR] Git仓库未初始化，请先初始化Git" -ForegroundColor $ErrorColor
                break
            }
            
            if (-not $commitStatus) {
                Write-Host "[WARNING] 没有提交记录，请先提交代码" -ForegroundColor $WarningColor
                break
            }
            
            $url = Read-Host "请输入GitHub仓库URL (格式: https://github.com/用户名/仓库名.git)"
            
            if (Configure-RemoteRepository -GitHubUrl $url) {
                if (Push-ToGitHub) {
                    Show-DeploymentGuide
                }
            }
            
            Pause
        }
        "2" {
            # 显示部署指南
            Show-DeploymentGuide
            Pause
        }
        "3" {
            # 检查Git状态
            git status
            Pause
        }
        "4" {
            # 查看提交记录
            git log --oneline -10
            Pause
        }
        "5" {
            # 退出
            Write-Host "再见！" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host "无效选择，请重新输入" -ForegroundColor $ErrorColor
            Pause
        }
    }
    
    Show-MainMenu
}

# 开始部署流程
function Start-Deployment {
    param(
        [string]$GitHubUrl
    )
    
    Write-Host "开始部署流程..." -ForegroundColor $InfoColor
    
    # 检查Git状态
    if (-not (Check-GitStatus)) {
        Write-Host "[ERROR] 请先初始化Git仓库" -ForegroundColor $ErrorColor
        return $false
    }
    
    # 检查提交状态
    if (-not (Check-CommitStatus)) {
        Write-Host "[ERROR] 请先提交代码" -ForegroundColor $ErrorColor
        return $false
    }
    
    # 配置远程仓库
    if (-not (Configure-RemoteRepository -GitHubUrl $GitHubUrl)) {
        return $false
    }
    
    # 推送到GitHub
    if (-not (Push-ToGitHub)) {
        return $false
    }
    
    # 显示部署指南
    Show-DeploymentGuide
    
    return $true
}

# 脚本入口
Write-Host "跨境物流管理系统 - GitHub部署助手" -ForegroundColor Cyan
Write-Host ""

# 检查参数
if ($args.Count -gt 0) {
    $url = $args[0]
    Write-Host "[INFO] 使用参数: $url" -ForegroundColor $InfoColor
    
    if (Start-Deployment -GitHubUrl $url) {
        Write-Host "[SUCCESS] 部署流程完成！" -ForegroundColor $SuccessColor
    } else {
        Write-Host "[ERROR] 部署流程失败" -ForegroundColor $ErrorColor
    }
} else {
    # 显示主菜单
    Show-MainMenu
}