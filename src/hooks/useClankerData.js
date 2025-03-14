'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
// 使用JSDoc导入类型
/**
 * @typedef {import('../types').ProfileCard} ProfileCard
 * @typedef {import('../types').TokenData} TokenData
 */

/**
 * 获取 Clanker 数据的 hook
 * @returns {Object} 包含 cards 数据、加载状态、错误信息和重试函数
 */
export function useClankerData() {
  const [cards, setCards] = useState([])
  const [isLoading, setIsLoading] = useState(true) // 初始加载时显示加载状态
  const [isRefreshing, setIsRefreshing] = useState(false) // 刷新时的状态
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // 初始加载数据
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await axios.get('/api/warpcast')
      
      if (Array.isArray(response.data)) {
        setCards(response.data)
      } else {
        throw new Error('无效的数据格式')
      }
    } catch (err) {
      console.error('获取数据错误:', err)
      setError(
        axios.isAxiosError(err) && err.response?.status === 500
          ? '服务器错误，请稍后再试。'
          : '获取数据失败，请检查您的网络连接。'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 静默刷新数据
  const refreshData = useCallback(async () => {
    if (isRefreshing) return; // 防止并发刷新请求
    
    try {
      setIsRefreshing(true)
      // 不设置加载状态，保持UI稳定
      
      const response = await axios.get('/api/warpcast')
      
      if (Array.isArray(response.data)) {
        setCards(response.data)
        // 成功刷新后清除任何错误
        setError(null)
      }
    } catch (err) {
      console.error('刷新数据错误:', err)
      // 刷新失败时不显示错误，保持旧数据
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  // 初始加载
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData, retryCount])

  // 设置自动刷新
  useEffect(() => {
    // 只有在初始数据加载成功后才开始自动刷新
    if (!isLoading && cards.length > 0) {
      const intervalId = setInterval(refreshData, 30000) // 每30秒刷新一次
      return () => clearInterval(intervalId)
    }
  }, [isLoading, cards.length, refreshData])

  // 手动重试函数 - 用于错误状态下的重试
  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
  }, [])

  return { 
    cards, 
    isLoading, 
    isRefreshing, // 导出刷新状态，可用于显示微妙的刷新指示器
    error, 
    retry,
    refresh: refreshData // 导出手动刷新函数
  }
} 