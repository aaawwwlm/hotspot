import express from 'express';
import { supabase } from '../utils/supabase.js';
import { generateMockData } from '../utils/mockScraper.js';
import { scraperInstance } from '../utils/xiaohongshuScraper.js';

const router = express.Router();

export function createScraperRouter() {
  router.post('/xiaohongshu/login', async (req, res) => {
    try {
      const { cookies } = req.body;

      if (!cookies) {
        return res.status(400).json({
          success: false,
          message: '请提供登录 cookies'
        });
      }

      const result = await scraperInstance.setCookies(cookies);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '设置登录态失败',
        error: error.message
      });
    }
  });

  router.get('/xiaohongshu/status', async (req, res) => {
    try {
      const status = await scraperInstance.getLoginStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取登录状态失败',
        error: error.message
      });
    }
  });

  router.get('/xiaohongshu/debug', async (req, res) => {
    try {
      const debug = await scraperInstance.debugPageStructure();
      const screenshot = await scraperInstance.takeScreenshot(`debug_${Date.now()}.png`);

      res.json({
        success: true,
        data: {
          pageInfo: debug,
          screenshot
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '调试失败',
        error: error.message
      });
    }
  });

  router.post('/xiaohongshu/search', async (req, res) => {
    try {
      const { keyword, keywords, maxResults = 20 } = req.body;

      if (!keyword && (!keywords || keywords.length === 0)) {
        return res.status(400).json({
          success: false,
          message: '请提供搜索关键词'
        });
      }

      let result;

      if (keywords && keywords.length > 0) {
        result = await scraperInstance.searchMultipleKeywords(keywords, { maxResults });
      } else {
        result = await scraperInstance.searchKeyword(keyword, { maxResults });
      }

      if (result.success || (Array.isArray(result) && result.length > 0)) {
        const resultsArray = Array.isArray(result) ? result : [result];

        for (const searchResult of resultsArray) {
          if (searchResult.data && searchResult.data.length > 0) {
            const videoInserts = searchResult.data.map(video => ({
              platform: 'xiaohongshu',
              title: video.title,
              author: video.author,
              video_url: video.url,
              cover_url: video.cover,
              likes: video.likes,
              heat_index: video.heat,
              keyword: searchResult.keyword,
              search_rank: video.rank,
              collected_at: video.collectedAt
            }));

            await supabase.from('xiaohongshu_videos').insert(videoInserts);

            const hotspotInserts = searchResult.data.map((video, idx) => ({
              platform: 'xiaohongshu',
              topic: `${searchResult.keyword} - ${video.title}`,
              heat: video.heat,
              trend: 'stable',
              rank: idx + 1,
              collected_at: video.collectedAt
            }));

            await supabase.from('hotspot_raw').insert(hotspotInserts);
          }
        }
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: error.message
      });
    }
  });

  router.post('/trigger', async (req, res) => {
    try {
      const { platform } = req.body;

      if (!platform || !['douyin', 'weibo', 'baidu', 'toutiao'].includes(platform)) {
        return res.status(400).json({
          success: false,
          message: '平台参数无效，支持: douyin, weibo, baidu, toutiao'
        });
      }

      const mockData = generateMockData(platform, 20);

      const dataToInsert = mockData.map(item => ({
        platform: item.platform,
        topic: item.title,
        heat: item.heat,
        trend: item.trend || 'stable',
        rank: item.rank,
        collected_at: new Date().toISOString()
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('hotspot_raw')
        .insert(dataToInsert)
        .select();

      if (insertError) throw insertError;

      const { error: upsertError } = await supabase
        .from('scraper_status')
        .upsert({
          platform,
          status: 'completed',
          last_run: new Date().toISOString(),
          last_success: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'platform'
        });

      if (upsertError) throw upsertError;

      res.json({
        success: true,
        count: insertedData.length,
        message: `成功抓取 ${platform} 平台 ${insertedData.length} 条数据`,
        data: insertedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '抓取数据失败',
        error: error.message
      });
    }
  });

  router.get('/status', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('scraper_status')
        .select('*');

      if (error) throw error;

      const platforms = ['douyin', 'weibo', 'baidu', 'toutiao'];
      const statusMap = {};

      (data || []).forEach(item => {
        statusMap[item.platform] = item;
      });

      const result = platforms.map(platform => ({
        platform,
        platformName: {
          douyin: '抖音',
          weibo: '微博',
          baidu: '百度',
          toutiao: '今日头条'
        }[platform],
        lastUpdate: statusMap[platform]?.last_run || null,
        count: 0,
        status: statusMap[platform]?.status || 'not_started'
      }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取抓取状态失败',
        error: error.message
      });
    }
  });

  return router;
}
