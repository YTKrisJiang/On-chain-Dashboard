'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Image from 'next/image'
import { ClankerSection } from '../components/ClankerSection'
import styles from '../home.module.css'

export default function BasePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 切换侧边栏状态
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

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
            onClick={toggleSidebar}
          >
            <Icon icon={sidebarCollapsed ? "material-symbols:chevron-right" : "material-symbols:chevron-left"} />
          </button>
        </div>
        
        <nav className={styles.nav}>
          <ul>
            <li>
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
            <li className={styles.active}>
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
        
        
        {/* Clanker 内容区 */}
        <div className={styles.tableContainer}>
          <ClankerSection />
        </div>
      </div>
    </div>
  )
} 