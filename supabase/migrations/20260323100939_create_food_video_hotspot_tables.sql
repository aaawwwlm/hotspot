/*
  # 美食短视频热点监控平台数据库

  1. 新建表
    - `hotspot_raw` - 原始热点数据
      - `id` (uuid, primary key)
      - `platform` (text) - 平台名称（抖音/快手/小红书）
      - `topic` (text) - 话题名称
      - `heat` (bigint) - 热度值
      - `trend` (text) - 趋势（up/down/stable）
      - `rank` (integer) - 排名
      - `collected_at` (timestamptz) - 采集时间
      - `created_at` (timestamptz) - 创建时间
    
    - `hotspot_food` - 美食相关热点
      - `id` (uuid, primary key)
      - `raw_id` (uuid, foreign key) - 关联原始热点
      - `platform` (text) - 平台
      - `topic` (text) - 话题
      - `heat` (bigint) - 热度
      - `category` (text) - 分类（地域特色/烘焙甜品等）
      - `stage` (text) - 阶段（萌芽期/爆发期/成熟期/衰退期）
      - `keywords` (jsonb) - 关键词数组
      - `collected_at` (timestamptz) - 采集时间
      - `created_at` (timestamptz) - 创建时间
    
    - `video_collection` - 视频合集
      - `id` (uuid, primary key)
      - `title` (text) - 标题
      - `description` (text) - 描述
      - `video_url` (text) - 视频URL
      - `platform` (text) - 平台
      - `author` (text) - 作者
      - `tags` (jsonb) - 标签数组
      - `collected_at` (timestamptz) - 收集时间
      - `created_at` (timestamptz) - 创建时间
    
    - `keywords` - 关键词配置
      - `id` (uuid, primary key)
      - `keyword` (text, unique) - 关键词
      - `category` (text) - 分类
      - `enabled` (boolean) - 是否启用
      - `created_at` (timestamptz) - 创建时间
    
    - `daily_reports` - 每日报告
      - `id` (uuid, primary key)
      - `report_date` (date, unique) - 报告日期
      - `summary` (jsonb) - 摘要数据
      - `top_hotspots` (jsonb) - 热门话题
      - `trend_analysis` (jsonb) - 趋势分析
      - `created_at` (timestamptz) - 创建时间
    
    - `scraper_status` - 爬虫状态
      - `id` (uuid, primary key)
      - `platform` (text, unique) - 平台
      - `status` (text) - 状态（idle/running/completed/error）
      - `last_run` (timestamptz) - 最后运行时间
      - `last_success` (timestamptz) - 最后成功时间
      - `error_message` (text) - 错误信息
      - `updated_at` (timestamptz) - 更新时间

  2. 安全设置
    - 所有表启用 RLS
    - 允许所有操作（这是一个后端服务，使用 service role key）
*/

-- 创建原始热点表
CREATE TABLE IF NOT EXISTS hotspot_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  topic text NOT NULL,
  heat bigint NOT NULL DEFAULT 0,
  trend text DEFAULT 'stable',
  rank integer,
  collected_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspot_raw_platform ON hotspot_raw(platform);
CREATE INDEX IF NOT EXISTS idx_hotspot_raw_collected_at ON hotspot_raw(collected_at DESC);

-- 创建美食热点表
CREATE TABLE IF NOT EXISTS hotspot_food (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id uuid REFERENCES hotspot_raw(id) ON DELETE CASCADE,
  platform text NOT NULL,
  topic text NOT NULL,
  heat bigint NOT NULL DEFAULT 0,
  category text,
  stage text,
  keywords jsonb DEFAULT '[]'::jsonb,
  collected_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspot_food_platform ON hotspot_food(platform);
CREATE INDEX IF NOT EXISTS idx_hotspot_food_category ON hotspot_food(category);
CREATE INDEX IF NOT EXISTS idx_hotspot_food_stage ON hotspot_food(stage);
CREATE INDEX IF NOT EXISTS idx_hotspot_food_collected_at ON hotspot_food(collected_at DESC);

-- 创建视频合集表
CREATE TABLE IF NOT EXISTS video_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  platform text NOT NULL,
  author text,
  tags jsonb DEFAULT '[]'::jsonb,
  collected_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_collection_platform ON video_collection(platform);
CREATE INDEX IF NOT EXISTS idx_video_collection_collected_at ON video_collection(collected_at DESC);

-- 创建关键词表
CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text UNIQUE NOT NULL,
  category text,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 创建每日报告表
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  summary jsonb DEFAULT '{}'::jsonb,
  top_hotspots jsonb DEFAULT '[]'::jsonb,
  trend_analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);

-- 创建爬虫状态表
CREATE TABLE IF NOT EXISTS scraper_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  status text DEFAULT 'idle',
  last_run timestamptz,
  last_success timestamptz,
  error_message text,
  updated_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE hotspot_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspot_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_status ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（使用 service role key）
CREATE POLICY "Allow all operations on hotspot_raw"
  ON hotspot_raw FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on hotspot_food"
  ON hotspot_food FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on video_collection"
  ON video_collection FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on keywords"
  ON keywords FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on daily_reports"
  ON daily_reports FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on scraper_status"
  ON scraper_status FOR ALL
  USING (true)
  WITH CHECK (true);