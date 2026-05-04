'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const [thisMonth, setThisMonth] = useState({ sales: 0, expenses: 0, noReceipt: 0 })
  const [lastMonth, setLastMonth] = useState({ sales: 0, expenses: 0 })
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const now = new Date()
    await Promise.all([
      fetchMonthData(now.getFullYear(), now.getMonth() + 1, 'this'),
      fetchMonthData(now.getFullYear(), now.getMonth(), 'last'),
      fetchChartData(),
    ])
    setLoading(false)
  }

  const fetchMonthData = async (year: number, month: number, type: 'this' | 'last') => {
    if (month === 0) { year -= 1; month = 12 }
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: sales } = await supabase
      .from('sales').select('amount').gte('date', from).lte('date', to)
    const { data: expenses } = await supabase
      .from('expenses').select('amount, receipt_type').gte('date', from).lte('date', to)

    const totalSales = sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const noReceipt = expenses?.filter(e => e.receipt_type === '없음').length || 0

    if (type === 'this') setThisMonth({ sales: totalSales, expenses: totalExpenses, noReceipt })
    else setLastMonth({ sales: totalSales, expenses: totalExpenses })
  }

  const fetchChartData = async () => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data: sales } = await supabase
        .from('sales').select('amount').gte('date', from).lte('date', to)
      const { data: expenses } = await supabase
        .from('expenses').select('amount').gte('date', from).lte('date', to)

      months.push({
        month: `${month}월`,
        매출: sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
        비용: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      })
    }
    setChartData(months)
  }

  const formatNumber = (n: number) => n.toLocaleString('ko-KR')
  const formatShort = (n: number) => {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
    if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
    return n.toLocaleString()
  }

  const now = new Date()
  const thisMonthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`
  const lastMonthLabel = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}년 ${now.getMonth() === 0 ? 12 : now.getMonth()}월`

  const salesChange = thisMonth.sales - lastMonth.sales
  const expensesChange = thisMonth.expenses - lastMonth.expenses

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">데이터 불러오는 중...</p>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h1>
      <p className="text-gray-500 text-sm mb-6">{thisMonthLabel} 현황</p>

      {/* 이번 달 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">이번 달 매출</p>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(thisMonth.sales)}원</p>
          <p className={`text-xs mt-2 ${salesChange >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            지난달 대비 {salesChange >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(salesChange))}원
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">이번 달 비용</p>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(thisMonth.expenses)}원</p>
          <p className={`text-xs mt-2 ${expensesChange <= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            지난달 대비 {expensesChange >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(expensesChange))}원
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">예상 순이익</p>
          <p className={`text-3xl font-bold ${thisMonth.sales - thisMonth.expenses >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {formatNumber(thisMonth.sales - thisMonth.expenses)}원
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">증빙 없는 비용</p>
          <p className={`text-3xl font-bold ${thisMonth.noReceipt > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {thisMonth.noReceipt}건
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {thisMonth.noReceipt > 0 ? '세무사 제출 전 확인 필요' : '모두 증빙 있음'}
          </p>
        </div>
      </div>

      {/* 월별 그래프 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📊 최근 6개월 매출/비용</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatShort} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: any) => `${formatNumber(Number(value))}원`} />
            <Legend />
            <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="비용" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 지난달 비교 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📋 {lastMonthLabel} 현황</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">매출</p>
            <p className="text-xl font-bold text-gray-800">{formatNumber(lastMonth.sales)}원</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">비용</p>
            <p className="text-xl font-bold text-gray-800">{formatNumber(lastMonth.expenses)}원</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">순이익</p>
            <p className={`text-xl font-bold ${lastMonth.sales - lastMonth.expenses >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {formatNumber(lastMonth.sales - lastMonth.expenses)}원
            </p>
          </div>
        </div>
      </div>

      {/* 세무사 제출 상태 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">이번 달 세무사 제출 준비 상태</p>
        {thisMonth.noReceipt === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-xl">✅</span>
            <span className="font-medium">제출 준비 완료</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-500">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">증빙 없는 항목 {thisMonth.noReceipt}건 확인 필요</span>
          </div>
        )}
      </div>
    </div>
  )
}
