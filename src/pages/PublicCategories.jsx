import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Package, Folder, Search, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PublicCategories() {
    const [publicCategories, setPublicCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchPublicCategories()
    }, [])

    const fetchPublicCategories = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('inventory_categories')
                .select(`
          *,
          owner:inventory_users!owner_id(name, username),
          items:inventory_items(count)
        `)
                .eq('is_public', true)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setPublicCategories(data)
            }
        } catch (error) {
            console.error('Error fetching public categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCategories = publicCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center">
                            <Globe className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">공개 카테고리</h1>
                                <p className="text-sm text-gray-500">
                                    다른 사용자들이 공개한 재고 카테고리를 둘러보세요
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="카테고리 이름이나 소유자로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Folder className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        총 {filteredCategories.length}개의 공개 카테고리
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        커뮤니티에서 공유된 재고 관리 카테고리들입니다
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Globe className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {searchTerm ? '검색 결과가 없습니다' : '공개된 카테고리가 없습니다'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm
                                ? '다른 검색어를 사용해보세요.'
                                : '첫 번째로 카테고리를 공개해보세요!'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Folder className="h-8 w-8 text-blue-500" />
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {category.name}
                                                </h3>
                                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                                    <User className="h-4 w-4 mr-1" />
                                                    {category.owner?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">아이템 수</span>
                                            <span className="font-medium">
                                                {category.items?.[0]?.count || 0}개
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        {category.shared_token ? (
                                            <Link
                                                to={`/shared/${category.shared_token}`}
                                                className="w-full bg-blue-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-blue-700 hover:bg-blue-100"
                                            >
                                                둘러보기
                                            </Link>
                                        ) : (
                                            <div className="w-full bg-gray-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-500">
                                                공유 링크 없음
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
