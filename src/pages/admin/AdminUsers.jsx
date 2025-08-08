import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import SearchInput from '../../components/SearchInput'

import { Users, Search, Trash2, Shield, ShieldOff, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('inventory_users')
                .select(`
          *,
            owned_categories:inventory_categories!owner_id(count),
            shared_categories:inventory_category_permissions(count)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('사용자 목록을 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const toggleAdminStatus = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('inventory_users')
                .update({ is_admin: !currentStatus })
                .eq('id', userId)

            if (error) throw error

            toast.success(`관리자 권한이 ${!currentStatus ? '부여' : '제거'}되었습니다.`)
            fetchUsers()
        } catch (error) {
            console.error('Error updating admin status:', error)
            toast.error('관리자 권한 변경 중 오류가 발생했습니다.')
        }
    }

    const deleteUser = async (userId) => {
        if (window.confirm('정말로 이 사용자를 삭제하시겠습니까? 모든 관련 데이터가 삭제됩니다.')) {
            try {
                const { error } = await supabase
                    .from('inventory_users')
                    .delete()
                    .eq('id', userId)

                if (error) throw error

                toast.success('사용자가 삭제되었습니다.')
                fetchUsers()
            } catch (error) {
                console.error('Error deleting user:', error)
                toast.error('사용자 삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <PageHeader
                title="사용자 관리"
                description={`전체 ${filteredUsers.length}명의 사용자`}
                // icon={<PieChart className="h-6 w-6 text-blue-500" />}
                rightSection={(
                    <button
                        onClick={fetchUsers}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        새로고침
                    </button>
                )}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 검색 */}
                <SearchInput
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="사용자 이름이나 아이디로 검색..."
                    variant="red"
                />

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatCard
                        icon={<Users className="h-8 w-8 text-blue-600" />}
                        label="총 사용자"
                        value={users.length}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<Shield className="h-8 w-8 text-red-600" />}
                        label="관리자"
                        value={users.filter(user => user.is_admin).length}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<Eye className="h-8 w-8 text-green-600" />}
                        label="일반 사용자"
                        value={users.filter(user => !user.is_admin).length}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                </div>

                {/* 사용자 테이블 */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            사용자
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            권한
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            소유 카테고리
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            공유받은 카테고리
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            가입일
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            작업
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full ${user.is_admin ? 'bg-red-600' : 'bg-blue-600'} flex items-center justify-center`}>
                                                        <span className="text-sm font-medium text-white">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.is_admin ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        관리자
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        일반 사용자
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.owned_categories?.[0]?.count || 0}개
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.shared_categories?.[0]?.count || 0}개
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                                                        className={`p-2 rounded-md ${user.is_admin ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                        title={user.is_admin ? '관리자 권한 제거' : '관리자 권한 부여'}
                                                    >
                                                        {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        className="p-2 rounded-md text-red-600 hover:text-red-900"
                                                        title="사용자 삭제"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm ? '검색 결과가 없습니다' : '사용자가 없습니다'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? '다른 검색어를 사용해보세요.' : '아직 가입한 사용자가 없습니다.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
