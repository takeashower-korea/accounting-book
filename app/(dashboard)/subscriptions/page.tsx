'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const billingCycles = ['월간', '연간']
const categories = ['업무툴', '마케팅', '인프라', 'AI', '구독서비스', '기타']
const paymentMethods = [
  '①번 카드 - 판매 수익 정산용',
  '②번 카드 - 내부 현금 거래용',
  '③번 카드 - 광고비 결제용',
  '④번 카드 - 거래처 결제 및 출장용',
  '⑤번 카드 - 식사/비품 구입용',
  'N페이/온라인 카드',
  '계좌이체',
  '기타'
]

const emptyForm = {
  name: '',
  category: '',
  billing_cycle: '월간',
  payment_method: '',
  amount: '',
  billing_day: '',
  billing_month: '',
  next_billing_date: '',
  is_active: true,
  memo: '',
}

export default function SubscriptionsPage() {
  const [form, setForm] = useState<any>(emptyForm)
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .order('billing_day', { ascending: true })
    setList(data || [])
  }

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.amount) {
      alert('서비스명과 금액은 필수입니다.')
      return
    }
    setLoading(true)
    const payload = {
      ...form,
      amount: parseInt(form.amount.toString().replace(/,/g, '')),
      billing_day: form.billing_day ? parseInt(form.billing_day) : null,
      billing_month: form.billing_month ? parseInt(form.billing_month) : null,
    }

    if (editId) {
      await supabase.from('subscriptions').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('subscriptions').insert([payload])
    }

    setSuccess(true)
    setForm(emptyForm)
    fetchList()
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      category: item.category || '',
      billing_cycle: item.billing_cycle,
      payment_method: item.payment_method || '',
      amount: item.amount?.toString() || '',
      billing_day: item.billing_day?.toString() || '',
      billing_month: item.billing_month?.toString() || '',
      next_billing_date: item.next_billing_date || '',
      is_active: item.is_active,
      memo: item.memo || '',
    })
    setEditId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('subscriptions').delete().eq('id', id)
    fetchList()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('subscriptions').update({ is_active: !current }).eq('id', id)
    fetchList()
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm(emptyForm)
  }

  const formatNumber = (n: number) => n?.toLocaleString('ko-KR')

  // 이번 달 결제 예정일까지 남은 날 계산
  const getDaysUntilBilling = (billingDay: number) => {
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingDay)
    if (thisMonth < today) {
      thisMonth.setMonth(thisMonth.getMonth() + 1)
    }
    const diff = Math.ceil((thisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // 연간 결제 갱신까지 남은 달 계산
  const getMonthsUntilRenewal = (nextBillingDate: string) => {
    if (!nextBillingDate) return null
    const today = new Date()
    const renewal = new Date(nextBillingDate)
    const months = (renewal.getFullYear() - today.getFullYear()) * 12 + renewal.getMonth() - today.getMonth()
    return months
  }

  const filtered = list.filter(item => {
    if (filterActive === 'active') return item.is_active
    if (filterActive === 'inactive') return !item.is_active
    return true
  })

  const activeList = list.filter(i => i.is_active)
  const monthlyTotal = activeList
    .filter(i => i.billing_cycle === '월간')
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const yearlyTotal = activeList
    .filter(i => i.billing_cycle === '연간')
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const monthlyEquivalent = monthlyTotal + Math.round(yearlyTotal / 12)

  // 카드별 합계
  const cardSummary = activeList.reduce((acc: any, item) => {
    const card = item.payment_method || '미지정'
    const monthly = item.billing_cycle === '월간' ? item.amount : Math.round(item.amount / 12)
    acc[card] = (acc[card] || 0) + monthly
    return acc
  }, {})

  // 이번 달 결제 예정 (7일 이내)
  const upcomingBillings = activeList.filter(item => {
    if (item.billing_cycle !== '월간' || !item.billing_day) return false
    const days = getDaysUntilBilling(item.billing_day)
    return days <= 7
  }).sort((a, b) => getDaysUntilBilling(a.billing_day) - getDaysUntilBilling(b.billing_day))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">정기결제 관리</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">월 정기결제 합계</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(monthlyTotal)}원</p>
          <p className="text-xs text-gray-400 mt-1">월간 구독만</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">연간 결제 합계</p>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(yearlyTotal)}원</p>
          <p className="text-xs text-gray-400 mt-1">월 환산 {formatNumber(Math.round(yearlyTotal / 12))}원</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">실질 월 지출</p>
          <p className="text-2xl font-bold text-orange-600">{formatNumber(monthlyEquivalent)}원</p>
          <p className="text-xs text-gray-400 mt-1">월간 + 연간 월환산 합계</p>
        </div>
      </div>

      {/* 이번 달 결제 예정 알림 */}
      {upcomingBillings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-700 mb-3">⏰ 7일 이내 결제 예정</p>
          <div className="flex flex-wrap gap-2">
            {upcomingBillings.map(item => {
              const days = getDaysUntilBilling(item.billing_day)
              return (
                <div key={item.id} className="bg-white rounded-lg px-3 py-2 text-sm border border-yellow-200">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">{formatNumber(item.amount)}원</span>
                  <span className={`ml-2 font-medium ${days === 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                    {days === 0 ? '오늘!' : `${days}일 후`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 카드별 합계 */}
      {Object.keys(cardSummary).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">💳 카드별 월 정기결제</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cardSummary).map(([card, amt]: any) => (
              <span key={card} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {card.length > 15 ? card.substring(0, 15) + '...' : card}:
                <span className="font-medium ml-1">{formatNumber(amt)}원/월</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 입력 폼 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editId ? '✏️ 정기결제 수정' : '➕ 새 정기결제 등록'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">서비스명 *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="예: Claude AI, Google Workspace"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">카테고리</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">결제 주기 *</label>
            <select name="billing_cycle" value={form.billing_cycle} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              {billingCycles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">결제 수단</label>
            <select name="payment_method" value={form.payment_method} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">금액 *</label>
            <input type="text" name="amount" value={form.amount} onChange={handleChange}
              placeholder="금액 입력 (숫자만)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          {form.billing_cycle === '월간' ? (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">결제일 (매월 몇 일)</label>
              <input type="number" name="billing_day" value={form.billing_day} onChange={handleChange}
                placeholder="예: 10"
                min="1" max="31"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">결제 월 (몇 월)</label>
                <input type="number" name="billing_month" value={form.billing_month} onChange={handleChange}
                  placeholder="예: 3 (3월)"
                  min="1" max="12"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">다음 갱신일</label>
                <input type="date" name="next_billing_date" value={form.next_billing_date} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" name="is_active" checked={form.is_active}
              onChange={handleChange} id="is_active"
              className="w-5 h-5 rounded border-gray-300" />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-600">
              현재 사용 중
            </label>
          </div>

          <div className="col-span-2">
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
            {loading ? '저장 중...' : editId ? '✏️ 수정 완료' : '정기결제 등록'}
          </button>
          {editId && (
            <button onClick={handleCancelEdit}
              className="px-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition">
              취소
            </button>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">정기결제 목록</h2>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilterActive(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterActive === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'all' ? '전체' : f === 'active' ? '사용중' : '해지됨'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">서비스명</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">카테고리</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">주기</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">금액</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">결제일</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">결제수단</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">D-day</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">상태</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    등록된 정기결제가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const ddays = item.billing_cycle === '월간' && item.billing_day
                    ? getDaysUntilBilling(item.billing_day)
                    : null
                  const months = item.billing_cycle === '연간'
                    ? getMonthsUntilRenewal(item.next_billing_date)
                    : null

                  return (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!item.is_active ? 'opacity-50' : ''} ${editId === item.id ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-2 font-medium">{item.name}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {item.category || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.billing_cycle === '월간' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.billing_cycle}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">{formatNumber(item.amount)}원</td>
                      <td className="py-3 px-2">
                        {item.billing_cycle === '월간'
                          ? item.billing_day ? `매월 ${item.billing_day}일` : '-'
                          : item.billing_month ? `${item.billing_month}월` : '-'}
                      </td>
                      <td className="py-3 px-2 text-xs text-gray-500">
                        {item.payment_method?.substring(0, 10) || '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {ddays !== null && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ddays <= 3 ? 'bg-red-100 text-red-600' : ddays <= 7 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                            {ddays === 0 ? '오늘!' : `D-${ddays}`}
                          </span>
                        )}
                        {months !== null && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${months !== null && months <= 1 ? 'bg-red-100 text-red-600' : months !== null && months <= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                            {months !== null && months <= 0 ? '갱신필요!' : months !== null ? `${months}달 후` : '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${item.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {item.is_active ? '사용중' : '해지됨'}
                        </button>
                      </td>
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
