'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const menus = [
  { href: '/dashboard', label: '📊 대시보드', external: false },
  { href: '/sales', label: '💰 매출 입력', external: false },
  { href: '/expenses', label: '🧾 비용 입력', external: false },
  { href: '/partners', label: '🏢 거래처 관리', external: false },
  { href: '/inventory', label: '📦 배송/재고 관리', external: false },
  { href: '/tax', label: '📋 세무사 자료', external: false },
  { href: '/history', label: '📂 히스토리', external: false },
  { href: '/subscriptions', label: '🔄 정기결제 관리', external: false },
  { href: '/settings', label: '⚙️ 설정', external: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ width: '240px', minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>테이크어샤워</h1>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>회계장부 시스템</p>
      </div>

      <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menus.map((menu) => (
          menu.external ? (
            <a
              key={menu.href}
              href={menu.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#9CA3AF', textDecoration: 'none' }}
            >
              {menu.label}
            </a>
          ) : (
            <Link
              key={menu.href}
              href={menu.href}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                backgroundColor: pathname === menu.href ? '#374151' : 'transparent',
                color: pathname === menu.href ? 'white' : '#9CA3AF',
              }}
            >
              {menu.label}
            </Link>
          )
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid #374151' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '12px 16px', fontSize: '14px', color: '#9CA3AF', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          🚪 로그아웃
        </button>
      </div>
    </div>
  )
}
