#!/bin/bash

# 配置部署环境

set -e

GITHUB_TOKEN="$1"
REPO_URL="https://github.com/chenpipin/hotspot.git"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "错误: 请提供 GitHub token"
  echo "用法: ./setup-deploy.sh <GITHUB_TOKEN>"
  exit 1
fi

echo "配置 Git 远程仓库..."

# 检查是否已初始化 git
if [ ! -d ".git" ]; then
  echo "初始化 Git 仓库..."
  git init
fi

# 配置远程仓库（使用 token 进行身份验证）
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/chenpipin/hotspot.git"

# 移除现有的 origin（如果存在）
git remote remove origin 2>/dev/null || true

# 添加新的 origin
git remote add origin "$REMOTE_URL"

echo "配置完成！"
echo "现在可以使用 ./deploy.sh 进行部署"
