const foodKeywords = [
  '美食', '火锅', '烧烤', '奶茶', '咖啡', '甜品', '小吃', '餐厅', '菜谱', '做菜',
  '烘焙', '蛋糕', '面包', '寿司', '拉面', '披萨', '汉堡', '炸鸡', '串串', '麻辣烫',
  '煎饼', '包子', '饺子', '粥', '炒饭', '炒面', '海鲜', '牛排', '自助餐', '探店',
  '米其林', '网红店', '打卡', '美味', '好吃', '食谱', '下午茶', '宵夜', '早餐', '午餐'
];

const foodCategories = [
  '中餐', '西餐', '日料', '韩料', '东南亚菜', '火锅烧烤',
  '小吃快餐', '甜品饮品', '烘焙', '探店测评'
];

const contentStages = ['萌芽期', '爆发期', '成熟期', '衰退期'];

const platforms = {
  douyin: '抖音',
  weibo: '微博',
  baidu: '百度',
  toutiao: '今日头条'
};

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockHotspot(platform, index) {
  const keyword = randomItem(foodKeywords);
  const category = randomItem(foodCategories);
  const stage = randomItem(contentStages);
  const heat = randomNumber(50000, 10000000);
  const growth = randomNumber(-50, 300);
  const videoCount = randomNumber(100, 50000);
  const engagement = randomNumber(1000, 500000);

  const titles = [
    `${keyword}的10种创新做法`,
    `探店｜这家${keyword}太绝了`,
    `3分钟学会${keyword}`,
    `${keyword}测评｜到底值不值得买`,
    `${keyword}大赏`,
    `网红${keyword}翻车现场`,
    `${keyword}合集｜吃货必看`,
    `自制${keyword}教程`,
    `${keyword}｜你不知道的秘密`,
    `${keyword}挑战`
  ];

  return {
    id: `${platform}_${Date.now()}_${index}`,
    platform,
    platformName: platforms[platform],
    title: randomItem(titles),
    keyword,
    category,
    stage,
    heat,
    growth,
    videoCount,
    engagement,
    relevanceScore: randomNumber(60, 100),
    aiSuggestion: `建议制作${keyword}相关内容，当前${stage}，${growth > 0 ? '热度上升' : '热度下降'}`,
    timestamp: new Date().toISOString(),
    tags: [keyword, category, stage]
  };
}

export function generateMockData(platform, count = 20) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(generateMockHotspot(platform, i));
  }
  return data;
}

export function generateAllPlatformsData(countPerPlatform = 20) {
  const allData = [];
  Object.keys(platforms).forEach(platform => {
    allData.push(...generateMockData(platform, countPerPlatform));
  });
  return allData;
}
