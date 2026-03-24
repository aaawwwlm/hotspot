import puppeteer from 'puppeteer';

class XiaohongshuScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.cookies = null;
  }

  async launch(headless = true) {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ]
    });

    this.page = await this.browser.newPage();

    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await this.page.setViewport({ width: 1920, height: 1080 });

    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
  }

  async setCookies(cookies) {
    if (!this.page) await this.launch();

    try {
      if (typeof cookies === 'string') {
        cookies = JSON.parse(cookies);
      }

      await this.page.setCookie(...cookies);
      this.cookies = cookies;
      this.isLoggedIn = true;

      return { success: true, message: '登录态设置成功' };
    } catch (error) {
      return { success: false, message: `设置登录态失败: ${error.message}` };
    }
  }

  async searchKeyword(keyword, options = {}) {
    if (!this.page) await this.launch();

    const {
      maxResults = 20,
      sortType = 'general'
    } = options;

    try {
      const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;

      console.log(`正在搜索关键词: ${keyword}`);
      await this.page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      console.log('等待内容加载...');
      await this.randomDelay(3000, 4000);

      try {
        const closeButton = await this.page.$('.close, [class*="close"], button[aria-label*="关闭"]');
        if (closeButton) {
          console.log('发现弹窗，尝试关闭...');
          await closeButton.click();
          await this.randomDelay(1000, 2000);
        }
      } catch (e) {
        console.log('未检测到弹窗');
      }

      const hasLoginDialog = await this.page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('登录') && text.includes('扫码');
      });

      if (hasLoginDialog && !this.isLoggedIn) {
        console.warn('⚠️ 检测到登录要求，需要提供 Cookie');
        return {
          success: false,
          keyword,
          count: 0,
          data: [],
          message: '需要登录才能查看搜索结果，请先调用 /api/scraper/xiaohongshu/login 接口设置登录态',
          requiresLogin: true
        };
      }

      try {
        await this.page.waitForSelector('a[href*="/explore/"], section a, .note-item, [class*="note"]', {
          timeout: 10000
        });
        console.log('✓ 检测到笔记元素');
      } catch (e) {
        console.warn('未检测到笔记元素，继续尝试...');
      }

      for (let i = 0; i < 5; i++) {
        await this.page.evaluate(() => {
          window.scrollBy(0, window.innerHeight * 0.5);
        });
        await this.randomDelay(1000, 1500);
      }

      await this.randomDelay(2000, 3000);

      const pageContent = await this.page.content();
      console.log('页面 HTML 长度:', pageContent.length);

      const videos = await this.page.evaluate((maxResults) => {
        const results = [];

        const selectors = [
          '#global a[href*="/explore/"]',
          'section a[href*="/explore/"]',
          'a[href*="/explore/"]',
          '.note-item a',
          '[class*="note-"] a',
          'main a',
          'article a'
        ];

        let items = [];
        for (const selector of selectors) {
          items = document.querySelectorAll(selector);
          if (items.length > 0) {
            console.log(`找到 ${items.length} 个元素，使用选择器: ${selector}`);
            break;
          }
        }

        if (items.length === 0) {
          console.error('未找到任何笔记元素');
          console.log('页面可用的链接数:', document.querySelectorAll('a').length);
          const sampleLinks = Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => a.href);
          console.log('示例链接:', sampleLinks);
          return [];
        }

        const processedUrls = new Set();

        for (let i = 0; i < items.length && results.length < maxResults; i++) {
          const item = items[i];

          try {
            let url = '';
            let title = '';
            let author = '未知作者';
            let cover = '';
            let likes = 0;

            if (item.tagName === 'A') {
              url = item.href || '';
            } else {
              const linkEl = item.querySelector('a[href*="/explore/"]');
              url = linkEl?.href || '';
            }

            if (!url || processedUrls.has(url)) continue;
            processedUrls.add(url);

            let parentCard = item;
            for (let j = 0; j < 5; j++) {
              if (parentCard.parentElement) {
                parentCard = parentCard.parentElement;
              }
            }

            const titleEl = parentCard.querySelector('[class*="title"]') ||
                           parentCard.querySelector('img[alt]') ||
                           item.querySelector('img[alt]');
            title = titleEl?.textContent?.trim() ||
                   titleEl?.getAttribute('alt') ||
                   titleEl?.getAttribute('title') ||
                   '';

            if (!title || title.length < 3) {
              const allText = parentCard.textContent?.trim() || '';
              const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
              title = lines[0] || `小红书笔记 ${results.length + 1}`;
            }

            const authorEl = parentCard.querySelector('[class*="author"]') ||
                            parentCard.querySelector('[class*="user"]') ||
                            parentCard.querySelector('.author-name');
            author = authorEl?.textContent?.trim() || '未知作者';

            const imgEl = parentCard.querySelector('img') || item.querySelector('img');
            cover = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('srcset')?.split(',')[0]?.split(' ')[0] || '';

            const allText = parentCard.textContent || '';
            const likeMatch = allText.match(/(\d+\.?\d*)\s*(w|万|k|次)?/i);
            if (likeMatch) {
              likes = parseFloat(likeMatch[1]);
              const unit = likeMatch[2]?.toLowerCase();
              if (unit === 'w' || unit === '万') {
                likes *= 10000;
              } else if (unit === 'k') {
                likes *= 1000;
              }
            }

            results.push({
              title: title.substring(0, 200),
              author,
              likes: Math.floor(likes),
              cover,
              url,
              platform: 'xiaohongshu'
            });

          } catch (err) {
            console.error('解析单个笔记失败:', err.message);
          }
        }

        console.log(`成功解析 ${results.length} 条笔记`);
        return results;
      }, maxResults);

      console.log(`成功抓取 ${videos.length} 条笔记数据`);

      if (videos.length === 0) {
        console.warn('未抓取到任何数据，可能需要登录或页面结构已变化');
      }

      return {
        success: videos.length > 0,
        keyword,
        count: videos.length,
        data: videos.map((v, idx) => ({
          ...v,
          rank: idx + 1,
          heat: this.calculateHeat(v.likes || 1000),
          engagement: v.likes || 0,
          collectedAt: new Date().toISOString()
        })),
        message: videos.length === 0 ? '未抓取到数据，请确认已登录' : undefined
      };

    } catch (error) {
      console.error('搜索失败:', error);
      return {
        success: false,
        message: `搜索失败: ${error.message}`,
        data: []
      };
    }
  }

  async searchMultipleKeywords(keywords, options = {}) {
    const results = [];

    for (const keyword of keywords) {
      const result = await this.searchKeyword(keyword, options);
      results.push(result);

      await this.randomDelay(3000, 6000);
    }

    return results;
  }

  calculateHeat(likes) {
    return Math.floor(likes * (1 + Math.random() * 0.5));
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async getLoginStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      hasCookies: !!this.cookies
    };
  }

  async takeScreenshot(filename = 'debug.png') {
    if (!this.page) return null;

    try {
      const projectPath = process.cwd();
      const screenshotPath = `${projectPath}/${filename}`;
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: false
      });
      console.log(`截图已保存: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('截图失败:', error);
      return null;
    }
  }

  async debugPageStructure() {
    if (!this.page) return null;

    try {
      const debug = await this.page.evaluate(() => {
        const info = {
          url: window.location.href,
          title: document.title,
          elementCounts: {}
        };

        const selectors = [
          'a[href*="/explore/"]',
          '.note-item',
          '[class*="feeds"]',
          '[class*="card"]',
          'section',
          'img'
        ];

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          info.elementCounts[selector] = elements.length;
        });

        const allDivs = document.querySelectorAll('div[class]');
        const classNames = new Set();
        allDivs.forEach(div => {
          const classes = div.className.split(' ');
          classes.forEach(c => {
            if (c && (c.includes('note') || c.includes('feed') || c.includes('card'))) {
              classNames.add(c);
            }
          });
        });
        info.relevantClasses = Array.from(classNames);

        return info;
      });

      return debug;
    } catch (error) {
      console.error('调试失败:', error);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }
}

export const scraperInstance = new XiaohongshuScraper();
