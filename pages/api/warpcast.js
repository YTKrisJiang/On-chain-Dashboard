import { NextResponse } from 'next/server'
import axios from 'axios'

// 辅助函数
function isValidImageUrl(url) {
  if (!url) return false;
  
  try {
    // 尝试创建URL对象，验证是否为有效URL
    new URL(url);
    
    // 检查是否为HTTP或HTTPS URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    // 检查是否为已配置的图片域名
    const allowedDomains = [
      'twimg.com',
      'imagedelivery.net',
      'imgur.com',
      'i.imgur.com',
      'postimg.cc'
    ];
    
    // 检查URL是否包含允许的域名
    return allowedDomains.some(domain => url.includes(domain)) || 
           /.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch (e) {
    console.error('Invalid URL:', url, e);
    return false;
  }
}

function formatNumber(num) {
  if (!num || isNaN(Number(num))) return '0';
  
  const numValue = Number(num);
  if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(1) + 'M'
  }
  if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + 'K'
  }
  return numValue.toString()
}

/**
 * 获取Clanker数据的API路由
 * 
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    // 1. 获取第一页代币数据
    const page1Response = await axios.get('https://www.clanker.world/api/tokens', {
      params: {
        sort: 'desc',
        page: 1,
        pair: 'all',
        partner: 'all',
        presale: 'all'
      }
    })

    if (!page1Response.data || !Array.isArray(page1Response.data.data)) {
      throw new Error('Invalid tokens API response structure')
    }

    // 2. 获取第二页代币数据
    const page2Response = await axios.get('https://www.clanker.world/api/tokens', {
      params: {
        sort: 'desc',
        page: 2,
        pair: 'all',
        partner: 'all',
        presale: 'all'
      }
    })

    if (!page2Response.data || !Array.isArray(page2Response.data.data)) {
      throw new Error('Invalid tokens API response structure for page 2')
    }

    // 3. 合并两页数据
    const tokens = [...page1Response.data.data, ...page2Response.data.data].slice(0, 20)

    // 4. 获取用户数据
    const fids = tokens.map((token) => token.requestor_fid).filter(Boolean)
    const usersResponse = await axios.get(
      `https://www.clanker.world/api/get-multiple-users-by-fid?fids=${fids.join(',')}`
    )
    const users = usersResponse.data.users

    // 5. 组合数据
    const cards = tokens.map((token) => {
      const user = users.find((u) => u.fid === token.requestor_fid) || {}
      
      // 处理图片URL
      let tokenImageUrl = '/images/clanker-avatar.svg';
      if (token.img_url && isValidImageUrl(token.img_url)) {
        tokenImageUrl = token.img_url;
      }
      
      let userAvatar = '/images/kate-avatar.svg';
      if (user.pfp_url && isValidImageUrl(user.pfp_url)) {
        userAvatar = user.pfp_url;
      }

      return {
        name: user.display_name || 'Unknown',
        handle: `@${user.username || 'unknown'}`,
        address: token.contract_address || 'No Address',
        followers: formatNumber(user.follower_count || 0),
        following: formatNumber(user.following_count || 0),
        createdAt: token.created_at, // 返回原始创建时间，不再格式化
        tokenImageUrl: tokenImageUrl,
        userAvatar: userAvatar,
        tokenName: token.symbol || token.name || 'CLANKER'
        // 移除了不需要的字段：tokenId、tokenValue和tokenPrice
      }
    })

    return res.status(200).json(cards)
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: '获取数据失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    })
  }
} 