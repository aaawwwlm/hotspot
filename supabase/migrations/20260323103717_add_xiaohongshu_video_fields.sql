/*
  # 添加小红书视频详细字段

  1. 更新 video_collection 表
    - 添加 `video_id` (text) - 视频ID
    - 添加 `cover_url` (text) - 封面图URL
    - 添加 `like_count` (bigint) - 点赞数
    - 添加 `comment_count` (bigint) - 评论数
    - 添加 `share_count` (bigint) - 分享数
    - 添加 `collect_count` (bigint) - 收藏数
    - 添加 `view_count` (bigint) - 播放数
    - 添加 `engagement_rate` (numeric) - 互动率
    - 添加 `published_at` (timestamptz) - 发布时间
    - 添加 `topic_tags` (jsonb) - 话题标签
    - 添加 `is_hot` (boolean) - 是否爆款
    - 添加 `heat_score` (numeric) - 热度分数

  2. 添加索引以提升查询性能
    - 按点赞数排序索引
    - 按互动率排序索引
    - 按热度分数排序索引
    - 按是否爆款筛选索引
*/

-- 添加新字段到 video_collection 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'video_id'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN video_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN cover_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN like_count bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN comment_count bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'share_count'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN share_count bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'collect_count'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN collect_count bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN view_count bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'engagement_rate'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN engagement_rate numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN published_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'topic_tags'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN topic_tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'is_hot'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN is_hot boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_collection' AND column_name = 'heat_score'
  ) THEN
    ALTER TABLE video_collection ADD COLUMN heat_score numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_video_collection_like_count ON video_collection(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_collection_engagement_rate ON video_collection(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_video_collection_heat_score ON video_collection(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_collection_is_hot ON video_collection(is_hot);
CREATE INDEX IF NOT EXISTS idx_video_collection_published_at ON video_collection(published_at DESC);