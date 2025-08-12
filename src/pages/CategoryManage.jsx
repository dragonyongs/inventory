import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Users, Share2, Trash2, Save, X, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useInventoryStore } from '../store/inventoryStore'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { supabase } from '../lib/supabase'

export default function CategoryManage() {
    const { currentWorkspace } = useWorkspaceStore()
    const { categoryId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { categories, fetchCategories } = useInventoryStore()
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [permissions, setPermissions] = useState([])
    const [showUserSearch, setShowUserSearch] = useState(false)
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])

    const { register, handleSubmit, setValue, reset } = useForm()

    useEffect(() => {
        if (user) {
            fetchCategories(user.id)
            fetchPermissions()
        }
    }, [user, categoryId])

    useEffect(() => {
        const category = categories.find(cat => cat.id === categoryId)
        if (category) {
            setSelectedCategory(category)
            setValue('name', category.name)
            setValue('is_public', category.is_public)
        }
    }, [categories, categoryId, setValue])

    const fetchPermissions = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_category_permissions')
                .select(`
                    *,
                    user:inventory_users!user_id(id, name, username)
                `)
                .eq('category_id', categoryId)

            if (!error && data) {
                setPermissions(data)
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
        }
    }

    const onSubmit = async (data) => {
        try {
            const updateData = {
                name: data.name,
                is_public: data.is_public,
                updated_at: new Date().toISOString()
            }

            // 공개 카테고리로 설정하면서 shared_token이 없으면 자동 생성
            if (data.is_public && !selectedCategory.shared_token) {
                updateData.shared_token = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15)
            }

            const { error } = await supabase
                .from('inventory_categories')
                .update(updateData)
                .eq('id', categoryId)

            if (error) throw error

            toast.success('카테고리가 업데이트되었습니다!')
            if (updateData.shared_token) {
                toast.info('공개 카테고리용 공유 링크가 자동 생성되었습니다!')
            }

            setIsEditing(false)
            fetchCategories(user.id)
        } catch (error) {
            toast.error('업데이트 중 오류가 발생했습니다.')
            console.error('Error updating category:', error)
        }
    }

    const handleDeleteCategory = async () => {
        if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까? 모든 아이템도 함께 삭제됩니다.')) {
            try {
                const { error } = await supabase
                    .from('inventory_categories')
                    .delete()
                    .eq('id', categoryId)

                if (error) throw error

                toast.success('카테고리가 삭제되었습니다.')
                navigate('/')
            } catch (error) {
                toast.error('삭제 중 오류가 발생했습니다.')
                console.error('Error deleting category:', error)
            }
        }
    }

    const searchUsers = async (searchTerm) => {
        if (searchTerm.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const { data, error } = await supabase
                .from('inventory_users')
                .select('id, name, username')
                .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
                .neq('id', user.id)
                .limit(10)

            if (!error && data) {
                setSearchResults(data)
            }
        } catch (error) {
            console.error('Error searching users:', error)
        }
    }

    const addUserPermission = async (selectedUser, permissionLevel = 'view') => {
        try {
            const { error } = await supabase
                .from('inventory_category_permissions')
                .insert([{
                    category_id: categoryId,
                    user_id: selectedUser.id,
                    permission_level: permissionLevel
                }])

            if (error) throw error

            toast.success(`${selectedUser.name}님에게 권한을 부여했습니다.`)
            fetchPermissions()
            setShowUserSearch(false)
            setUserSearch('')
            setSearchResults([])
        } catch (error) {
            if (error.code === '23505') {
                toast.error('이미 권한이 부여된 사용자입니다.')
            } else {
                toast.error('권한 부여 중 오류가 발생했습니다.')
            }
            console.error('Error adding permission:', error)
        }
    }

    const updatePermission = async (permissionId, newLevel) => {
        try {
            const { error } = await supabase
                .from('inventory_category_permissions')
                .update({ permission_level: newLevel })
                .eq('id', permissionId)

            if (error) throw error

            toast.success('권한이 업데이트되었습니다.')
            fetchPermissions()
        } catch (error) {
            toast.error('권한 업데이트 중 오류가 발생했습니다.')
        }
    }

    const removePermission = async (permissionId) => {
        if (window.confirm('이 사용자의 권한을 제거하시겠습니까?')) {
            try {
                const { error } = await supabase
                    .from('inventory_category_permissions')
                    .delete()
                    .eq('id', permissionId)

                if (error) throw error

                toast.success('권한이 제거되었습니다.')
                fetchPermissions()
            } catch (error) {
                toast.error('권한 제거 중 오류가 발생했습니다.')
            }
        }
    }

    const generateShareLink = async () => {
        if (!selectedCategory.shared_token) {
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

            try {
                const { error } = await supabase
                    .from('inventory_categories')
                    .update({
                        shared_token: token,
                        is_public: true
                    })
                    .eq('id', categoryId)

                if (error) throw error

                setSelectedCategory({ ...selectedCategory, shared_token: token, is_public: true })
            } catch (error) {
                toast.error('공유 링크 생성 중 오류가 발생했습니다.')
                return
            }
        }

        const shareUrl = `${window.location.origin}/shared/${selectedCategory.shared_token}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('공유 링크가 클립보드에 복사되었습니다!')
    }

    if (!selectedCategory) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">카테고리를 찾을 수 없습니다.</p>
                <Link to="/" className="text-blue-600 hover:text-blue-500">
                    대시보드로 돌아가기
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-4 py-6">
                    <Link
                        to={`/workspace/${currentWorkspace?.id}/category/${categoryId}`}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedCategory.name} 설정 및 권한 관리
                        </p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <Link
                        to={`/workspace/${currentWorkspace?.id}/category/${categoryId}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        재고 보기
                    </Link>
                    <button
                        onClick={generateShareLink}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        공유 링크
                    </button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 카테고리 설정 */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">기본 설정</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 text-gray-400 hover:text-gray-500"
                            >
                                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    카테고리 이름
                                </label>
                                <input
                                    {...register('name', { required: true })}
                                    type="text"
                                    disabled={!isEditing}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                                />
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        {...register('is_public')}
                                        type="checkbox"
                                        disabled={!isEditing}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        공개 카테고리 (모든 사용자가 조회 가능)
                                    </span>
                                </label>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        저장
                                    </button>
                                </div>
                            )}
                        </form>

                        {/* 위험 구역 */}
                        <div className="mt-8 pt-6 border-t border-red-200">
                            <h3 className="text-sm font-medium text-red-800 mb-2">위험 구역</h3>
                            <button
                                onClick={handleDeleteCategory}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                카테고리 삭제
                            </button>
                        </div>
                    </div>

                    {/* 사용자 권한 관리 */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">사용자 권한</h2>
                            <button
                                onClick={() => setShowUserSearch(true)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                사용자 추가
                            </button>
                        </div>

                        {/* 사용자 검색 */}
                        {showUserSearch && (
                            <div className="mb-4 p-4 border border-gray-200 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-900">사용자 검색</h3>
                                    <button
                                        onClick={() => {
                                            setShowUserSearch(false)
                                            setUserSearch('')
                                            setSearchResults([])
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value)
                                        searchUsers(e.target.value)
                                    }}
                                    placeholder="사용자 이름이나 아이디 검색"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />

                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                                onClick={() => addUserPermission(user, 'view')}
                                            >
                                                <div>
                                                    <div className="font-medium text-sm">{user.name}</div>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 권한 목록 */}
                        <div className="space-y-3">
                            {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                    <div>
                                        <div className="font-medium text-sm">{permission.user.name}</div>
                                        <div className="text-xs text-gray-500">@{permission.user.username}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={permission.permission_level}
                                            onChange={(e) => updatePermission(permission.id, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="view">조회</option>
                                            <option value="edit">편집</option>
                                            <option value="admin">관리자</option>
                                        </select>
                                        <button
                                            onClick={() => removePermission(permission.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {permissions.length === 0 && (
                                <div className="text-center py-6 text-gray-500">
                                    <Users className="mx-auto h-8 w-8 mb-2" />
                                    <p className="text-sm">공유된 사용자가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
