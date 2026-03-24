const foodKeywords = [
  '美食', '火锅', '烧烤', '奶茶', '咖啡', '甜品', '小吃', '餐厅', '菜谱', '做菜',
  '烘焙', '蛋糕', '面包', '寿司', '拉面', '披萨', '汉堡', '炸鸡', '串串', '麻辣烫',
  '煎饼', '包子', '饺子', '粥', '炒饭', '炒面', '海鲜', '牛排', '自助餐', '探店',
  '米其林', '网红店', '打卡', '美味', '好吃', '食谱', '下午茶', '宵夜', '早餐', '午餐',
  '厨房', '厨师', '吃播', '美食家', '味道', '口感', '料理', '食材', '特色菜', '招牌菜'
];

const foodCategories = {
  '中餐': ['炒菜', '川菜', '粤菜', '湘菜', '东北菜', '家常菜', '中式'],
  '西餐': ['牛排', '披萨', '意面', '沙拉', '西式', '法餐', '意餐'],
  '日料': ['寿司', '拉面', '刺身', '日式', '天妇罗', '乌冬面'],
  '韩料': ['烤肉', '泡菜', '石锅拌饭', '韩式', '部队锅', '炸鸡'],
  '东南亚菜': ['泰餐', '越南菜', '冬阴功', '咖喱', '东南亚'],
  '火锅烧烤': ['火锅', '烧烤', '串串', '麻辣烫', '涮锅', '烤肉'],
  '小吃快餐': ['汉堡', '炸鸡', '煎饼', '包子', '饺子', '小吃', '快餐'],
  '甜品饮品': ['奶茶', '咖啡', '蛋糕', '甜品', '冰淇淋', '下午茶', '饮品'],
  '烘焙': ['面包', '蛋糕', '烘焙', '西点', '糕点'],
  '探店测评': ['探店', '测评', '打卡', '网红店', '推荐']
};

export function analyzeRelevance(text) {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  let score = 0;
  let matchedKeywords = [];

  foodKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 15;
      matchedKeywords.push(keyword);
    }
  });

  return Math.min(100, score);
}

export function categorizeFood(text) {
  if (!text) return '未分类';

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(foodCategories)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return '未分类';
}

export function determineStage(heat, growth) {
  if (heat < 100000) {
    return '萌芽期';
  } else if (heat < 1000000 && growth > 50) {
    return '爆发期';
  } else if (heat >= 1000000) {
    return '成熟期';
  } else if (growth < -20) {
    return '衰退期';
  }
  return '成熟期';
}

export function generateAISuggestion(item) {
  const { category, stage, growth, heat } = item;

  let suggestion = '';

  if (stage === '爆发期') {
    suggestion = `强烈推荐：${category}类内容正处于爆发期，热度增长${growth}%，建议立即制作相关内容抢占流量`;
  } else if (stage === '萌芽期' && growth > 30) {
    suggestion = `潜力内容：${category}类话题处于萌芽期但增长迅速，建议提前布局，有机会成为早期受益者`;
  } else if (stage === '成熟期') {
    suggestion = `稳定流量：${category}类内容已成熟，热度${heat}，适合持续输出，保持账号活跃度`;
  } else if (stage === '衰退期') {
    suggestion = `谨慎制作：${category}类话题热度下降${Math.abs(growth)}%，建议观望或寻找新角度`;
  } else {
    suggestion = `可制作内容：${category}类话题有一定热度，可根据账号定位选择性制作`;
  }

  return suggestion;
}

export function filterFoodContent(rawData, minRelevance = 60) {
  return rawData
    .map(item => ({
      ...item,
      relevanceScore: analyzeRelevance(item.title || item.keyword),
      category: categorizeFood(item.title || item.keyword),
      stage: determineStage(item.heat, item.growth),
    }))
    .filter(item => item.relevanceScore >= minRelevance)
    .map(item => ({
      ...item,
      aiSuggestion: generateAISuggestion(item)
    }));
}
