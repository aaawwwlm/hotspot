export function extractCookiesFromBrowser() {
  return `
使用方法：在小红书网站登录后，按以下步骤提取 Cookie：

1. 打开小红书网站并登录: https://www.xiaohongshu.com
2. 按 F12 打开开发者工具
3. 切换到 "Application" 或 "应用程序" 标签
4. 左侧菜单找到 "Cookies" -> "https://www.xiaohongshu.com"
5. 在控制台(Console)中运行以下代码：

\`\`\`javascript
copy(JSON.stringify(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return {
    name,
    value,
    domain: '.xiaohongshu.com',
    path: '/',
    httpOnly: false,
    secure: true
  };
})));
\`\`\`

6. Cookie 已复制到剪贴板，可以直接粘贴到前端登录接口

注意事项：
- Cookie 包含敏感信息，请妥善保管
- Cookie 有过期时间，过期后需重新获取
- 不要在公共场合分享你的 Cookie
`;
}

export function validateCookies(cookies) {
  try {
    let cookieArray;

    if (typeof cookies === 'string') {
      cookieArray = JSON.parse(cookies);
    } else if (Array.isArray(cookies)) {
      cookieArray = cookies;
    } else {
      return { valid: false, message: 'Cookie 格式不正确' };
    }

    if (!Array.isArray(cookieArray) || cookieArray.length === 0) {
      return { valid: false, message: 'Cookie 数组为空' };
    }

    const hasRequiredFields = cookieArray.every(
      cookie => cookie.name && cookie.value
    );

    if (!hasRequiredFields) {
      return { valid: false, message: 'Cookie 缺少必要字段 (name/value)' };
    }

    return { valid: true, message: 'Cookie 格式正确' };
  } catch (error) {
    return { valid: false, message: `Cookie 解析失败: ${error.message}` };
  }
}
