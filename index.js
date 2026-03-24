import express from 'express';
import cors from 'cors';

import { createHotspotsRouter } from './routes/hotspots.js';
import { createScraperRouter } from './routes/scraper.js';
import { createAnalysisRouter } from './routes/analysis.js';
import { createKeywordsRouter } from './routes/keywords.js';
import { createCollectionRouter } from './routes/collection.js';
import { createReportsRouter } from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/hotspots', createHotspotsRouter());
app.use('/api/scraper', createScraperRouter());
app.use('/api/analysis', createAnalysisRouter());
app.use('/api/keywords', createKeywordsRouter());
app.use('/api/collection', createCollectionRouter());
app.use('/api/reports', createReportsRouter());

app.get('/', (req, res) => {
  res.json({
    message: '美食短视频热点监控平台 API',
    version: '1.0.0',
    endpoints: {
      hotspots: {
        raw: 'GET /api/hotspots/raw?platform=all&limit=50',
        food: 'GET /api/hotspots/food?platform=all&stage=all&category=all&sort=heat&limit=20'
      },
      scraper: {
        trigger: 'POST /api/scraper/trigger',
        status: 'GET /api/scraper/status'
      },
      analysis: {
        run: 'POST /api/analysis/run',
        stats: 'GET /api/analysis/stats'
      },
      keywords: {
        list: 'GET /api/keywords',
        create: 'POST /api/keywords',
        delete: 'DELETE /api/keywords/:id'
      },
      collection: {
        list: 'GET /api/collection',
        create: 'POST /api/collection',
        update: 'PUT /api/collection/:id',
        delete: 'DELETE /api/collection/:id'
      },
      reports: {
        list: 'GET /api/reports?startDate=&endDate=',
        generate: 'POST /api/reports/generate',
        detail: 'GET /api/reports/:id'
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`美食短视频热点监控平台后端服务启动成功`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}`);
});
