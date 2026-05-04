'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type TabType = 'sales' | 'expenses'

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>('sales')
  const [salesList, setSalesList] = useState<any[]>([])
  const [expensesList, setExpensesList] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    setStartDate(`${year}-${month}-01`)
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`)
  }, [])

  useEffect(() => {
    if (startDate && endDate) fetchData()
  }, [startDate, endDate, tab])

  const fetchData = async () => {
    setLoading(true)
    if (tab === 'sales') {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
      setSalesList(data || [])
    } else {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
      setExpensesList(data || [])
    }
    setLoading(false)
  }

  const formatNumber = (n: number) => n?.toLocaleString('ko-KR')

  const filteredSales = salesList.filter(item =>
    !search ||
    item.channel?.includes(search) ||
    item.customer?.includes(search) ||
    item.product?.includes(search)
  )

  const filteredExpenses = expensesList.filter(item =>
    !search ||
    item.category?.includes(search) ||
    item.vendor?.includes(search) ||
    item.agency?.includes(search)
  )

  const totalSales = filteredSales.reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, i) => sum + (i.amount || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">히스토리</h1>

      {/* 기간 선택 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">시작일</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <span className="text-gray-400 mt-5">~</span>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">종료일</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <div className="mt-5">
            <button onClick={fetchData}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-700 transition">
              조회
            </button>
          </div>
          <div className="mt-5 flex-1 min-w-48">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="검색어 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>

        {/* 빠른 기간 선택 */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[1, 2, 3, 4, 5].map(m => {
            const now = new Date()
            const d = new Date(now.getFullYear(), now.getMonth() - (m - 1), 1)
            const year = d.getFullYear()
            const month = d.getMonth() + 1
            const label = `${month}월`
            return (
              <button key={m} onClick={() => {
                const from = `${year}-${String(month).padStart(2, '0')}-01`
                const lastDay = new Date(year, month, 0).getDate()
                const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                setStartDate(from)
                setEndDate(to)
              }}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition">
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('sales')}
          className={`px-6 py-3 rounded-xl font-medium text-sm transition ${tab === 'sales' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          💰 매출 내역
        </button>
        <button onClick={() => setTab('expenses')}
          className={`px-6 py-3 rounded-xl font-medium text-sm transition ${tab === 'expenses' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          🧾 비용 내역
        </button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {tab === 'sales' ? (
          <>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">총 매출</p>
              <p className="text-xl font-bold text-blue-600">{formatNumber(totalSales)}원</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">총 건수</p>
              <p className="text-xl font-bold text-gray-800">{filteredSales.length}건</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">평균 매출</p>
              <p className="text-xl font-bold text-green-600">
                {filteredSales.length > 0 ? formatNumber(Math.round(totalSales / filteredSales.length)) : 0}원
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">총 비용</p>
              <p className="text-xl font-bold text-orange-600">{formatNumber(totalExpenses)}원</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">총 건수</p>
              <p className="text-xl font-bold text-gray-800">{filteredExpenses.length}건</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">증빙 없는 항목</p>
              <p className="text-xl font-bold text-red-600">
                {filteredExpenses.filter(i => i.receipt_type === '없음').length}건
              </p>
            </div>
          </>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-center py-8 text-gray-400">불러오는 중...</p>
        ) : tab === 'sales' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">날짜</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">채널</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">거래처</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">상품</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">금액</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">결제</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">메모</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">데이터가 없습니다.</td>
                  </tr>
                ) : filteredSales.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2">{item.date}</td>
                    <td className="py-3 px-2">{item.channel}</td>
                    <td className="py-3 px-2">{item.customer}</td>
                    <td className="py-3 px-2">{item.product}</td>
                    <td className="py-3 px-2 text-right font-medium">{formatNumber(item.amount)}원</td>
                    <td className="py-3 px-2">{item.payment_method}</td>
                    <td className="py-3 px-2 text-gray-400">{item.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">날짜</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">확정</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">대분류</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">소분류</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">내용</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">금액</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">증빙</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">이체</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">데이터가 없습니다.</td>
                  </tr>
                ) : filteredExpenses.map(item => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!item.is_confirmed ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-2">{item.date}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.is_confirmed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.is_confirmed ? '확정' : '가안'}
                      </span>
                    </td>
                    <td className="py-3 px-2">{item.category}</td>
                    <td className="py-3 px-2">{item.sub_category}</td>
                    <td className="py-3 px-2">{item.vendor}</td>
                    <td className="py-3 px-2 text-right font-medium">{formatNumber(item.amount)}원</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.receipt_type === '없음' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {item.receipt_type || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.is_processed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_processed ? '✅ 완료' : '⏳ 미완료'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
