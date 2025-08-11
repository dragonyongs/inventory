import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useInventoryStore } from '../store/inventoryStore'
import { useAuthStore } from '../store/authStore'
import CategoryStats from '../components/CategoryStats'
import ItemModal from '../components/ItemModal'
import ItemTable from '../components/ItemTable'
import PageHeader from '../components/PageHeader'
import ItemUseModal from '../components/ItemUseModal'
import { useWorkspaceStore } from '../store/workspaceStore'
import { supabase } from '../lib/supabase'

export default function CategoryView() {
    const { categoryId } = useParams()
    const { user } = useAuthStore()
    const {
        items,
        categories,
        selectedCategory,
        loading,
        fetchItems,
        fetchCategories,
        deleteItem,
        setSelectedCategory
    } = useInventoryStore()
    const { currentWorkspace } = useWorkspaceStore()
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [userPermission, setUserPermission] = useState('view') // 기본: 공개 조회only
    const [useModalOpen, setUseModalOpen] = useState(false)
    const [useTargetItem, setUseTargetItem] = useState(null)

    // 권한/상태 유틸
    const myUserId = user?.id
    const isOwner = selectedCategory?.owner_id === myUserId
    const isShared = !!selectedCategory?.is_shared
    const isPublicOnly = selectedCategory?.is_public && !isOwner && !isShared

    // 권한 등급 분기
    const canManage = isOwner || userPermission === 'admin'
    const canEdit = isOwner || userPermission === 'admin' || userPermission === 'edit'
    const canAddItem = canEdit
    const canDeleteItem = canManage
    const canUseItem = isOwner ||
        userPermission === 'admin' ||
        userPermission === 'edit' ||
        (selectedCategory?.is_public && selectedCategory?.is_public_usable)

    // 권한 level 결정
    useEffect(() => {
        if (!selectedCategory) return
        if (user?.is_admin) setUserPermission('admin')
        else if (selectedCategory.owner_id === myUserId) setUserPermission('admin')
        else if (selectedCategory.is_shared) setUserPermission(selectedCategory.permission_level)
        else if (selectedCategory.is_public) setUserPermission('view')
        else setUserPermission('view')
    }, [selectedCategory, myUserId, user])

    // fetch data
    useEffect(() => {
        if (user && categoryId) {
            fetchCategories(user.id)
            fetchItems(categoryId)
        }
    }, [user, categoryId, fetchCategories, fetchItems])

    // selectedCategory set (store → 공개 fallback)
    useEffect(() => {
        let found = categories.find(cat => cat.id === categoryId)
        if (found) { setSelectedCategory(found); return }
        // fallback: 공개 카테고리 직접 조회
        (async () => {
            const { data, error } = await supabase
                .from('inventory_categories')
                .select(`
                    *,
                    manager:inventory_users!manager_id(name),
                    items:inventory_items(count),
                    owner:inventory_users!owner_id(name)
                `)
                .eq('id', categoryId)
                .eq('is_public', true)
                .single()
            if (error || !data) setSelectedCategory(null)
            else setSelectedCategory({ ...data, is_shared: false, permission_level: 'view' })
        })()
    }, [categories, categoryId, setSelectedCategory])

    // 아이템 조작
    const handleDeleteItem = async (itemId) => {
        if (!canDeleteItem) return
        if (window.confirm('정말로 이 아이템을 삭제하시겠습니까?')) {
            const result = await deleteItem(itemId)
            if (result.success) toast.success('아이템이 삭제되었습니다.')
            else toast.error('삭제 중 오류가 발생했습니다.')
        }
    }
    const handleEditItem = (item) => { if (canEdit) { setEditingItem(item); setIsItemModalOpen(true) } }
    const handleAddItem = () => { if (canAddItem) { setEditingItem(null); setIsItemModalOpen(true) } }

    // 아이템 차감 버튼 클릭 시
    const handleUseItemClick = (item) => {
        setUseTargetItem(item)
        setUseModalOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
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
            <PageHeader
                icon={
                    <Link to={`/workspace/${currentWorkspace?.id}/dashboard`} className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                }
                title={selectedCategory.name}
                description={
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>총 {items.length}개 아이템</span>
                        {selectedCategory.is_shared && <span>• 소유자: {selectedCategory.owner?.name}</span>}
                        {selectedCategory.manager && !selectedCategory.is_shared && <span>• 담당자: {selectedCategory.manager.name}</span>}
                        {isPublicOnly && <span>• 공개 조회 전용</span>}
                    </div>
                }
                rightSection={canAddItem && (
                    <button onClick={handleAddItem} className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> 아이템 추가
                    </button>
                )}
            >
                {/* 권한 배지 */}
                <div className="flex flex-wrap items-center gap-2">
                    {selectedCategory.is_shared && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            공유받음 ({userPermission === 'view' ? '조회' : userPermission === 'edit' ? '편집' : '관리자'})
                        </span>
                    )}
                    {isOwner && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            소유
                        </span>
                    )}
                    {selectedCategory.is_public && !isOwner && !selectedCategory.is_shared && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            공개
                        </span>
                    )}
                </div>
            </PageHeader>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
                <CategoryStats items={items} type="category" />
                <ItemTable
                    items={items}
                    userPermission={userPermission}
                    onEdit={canEdit ? handleEditItem : undefined}
                    onDelete={canDeleteItem ? handleDeleteItem : undefined}
                    onAdd={canAddItem ? handleAddItem : undefined}
                    onUse={canUseItem ? handleUseItemClick : undefined}
                />
            </div>
            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => {
                    setIsItemModalOpen(false)
                    setEditingItem(null)
                }}
                categoryId={categoryId}
                editingItem={editingItem}
            />

            {/* 차감 모달 연결 */}
            <ItemUseModal
                isOpen={useModalOpen}
                onClose={() => setUseModalOpen(false)}
                item={useTargetItem}
                categoryId={categoryId}
            />
        </div>
    )
}
