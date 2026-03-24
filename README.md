# 美食视频热点监控系统

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env`，并填写以下信息：
```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填写你的 Supabase 配置：
```
SUPABASE_URL=你的supabase项目URL
SUPABASE_ANON_KEY=你的supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的supabase服务角色密钥
PORT=3000
```

### 3. 运行项目
```bash
npm run dev    # 开发模式
npm start      # 生产模式
```

## API 接口

### 爬虫相关
- `POST /api/scraper/scrape` - 抓取小红书视频数据
- `POST /api/scraper/extract-cookies` - 提取浏览器 cookies

### 关键词管理
- `POST /api/keywords` - 添加关键词
- `GET /api/keywords` - 获取所有关键词
- `DELETE /api/keywords/:id` - 删除关键词

### 视频采集
- `POST /api/collection/collect` - 根据关键词采集视频
- `GET /api/collection/videos` - 获取已采集视频列表

### 数据分析
- `POST /api/analysis/analyze` - 分析视频数据
- `GET /api/analysis/trends` - 获取趋势分析

### 热点分析
- `GET /api/hotspots` - 获取热点列表
- `GET /api/hotspots/:id` - 获取热点详情

### 报告生成
- `POST /api/reports/generate` - 生成分析报告
- `GET /api/reports` - 获取报告列表

## 数据库

项目使用 Supabase 数据库，包含以下表：
- `keywords` - 监控关键词
- `videos` - 视频数据
- `hotspots` - 热点分析结果

## 技术栈

- Node.js + Express
- Supabase (PostgreSQL)
- Puppeteer (网页爬虫)
- LowDB (本地缓存)
