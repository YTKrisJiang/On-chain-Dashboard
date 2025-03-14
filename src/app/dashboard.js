"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './home.module.css';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const [supabase, setSupabase] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletNames, setWalletNames] = useState({});
  const [stats, setStats] = useState({
    totalWallets: 0,
    todayTxs: 0,
    totalTokens: 0,
    specialTxs: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState({ id: null, success: false });

  // 初始化 Supabase 客户端
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        setSupabase(supabaseClient);
      }
    }
  }, []);

  // 加载交易数据和钱包名称
  useEffect(() => {
    if (supabase) {
      const fetchData = async () => {
        setLoading(true);
        
        try {
          // 获取钱包名称
          const { data: walletsData, error: walletsError } = await supabase
            .from('wallets')
            .select('address, name');
            
          if (walletsError) {
            console.error('Error fetching wallet names:', walletsError);
          } else if (walletsData) {
            // 转换为以地址为键，名称为值的对象
            const names = {};
            walletsData.forEach(wallet => {
              names[wallet.address] = wallet.name;
            });
            setWalletNames(names);
            console.log('钱包名称加载成功:', Object.keys(names).length);
          }
          
          // 获取交易数据
          const { data: txData, error: txError } = await supabase
            .from('txs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);
            
          if (txError) {
            console.error('Error fetching transactions:', txError);
          } else {
            setTransactions(txData || []);
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
      
      // 设置实时订阅
      const channel = supabase
        .channel('db-changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'txs' 
        }, payload => {
          // 将新交易添加到列表顶部
          setTransactions(current => [payload.new, ...current]);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase]);

  // 截断地址，只显示前4位和后4位
  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // 格式化时间戳
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 在 Solscan 中打开交易
  const openInSolscan = (signature) => {
    if (signature) {
      window.open(`https://solscan.io/tx/${signature}`, '_blank');
    }
  };

  // 处理页面切换
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 获取交易数据和钱包名称
  useEffect(() => {
    if (!supabase) return;
    
    async function fetchData() {
      setLoading(true);
      
      try {
        // 获取钱包名称映射
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('account, name');
          
        if (!walletsError && walletsData) {
          const namesMap = {};
          walletsData.forEach(wallet => {
            if (wallet.name) {
              namesMap[wallet.account] = wallet.name;
            }
          });
          setWalletNames(namesMap);
        }
        
        // 获取交易记录
        const { data: txData, error: txError, count } = await supabase
          .from('txs')
          .select('*', { count: 'exact' })
          .order('timestamp', { ascending: false })
          .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);
        
        if (txError) {
          console.error('Error fetching transactions:', txError);
        } else {
          setTransactions(txData || []);
          setTotalCount(count || 0);
          setTotalPages(Math.ceil((count || 0) / rowsPerPage));
        }
        
        // 获取基本统计数据
        const { count: walletCount } = await supabase
          .from('wallets')
          .select('*', { count: 'exact' });
        
        const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
        const { count: todayTxCount } = await supabase
          .from('txs')
          .select('*', { count: 'exact' })
          .gte('timestamp', todayStart);
        
        const { data: tokenData } = await supabase
          .from('txs')
          .select('token_in_address')
          .not('token_in_address', 'is', null);
        
        const uniqueTokens = new Set();
        tokenData?.forEach(tx => {
          if (tx.token_in_address) uniqueTokens.add(tx.token_in_address);
        });
        
        const { count: specialTxCount } = await supabase
          .from('txs')
          .select('*', { count: 'exact' })
          .eq('type', 'NFT');
        
        setStats({
          totalWallets: walletCount || 0,
          todayTxs: todayTxCount || 0,
          totalTokens: uniqueTokens.size,
          specialTxs: specialTxCount || 0
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [supabase, currentPage, rowsPerPage]);

  // 辅助函数：格式化数字，使用k和M表示大数字
  const formatNumber = (number) => {
    if (typeof number !== 'number') {
      // 尝试转换为数字
      number = parseFloat(number);
      if (isNaN(number)) return '0';
    }
    
    // 处理大数字格式
    if (number >= 1000000) {
      return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(2) + 'k';
    } else {
      return number.toFixed(2);
    }
  };

  // 复制到剪贴板的函数
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ id, success: true });
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopyStatus({ id: null, success: false });
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      setCopyStatus({ id, success: false });
    }
  };

  // 格式化相对时间（如：10s ago, 5m ago, 2h ago）
  const formatRelativeTime = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - timestamp;
    
    if (secondsAgo < 60) {
      return `${secondsAgo}s ago`;
    } else if (secondsAgo < 3600) {
      return `${Math.floor(secondsAgo / 60)}m ago`;
    } else if (secondsAgo < 86400) {
      return `${Math.floor(secondsAgo / 3600)}h ago`;
    } else {
      return `${Math.floor(secondsAgo / 86400)}d ago`;
    }
  };

  // 辅助函数：尝试将地址匹配为钱包名称
  const getWalletNameForAddress = (address) => {
    if (!address) return '';
    return walletNames[address] || truncateAddress(address);
  };

  // 处理事件描述，现在统一显示为 Swap
  const formatEventDescription = (description, account) => {
    // 简单返回 Swap
    return 'Swap';
  };

  // 格式化代币金额显示
  const formatTokenAmount = (amount, symbol) => {
    return `${formatNumber(amount)} ${symbol || ''}`;
  };

  // 主要的 JSX 渲染
  return (
    <div className={styles.container}>
      {/* 侧边栏 */}
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <Icon 
            icon="material-symbols:person-play" 
            width={sidebarCollapsed ? 36 : 32} 
            height={sidebarCollapsed ? 36 : 32} 
            className={styles.logoIcon} 
          />
          {!sidebarCollapsed && <span>发射台</span>}
          <button 
            className={styles.collapseBtn} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Icon icon={sidebarCollapsed ? "material-symbols:chevron-right" : "material-symbols:chevron-left"} />
          </button>
        </div>
        
        <nav className={styles.nav}>
          <ul>
            <li className={styles.active}>
              <Link href="/">
                <Icon 
                  icon="material-symbols:wallet" 
                  width={sidebarCollapsed ? 28 : 20} 
                  height={sidebarCollapsed ? 28 : 20} 
                  style={{ marginRight: sidebarCollapsed ? 0 : '8px' }} 
                />
                {!sidebarCollapsed && <span>聪明钱</span>}
              </Link>
            </li>
            <li>
              <Link href="/base">
                <Image 
                  src="/images/base-logo-in-blue.svg" 
                  width={sidebarCollapsed ? 28 : 20} 
                  height={sidebarCollapsed ? 28 : 20} 
                  style={{ marginRight: sidebarCollapsed ? 0 : '8px' }} 
                  alt="Base Chain"
                />
                {!sidebarCollapsed && <span>Base</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* 主内容区 */}
      <div className={styles.content}>
        {/* 头部 */}
        <div className={styles.header}>
          <div className={styles.dashboardTitle}>
            <h1>钱包监控</h1>
            <p>Solana 聪明钱</p>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className={styles.statsCards}>
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <p>监控钱包数量</p>
              <h2>{stats.totalWallets}</h2>
            </div>
          </div>
          
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <p>涉及代币数量</p>
              <h2>{stats.totalTokens}</h2>
            </div>
          </div>
          
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <p>今日交易笔数</p>
              <h2>{stats.todayTxs}</h2>
            </div>
          </div>
          
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <p>特殊交易笔数</p>
              <h2>{stats.specialTxs}</h2>
            </div>
          </div>
        </div>
        
        {/* 交易表格 */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2>交易记录</h2>
          </div>
          
          {!supabase ? (
            <div className={styles.loading}>正在连接数据库...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>钱包</th>
                  <th>Swap</th>
                  <th>数量</th>
                  <th>for</th>
                  <th>数量</th>
                  <th>时间</th>
                  <th>事件</th>
                  <th className={styles.txnColumn}>Txn</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className={styles.loading}>加载中...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.noData}>暂无交易数据</td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => (
                    <tr key={tx.id || index}>
                      <td>
                        <div className={styles.cellWithCopy}>
                          <span>{walletNames[tx.account] || truncateAddress(tx.account)}</span>
                          <button 
                            className={styles.copyButton} 
                            onClick={() => copyToClipboard(tx.account, `wallet-${tx.id || index}`)}
                            title="复制钱包地址"
                          >
                            {copyStatus.id === `wallet-${tx.id || index}` && copyStatus.success ? (
                              <Icon icon="material-symbols:check" />
                            ) : (
                              <Icon icon="material-symbols:content-copy-outline" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellWithCopy}>
                          <span>{tx.token_out_symbol || truncateAddress(tx.token_out_address)}</span>
                          <button 
                            className={styles.copyButton} 
                            onClick={() => copyToClipboard(tx.token_out_address, `token-out-${tx.id || index}`)}
                            title="复制代币地址"
                          >
                            {copyStatus.id === `token-out-${tx.id || index}` && copyStatus.success ? (
                              <Icon icon="material-symbols:check" />
                            ) : (
                              <Icon icon="material-symbols:content-copy-outline" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>{tx.token_out_amount ? formatNumber(tx.token_out_amount) : '-'}</td>
                      <td>
                        <div className={styles.cellWithCopy}>
                          <span>{tx.token_in_symbol || truncateAddress(tx.token_in_address)}</span>
                          <button 
                            className={styles.copyButton} 
                            onClick={() => copyToClipboard(tx.token_in_address, `token-in-${tx.id || index}`)}
                            title="复制代币地址"
                          >
                            {copyStatus.id === `token-in-${tx.id || index}` && copyStatus.success ? (
                              <Icon icon="material-symbols:check" />
                            ) : (
                              <Icon icon="material-symbols:content-copy-outline" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>{tx.token_in_amount ? formatNumber(tx.token_in_amount) : '-'}</td>
                      <td>{formatRelativeTime(tx.timestamp)}</td>
                      <td>{formatEventDescription(tx.type || tx.description, tx.account)}</td>
                      <td className={styles.txnColumn}>
                        <span 
                          className={styles.txnLink}
                          onClick={() => openInSolscan(tx.signature)}
                          title="在 Solscan 中查看"
                        >
                          {truncateAddress(tx.signature)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          
          {/* 分页控件 */}
          {supabase && (
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                <span>显示 {Math.min((currentPage - 1) * rowsPerPage + 1, totalCount)} 到 {Math.min(currentPage * rowsPerPage, totalCount)} 共 {totalCount} 条</span>
              </div>
              
              <div className={styles.pageControls}>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Icon icon="material-symbols:chevron-left" />
                </button>
                <span className={styles.pageNumber}>{currentPage}</span>
                <span>共 {totalPages} 页</span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Icon icon="material-symbols:chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 