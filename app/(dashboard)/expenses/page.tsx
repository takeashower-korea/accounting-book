'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const categoryGroups = [
  { group: '마케팅', subs: ['실비', '마크업', '운영비'] },
  { group: '기타 운영비', subs: ['물류비', '발주', '플랫폼', 'AI 구독료', '기타'] },
  { group: '회사 관리비', subs: ['식대', '관리비', '4대보험'] }
]
const paymentMethods = [
  '①번 카드 - 판매 수익 정산용',
  '②번 카드 - 내부 현금 거래용',
  '③번 카드 - 광고비 결제용',
  '④번 카드 - 거래처 결제 및 출장용',
  '⑤번 카드 - 식사/비품 구입용',
  'N페이/온라인 카드', '계좌이체', '현금', '기타'
]
const receiptTypes = ['세금계산서', '카드영수증', '현금영수증', '간이영수증', '없음']
const expenseTypes = ['고정', '변동']

const emptyForm = {
  date: '', is_confirmed: true, expense_type: '', category: '',
  sub_category: '', vendor: '', agency: '', amount: '',
  payment_method: '', bank_name: '', account_number: '',
  transfer_date: '', receipt_type: '', is_processed: false, memo: '',
}

export default function ExpensesPage() {
  const [form, setForm] = useState<any>(emptyForm)
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
    const from = `${selectedMonth}-01`
    const to = `${selectedMonth}-31`
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
    setList(data || [])
  }

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (e.target.name === 'category') {
      setForm({ ...form, category: value, sub_category: '' })
    } else {
      setForm({ ...form, [e.target.name]: value })
    }
  }

  const handleSubmit = async () => {
    if (!form.date || !form.amount) {
      alert('날짜와 금액은 필수입니다.')
      return
    }
    setLoading(true)
    const payload = {
      ...form,
      amount: parseInt(form.amount.toString().replace(/,/g, '')),
    }

    if (editId) {
      await supabase.from('expenses').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('expenses').insert([payload])
    }

    setSuccess(true)
    setForm(emptyForm)
    fetchList()
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const handleEdit = (item: any) => {
    setForm({
      date: item.date, is_confirmed: item.is_confirmed,
      expense_type: item.expense_type || '', category: item.category || '',
      sub_category: item.sub_category || '', vendor: item.vendor || '',
      agency: item.agency || '', amount: item.amount?.toString() || '',
      payment_method: item.payment_method || '', bank_name: item.bank_name || '',
      account_number: item.account_number || '', transfer_date: item.transfer_date || '',
      receipt_type: item.receipt_type || '', is_processed: item.is_processed || false,
      memo: item.memo || '',
    })
    setEditId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchList()
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm(emptyForm)
  }

  const toggleProcessed = async (id: string, current: boolean) => {
    await supabase.from('expenses').update({ is_processed: !current }).eq('id', id)
    fetchList()
  }

  const formatNumber = (n: number) => n?.toLocaleString('ko-KR')
  const selectedGroup = categoryGroups.find(g => g.group === form.category)
  const totalAmount = list.reduce((sum, item) => sum + (item.amount || 0), 0)

  const categorySummary = list.reduce((acc: any, item) => {
    const cat = item.category || '기타'
    acc[cat] = (acc[cat] || 0) + (item.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">비용 입력</h1>

      {/* 입력 폼 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editId ? '✏️ 비용 수정' : '새 비용 입력'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">날짜 *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">확정 여부</label>
            <select name="is_confirmed" value={form.is_confirmed ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, is_confirmed: e.target.value === 'true' })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="true">✅ 확정</option>
              <option value="false">⏳ 가안</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">고정/변동</label>
            <select name="expense_type" value={form.expense_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">대분류</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {categoryGroups.map(g => (
                <option key={g.group} value={g.group}>{g.group}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">소분류</label>
            <select name="sub_category" value={form.sub_category} onChange={handleChange}
              disabled={!form.category}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">선택</option>
              {selectedGroup?.subs.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">진행사</label>
            <input type="text" name="agency" value={form.agency} onChange={handleChange}
              placeholder="진행사 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">내용 (사용처)</label>
            <input type="text" name="vendor" value={form.vendor} onChange={handleChange}
              placeholder="내용 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">금액 *</label>
            <input type="text" name="amount" value={form.amount} onChange={handleChange}
              placeholder="금액 입력 (숫자만)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">결제수단</label>
            <select name="payment_method" value={form.payment_method} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">증빙종류</label>
            <select name="receipt_type" value={form.receipt_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {receiptTypes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">은행명</label>
            <input type="text" name="bank_name" value={form.bank_name} onChange={handleChange}
              placeholder="은행명 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">계좌번호</label>
            <input type="text" name="account_number" value={form.account_number} onChange={handleChange}
              placeholder="계좌번호 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이체일</label>
            <input type="text" name="transfer_date" value={form.transfer_date} onChange={handleChange}
              placeholder="예: 매월 10일"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" name="is_processed" checked={form.is_processed}
              onChange={handleChange} id="is_processed"
              className="w-5 h-5 rounded border-gray-300" />
            <label htmlFor="is_processed" className="text-sm font-medium text-gray-600">
              이체 완료
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
            {loading ? '저장 중...' : editId ? '✏️ 수정 완료' : '비용 저장'}
          </button>
          {editId && (
            <button onClick={handleCancelEdit}
              className="px-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition">
              취소
            </button>
          )}
        </div>
      </div>

      {/* 월별 필터 + 요약 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">📅 월별 조회</h2>
          <input type="month" value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">총 비용</p>
            <p className="text-2xl font-bold text-orange-600">{formatNumber(totalAmount)}원</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">총 건수</p>
            <p className="text-2xl font-bold text-gray-800">{list.length}건</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">증빙 없는 항목</p>
            <p className="text-2xl font-bold text-red-600">
              {list.filter(i => i.receipt_type === '없음').length}건
            </p>
          </div>
        </div>

        {Object.keys(categorySummary).length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">카테고리별 비용</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categorySummary).map(([cat, amt]: any) => (
                <span key={cat} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {cat}: <span className="font-medium">{formatNumber(amt)}원</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">비용 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">날짜</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">확정</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">구분</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">대분류</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">소분류</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">내용</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">금액</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">증빙</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">이체</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">
                    입력된 비용이 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!item.is_confirmed ? 'bg-red-50' : ''} ${editId === item.id ? 'bg-yellow-50' : ''}`}>
                    <td className="py-3 px-2">{item.date}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.is_confirmed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.is_confirmed ? '확정' : '가안'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.expense_type === '고정' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {item.expense_type || '-'}
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
                      <button onClick={() => toggleProcessed(item.id, item.is_processed)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition ${item.is_processed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_processed ? '✅' : '⏳'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}