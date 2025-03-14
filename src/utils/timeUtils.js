/**
 * 格式化时间为"xx时间前"的形式
 * @param {string|Date} timestamp - ISO格式的时间字符串或Date对象
 * @returns {string} 格式化后的字符串
 */
export function formatTimeAgo(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  // 中文时间单位映射
  const chineseUnits = {
    year: '年',
    month: '月',
    week: '周',
    day: '天',
    hour: '小时',
    minute: '分钟',
    second: '秒',
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${chineseUnits[unit]}前`;
    }
  }

  return '刚刚';
} 