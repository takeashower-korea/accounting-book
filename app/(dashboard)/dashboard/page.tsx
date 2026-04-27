'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [totalSales, setTotalSales] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [noReceiptCount, setNoReceiptCount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: sales } = await supabase
      .from('sales')
      .select('amount')
      .gte('date', from)
      .lte('date', to)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, receipt_type')
      .gte('date', from)
      .lte('date', to)

    const salesTotal = sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0
    const expensesTotal = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const noReceipt = expenses?.filter(e => e.receipt_type === '없음').length || 0

    setTotalSales(salesTotal)
    setTotalExpenses(expensesTotal)
    setNoReceiptCount(noReceipt)
  }

  const formatNumber = (n: number) => n.toLocaleString('ko-KR')
  const now = new Date()
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h1>
      <p className="text-gray-500 text-sm mb-8">{monthLabel} 현황</p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">이번 달 매출</p>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(totalSales)}원</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">이번 달 비용</p>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(totalExpenses)}원</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">예상 순이익</p>
          <p className={`text-3xl font-bold ${totalSales - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {formatNumber(totalSales - totalExpenses)}원
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">증빙 없는 비용</p>
          <p className={`text-3xl font-bold ${noReceiptCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {noReceiptCount}건
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {noReceiptCount > 0 ? '세무사 제출 전 확인 필요' : '모두 증빙 있음'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">이번 달 세무사 제출 준비 상태</p>
        {noReceiptCount === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-xl">✅</span>
            <span className="font-medium">제출 준비 완료</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-500">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">증빙 없는 항목 {noReceiptCount}건 확인 필요</span>
          </div>
        )}
      </div>
    </div>
  )
}