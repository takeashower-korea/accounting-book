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
    <div className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold">테이크어샤워</h1>
        <p className="text-xs text-gray-400 mt-1">회계장부 시스템</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menus.map((menu) => (
          menu.external ? (
            <a
              key={menu.href}
              href={menu.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 rounded-lg text-sm font-medium transition text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              {menu.label}
            </a>
          ) : (
            <Link
              key={menu.href}
              href={menu.href}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
                pathname === menu.href
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {menu.label}
            </Link>
          )
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition text-left"
        >
          🚪 로그아웃
        </button>
      </div>
    </div>
  )
}
