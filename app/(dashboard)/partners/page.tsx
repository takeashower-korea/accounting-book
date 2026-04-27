'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const partnerTypes = ['매출처', '매입처', '둘 다']

export default function PartnersPage() {
  const [form, setForm] = useState({
    name: '', type: '', business_number: '',
    contact_name: '', phone: '', email: '', memo: '',
  })
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.log('거래처 조회 에러:', error)
    setList(data || [])
  }

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.name) {
      alert('거래처명은 필수입니다.')
      return
    }
    setLoading(true)

    if (editId) {
      await supabase.from('partners').update(form).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('partners').insert([form])
    }

    setSuccess(true)
    setForm({ name: '', type: '', business_number: '', contact_name: '', phone: '', email: '', memo: '' })
    fetchList()
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const handleEdit = (item: any) => {
    setForm({
      name: item.name, type: item.type || '',
      business_number: item.business_number || '',
      contact_name: item.contact_name || '',
      phone: item.phone || '', email: item.email || '',
      memo: item.memo || '',
    })
    setEditId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('partners').delete().eq('id', id)
    fetchList()
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm({ name: '', type: '', business_number: '', contact_name: '', phone: '', email: '', memo: '' })
  }

  const filtered = list.filter(p => {
    const matchSearch = !search ||
      p.name?.includes(search) ||
      p.contact_name?.includes(search) ||
      p.phone?.includes(search)
    const matchType = !filterType || p.type === filterType
    return matchSearch && matchType
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">거래처 관리</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editId ? '✏️ 거래처 수정' : '새 거래처 등록'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">거래처명 *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="거래처명 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">구분</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">선택</option>
              {partnerTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">사업자등록번호</label>
            <input type="text" name="business_number" value={form.business_number} onChange={handleChange}
              placeholder="000-00-00000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">담당자명</label>
            <input type="text" name="contact_name" value={form.contact_name} onChange={handleChange}
              placeholder="담당자명 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange}
              placeholder="010-0000-0000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="이메일 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
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
            {loading ? '저장 중...' : editId ? '✏️ 수정 완료' : '거래처 저장'}
          </button>
          {editId && (
            <button onClick={handleCancelEdit}
              className="px-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition">
              취소
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">전체 거래처</p>
          <p className="text-2xl font-bold text-gray-800">{list.length}개</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">매출처</p>
          <p className="text-2xl font-bold text-blue-600">
            {list.filter(p => p.type === '매출처' || p.type === '둘 다').length}개
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">매입처</p>
          <p className="text-2xl font-bold text-orange-600">
            {list.filter(p => p.type === '매입처' || p.type === '둘 다').length}개
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-700">거래처 목록</h2>
          <div className="flex gap-2">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option value="">전체</option>
              {partnerTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="거래처명/담당자/연락처 검색"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">거래처명</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">구분</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">사업자번호</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">담당자</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">연락처</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">이메일</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    등록된 거래처가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${editId === item.id ? 'bg-yellow-50' : ''}`}>
                    <td className="py-3 px-2 font-medium">{item.name}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.type === '매출처' ? 'bg-blue-100 text-blue-600' :
                        item.type === '매입처' ? 'bg-orange-100 text-orange-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {item.type || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-2">{item.business_number || '-'}</td>
                    <td className="py-3 px-2">{item.contact_name || '-'}</td>
                    <td className="py-3 px-2">{item.phone || '-'}</td>
                    <td className="py-3 px-2">{item.email || '-'}</td>
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
