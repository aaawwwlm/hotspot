#!/bin/bash

# 美食视频热点监控系统 - 自动部署脚本

set -e

echo "开始部署到 GitHub..."

# 配置 Git
git config user.name "Auto Deploy Bot"
git config user.email "deploy@bot.com"

# 添加所有更改
git add .

# 检查是否有更改
if git diff --staged --quiet; then
  echo "没有需要提交的更改"
  exit 0
fi

# 提交更改
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "自动部署: $TIMESTAMP"

# 推送到 GitHub
echo "推送到远程仓库..."
git push origin main

echo "部署完成！"
