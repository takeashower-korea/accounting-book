'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const channelGroups = [
  {
    group: 'B2C 온라인',
    channels: ['자사몰', '스마트스토어', '쿠팡', '지그재그', '에이블리', '롯데온', '화해', '오늘의집', 'W컨셉', '김해온몰', '무케렌시아', '소노몰']
  },
  {
    group: 'B2B',
    channels: ['B2B 온라인', 'B2B 오프라인', '기타 B2B']
  },
  {
    group: '기타',
    channels: ['기타']
  }
]
const paymentMethods = ['카드', '계좌이체', '현금', '플랫폼정산', '기타']

export default function SalesPage() {
  const [form, setForm] = useState({
    date: '', channel: '', customer: '', product: '',
    quantity: '', amount: '', payment_method: '', memo: '',
  })
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchList()
  }, [selectedMonth])

  const fetchList = async () => {
    const [year, month] = selectedMonth.split('-')
    const from = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })

    if (error) console.log('매출 조회 에러:', error)
    setList(data || [])
  }

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.date || !form.amount) {
      alert('날짜와 금액은 필수입니다.')
      return
    }
    setLoading(true)
    const payload = {
      ...form,
      quantity: form.quantity ? parseInt(form.quantity) : null,
      amount: parseInt(form.amount.replace(/,/g, '')),
    }

    if (editId) {
      await supabase.from('sales').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('sales').insert([payload])
    }

    setSuccess(true)
    setForm({ date: '', channel: '', customer: '', product: '', quantity: '', amount: '', payment_method: '', memo: '' })
    fetchList()
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const handleEdit = (item: any) => {
    setForm({
      date: item.date, channel: item.channel || '', customer: item.customer || '',
      product: item.product || '', quantity: item.quantity || '',
      amount: item.amount?.toString() || '', payment_method: item.payment_method || '',
      memo: item.memo || '',
    })
    setEditId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('sales').delete().eq('id', id)
    fetchList()
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm({ date: '', channel: '', customer: '', product: '', quantity: '', amount: '', payment_method: '', memo: '' })
  }

  const formatNumber = (n: number) => n?.toLocaleString('ko-KR')
  const totalAmount = list.reduce((sum, item) => sum + (item.amount || 0), 0)
  const channelSummary = list.reduce((acc: any, item) => {
    const ch = item.channel || '기타'
    acc[ch] = (acc[ch] || 0) + (item.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">매출 입력</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editId ? '✏️ 매출 수정' : '새 매출 입력'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">날짜 *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">판매채널</label>
            <select name="channel" value={form.channel} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {channelGroups.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.channels.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">거래처명</label>
            <input type="text" name="customer" value={form.customer} onChange={handleChange}
              placeholder="거래처명 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">상품명</label>
            <input type="text" name="product" value={form.product} onChange={handleChange}
              placeholder="상품명 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">수량</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
              placeholder="수량 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">총 매출금액 *</label>
            <input type="text" name="amount" value={form.amount} onChange={handleChange}
              placeholder="금액 입력 (숫자만)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">결제방식</label>
            <select name="payment_method" value={form.payment_method} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">메모</label>
            <input type="text" name="memo" value={form.memo} onChange={handleChange}
              placeholder="메모 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>

        {success && (
          <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            ✅ {editId ? '수정' : '저장'}되었습니다!
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50">
            {loading ? '저장 중...' : editId ? '✏️ 수정 완료' : '매출 저장'}
          </button>
          {editId && (
            <button onClick={handleCancelEdit}
              className="px-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition">
              취소
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">📅 월별 조회</h2>
          <input type="month" value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">총 매출</p>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(totalAmount)}원</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">총 건수</p>
            <p className="text-2xl font-bold text-gray-800">{list.length}건</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">평균 매출</p>
            <p className="text-2xl font-bold text-green-600">
              {list.length > 0 ? formatNumber(Math.round(totalAmount / list.length)) : 0}원
            </p>
          </div>
        </div>

        {Object.keys(channelSummary).length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">채널별 매출</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(channelSummary).map(([ch, amt]: any) => (
                <span key={ch} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {ch}: <span className="font-medium">{formatNumber(amt)}원</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">매출 내역</h2>
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
                <th className="text-center py-3 px-2 text-gray-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    입력된 매출이 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${editId === item.id ? 'bg-yellow-50' : ''}`}>
                    <td className="py-3 px-2">{item.date}</td>
                    <td className="py-3 px-2">{item.channel}</td>
                    <td className="py-3 px-2">{item.customer}</td>
                    <td className="py-3 px-2">{item.product}</td>
                    <td className="py-3 px-2 text-right font-medium">{formatNumber(item.amount)}원</td>
                    <td className="py-3 px-2">{item.payment_method}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEdit(item)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition">
                          수정
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 bg-red-50 text-red-500 rounded text-xs hover:bg-red-100 transition">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
