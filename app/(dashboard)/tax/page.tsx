'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function TaxPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [noReceiptList, setNoReceiptList] = useState<any[]>([])
  const [showNoReceipt, setShowNoReceipt] = useState(false)

  const downloadSales = async () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.')
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (!data || data.length === 0) {
      alert('해당 기간에 매출 데이터가 없습니다.')
      setLoading(false)
      return
    }

    const rows = data.map(item => ({
      날짜: item.date,
      판매채널: item.channel || '',
      거래처명: item.customer || '',
      상품명: item.product || '',
      수량: item.quantity || '',
      매출금액: item.amount || 0,
      결제방식: item.payment_method || '',
      메모: item.memo || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '매출내역')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `매출내역_${startDate}_${endDate}.xlsx`)
    setLoading(false)
  }

  const downloadExpenses = async () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.')
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .neq('payment_method', '②번 카드 - 내부 현금 거래용')
      .order('date', { ascending: true })

    if (!data || data.length === 0) {
      alert('해당 기간에 비용 데이터가 없습니다.')
      setLoading(false)
      return
    }

    const rows = data.map(item => ({
      날짜: item.date,
      확정여부: item.is_confirmed ? '확정' : '가안',
      고정변동: item.expense_type || '',
      대분류: item.category || '',
      소분류: item.sub_category || '',
      진행사: item.agency || '',
      내용: item.vendor || '',
      금액: item.amount || 0,
      결제수단: item.payment_method || '',
      증빙종류: item.receipt_type || '',
      은행명: item.bank_name || '',
      계좌번호: item.account_number || '',
      이체일: item.transfer_date || '',
      이체완료: item.is_processed ? '완료' : '미완료',
      메모: item.memo || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '비용내역')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `비용내역_${startDate}_${endDate}.xlsx`)
    setLoading(false)
  }

  const downloadSummary = async () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.')
      return
    }
    setLoading(true)

    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .neq('payment_method', '②번 카드 - 내부 현금 거래용')

    const totalSales = sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const noReceipt = expenses?.filter(e => e.receipt_type === '없음').length || 0

    const summaryRows = [
      { 항목: '총 매출', 금액: totalSales },
      { 항목: '총 비용', 금액: totalExpenses },
      { 항목: '순이익', 금액: totalSales - totalExpenses },
      { 항목: '증빙 없는 비용 건수', 금액: noReceipt },
    ]

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, ws1, '요약')

    if (sales && sales.length > 0) {
      const salesRows = sales.map(item => ({
        날짜: item.date,
        판매채널: item.channel || '',
        거래처명: item.customer || '',
        상품명: item.product || '',
        수량: item.quantity || '',
        매출금액: item.amount || 0,
        결제방식: item.payment_method || '',
      }))
      const ws2 = XLSX.utils.json_to_sheet(salesRows)
      XLSX.utils.book_append_sheet(wb, ws2, '매출내역')
    }

    if (expenses && expenses.length > 0) {
      const expRows = expenses.map(item => ({
        날짜: item.date,
        대분류: item.category || '',
        소분류: item.sub_category || '',
        내용: item.vendor || '',
        금액: item.amount || 0,
        결제수단: item.payment_method || '',
        증빙종류: item.receipt_type || '',
      }))
      const ws3 = XLSX.utils.json_to_sheet(expRows)
      XLSX.utils.book_append_sheet(wb, ws3, '비용내역')
    }

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `월별요약_${startDate}_${endDate}.xlsx`)
    setLoading(false)
  }

  const fetchNoReceipt = async () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.')
      return
    }
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('receipt_type', '없음')
      .order('date', { ascending: true })

    setNoReceiptList(data || [])
    setShowNoReceipt(true)
  }

  const formatNumber = (n: number) => n?.toLocaleString('ko-KR')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">세무사 자료</h1>

      {/* 기간 선택 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📅 기간 선택</h2>
        <div className="flex items-center gap-4">
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
        </div>
      </div>

      {/* 다운로드 버튼들 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">💰 매출 내역</h3>
          <p className="text-sm text-gray-500 mb-4">선택 기간의 매출 데이터를 엑셀로 다운로드</p>
          <button onClick={downloadSales} disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
            📥 매출 내역 다운로드
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">🧾 비용 내역</h3>
          <p className="text-sm text-gray-500 mb-4">②번 카드 제외, 선택 기간의 비용 데이터를 엑셀로 다운로드</p>
          <button onClick={downloadExpenses} disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50">
            📥 비용 내역 다운로드
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">⚠️ 증빙 없는 항목</h3>
          <p className="text-sm text-gray-500 mb-4">증빙이 없는 비용 항목만 따로 확인</p>
          <button onClick={fetchNoReceipt} disabled={loading}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50">
            🔍 증빙 없는 항목 보기
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">📊 월별 요약</h3>
          <p className="text-sm text-gray-500 mb-4">매출/비용/순이익 요약 + 전체 내역을 한 파일로</p>
          <button onClick={downloadSummary} disabled={loading}
            className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50">
            📥 월별 요약 다운로드
          </button>
        </div>
      </div>

      {/* 증빙 없는 항목 목록 */}
      {showNoReceipt && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            ⚠️ 증빙 없는 항목 ({noReceiptList.length}건)
          </h2>
          {noReceiptList.length === 0 ? (
            <p className="text-green-600 font-medium">✅ 증빙 없는 항목이 없습니다!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">날짜</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">대분류</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">소분류</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">내용</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">금액</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">결제수단</th>
                  </tr>
                </thead>
                <tbody>
                  {noReceiptList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50">
                      <td className="py-3 px-2">{item.date}</td>
                      <td className="py-3 px-2">{item.category}</td>
                      <td className="py-3 px-2">{item.sub_category}</td>
                      <td className="py-3 px-2">{item.vendor}</td>
                      <td className="py-3 px-2 text-right font-medium text-red-600">
                        {formatNumber(item.amount)}원
                      </td>
                      <td className="py-3 px-2">{item.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
