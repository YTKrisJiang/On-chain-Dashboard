'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useClankerData } from '../../hooks/useClankerData'

export function ClankerSection() {
  const { cards, isLoading, isRefreshing, error, retry, refresh } = useClankerData()
  const [currentTime, setCurrentTime] = useState(new Date())

  // 辅助函数：格式化地址显示
  const formatAddress = (address) => {
    if (!address || address === 'No Address') return 'No Address';
    // 如果地址已经是缩写形式，直接返回
    if (address.includes('...')) return address;
    // 否则缩写地址
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // 辅助函数：格式化时间为"xx时间前"的形式
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '未知时间';
    try {
      const date = new Date(timestamp);
      const diff = Math.floor((currentTime.getTime() - date.getTime()) / 1000);

      // 中文时间格式
      if (diff < 60) return `${diff}秒前`;
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      return `${Math.floor(diff / 86400)}天前`;
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '无效日期';
    }
  };

  // 每秒更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-b-2 border-[#3b82f6]"></div>
          <p className="text-[#666]">加载 Clanker 数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[#dc2626]">{error}</p>
          <button
            onClick={retry}
            className="rounded-lg bg-[#f8fafc] px-4 py-2 text-[#3b82f6] transition-colors hover:bg-[#e2e8f0] shadow-sm"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#333]">Clanker 数据</h2>
          <p className="text-xs text-[#666]">链上实时数据</p>
        </div>
        
        <button 
          onClick={refresh}
          className="flex items-center justify-center size-8 rounded-full bg-[#f8fafc] hover:bg-[#e2e8f0] transition-colors shadow-sm"
          title="刷新数据"
          disabled={isRefreshing}
        >
          <svg 
            className={`size-4 text-[#3b82f6] ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {/* 微妙的刷新指示器 */}
      {isRefreshing && (
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-70 animate-pulse mb-4"></div>
      )}
      
      {/* 卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="border border-[#eaeaea] rounded-lg p-3 bg-[#f8fafc] hover:border-[#ddd] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              {/* 代币图标和字母标识 */}
              <div className="flex-shrink-0 size-10 flex items-center justify-center bg-[#f1f5f9] rounded-lg">
                <span className="text-lg font-bold text-[#333]">{card.tokenName.charAt(0)}</span>
              </div>
              
              {/* 代币名称和信息 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-['Inter'] text-sm font-semibold text-[#333] truncate max-w-[150px]">{card.tokenName}</span>
                    <span className="text-xs text-[#666]">@bankr ({card.followers} 关注者 / {card.following} 正在关注)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 地址信息 */}
            <div className="flex items-center mb-2">
              <span className="text-xs text-[#666]">地址: </span>
              <span className="text-xs text-[#3b82f6] font-medium ml-1 truncate max-w-[150px]">{formatAddress(card.address)}</span>
              <button
                className="flex size-4 items-center justify-center rounded-lg hover:bg-[#e2e8f0] transition-colors ml-1"
                onClick={() => navigator.clipboard.writeText(card.address)}
                title="复制地址"
              >
                <Image
                  src="/images/Copy.svg"
                  width={12}
                  height={12}
                  alt="复制"
                  className="cursor-pointer"
                />
              </button>
            </div>
            
            {/* 时间信息 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#666]">{formatTimeAgo(card.createdAt)}</span>
              
              {/* 统计信息 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <svg className="size-3 text-[#22c55e]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-[#666]">0%</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="size-3 text-[#666]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-[#666]">0%</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="size-3 text-[#666]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-[#666]">0 days</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
} 