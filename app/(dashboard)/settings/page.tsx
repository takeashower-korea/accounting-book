'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const roles = ['admin', 'staff', 'viewer']
const roleLabels: Record<string, string> = {
  admin: '관리자',
  staff: '직원',
  viewer: '조회전용',
}
const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-600',
  staff: 'bg-blue-100 text-blue-600',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  useEffect(() => {
    fetchProfiles()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setCurrentProfile(data)
    }
  }

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    setProfiles(data || [])
  }

  const handleInvite = async () => {
    if (!inviteEmail || !invitePassword || !inviteName) {
      setError('이름, 이메일, 비밀번호를 모두 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: invitePassword,
    })

    if (error) {
      setError('등록 실패: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: inviteName,
        role: inviteRole,
        is_active: true,
      })
    }

    setSuccess(`✅ ${inviteName} 님이 등록되었습니다!`)
    setInviteEmail('')
    setInvitePassword('')
    setInviteName('')
    setInviteRole('staff')
    fetchProfiles()
    setLoading(false)
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    fetchProfiles()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    if (id === currentUser?.id) {
      alert('본인 계정은 비활성화할 수 없습니다.')
      return
    }
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    fetchProfiles()
  }

  if (currentProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-gray-600 font-medium">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">설정</h1>

      {/* 직원 등록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">➕ 새 직원 등록</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이름 *</label>
            <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
              placeholder="직원 이름 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이메일 *</label>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="이메일 입력"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호 *</label>
            <input type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="초기 비밀번호 설정"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">권한</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              {roles.map(r => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        {success && <p className="mt-4 text-green-600 text-sm">{success}</p>}

        <button onClick={handleInvite} disabled={loading}
          className="mt-6 w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50">
          {loading ? '등록 중...' : '직원 등록'}
        </button>
      </div>

      {/* 직원 목록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">👥 직원 목록</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">이름</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">권한</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">권한 변경</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">상태</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">활성화</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    등록된 직원이 없습니다.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">
                      {profile.name}
                      {profile.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-gray-400">(나)</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[profile.role]}`}>
                        {roleLabels[profile.role] || profile.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                        disabled={profile.id === currentUser?.id}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-400">
                        {roles.map(r => (
                          <option key={r} value={r}>{roleLabels[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile.is_active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {profile.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleToggleActive(profile.id, profile.is_active)}
                        disabled={profile.id === currentUser?.id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-30 ${
                          profile.is_active
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}>
                        {profile.is_active ? '비활성화' : '활성화'}
                      </button>
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