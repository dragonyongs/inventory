// src/components/workspace/WorkspaceSwitcher.jsx
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
    ChevronsUpDown,
    MoreHorizontal,
    Plus,
    Users,
    Pencil,
    Trash2,
    Mail,
    Check,
} from 'lucide-react'
import WorkspaceCreateModal from './WorkspaceCreateModal'
import WorkspaceRenameModal from './WorkspaceRenameModal'
import WorkspaceMemberSheet from './WorkspaceMemberSheet'
import { Package } from 'lucide-react'

export default function WorkspaceSwitcher() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

    const [open, setOpen] = useState(false)
    const [menuOpenId, setMenuOpenId] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [renameTarget, setRenameTarget] = useState(null)
    const [memberTarget, setMemberTarget] = useState(null)

    const btnRef = useRef(null)
    const [pos, setPos] = useState({ top: 0, left: 0, width: 320 })

    // 최초 목록 로드
    useEffect(() => {
        if (!user?.id) return
        useWorkspaceStore.getState().loadWorkspaces(user.id)
    }, [user?.id])

    // 외부 클릭/리사이즈
    useEffect(() => {
        if (!open) return
        const measure = () => {
            const r = btnRef.current?.getBoundingClientRect()
            if (!r) return
            const width = 320
            const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
            setPos({ top: r.bottom + 8, left, width })
        }
        const onDocClick = (e) => {
            const layer = document.getElementById('ws-layer')
            const sheet = document.getElementById('ws-member-sheet')
            if (btnRef.current?.contains(e.target)) return
            if (sheet?.contains(e.target)) return // 멤버 시트 클릭 예외
            if (!layer?.contains(e.target)) setOpen(false)
        }
        measure()
        window.addEventListener('resize', measure)
        document.addEventListener('mousedown', onDocClick)
        return () => {
            window.removeEventListener('resize', measure)
            document.removeEventListener('mousedown', onDocClick)
        }
    }, [open])

    const onPick = (ws) => {
        setCurrentWorkspace(ws)
        setOpen(false)
        setMenuOpenId(null)
        navigate(`/workspace/${ws.id}/dashboard`, { replace: true })
    }

    const layer = (
        <div
            id="ws-layer"
            style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 10000,
            }}
            className="rounded-xl border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] bg-white"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 상단 이메일 */}
            <div className="px-3 py-2 border-b bg-gray-50">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                </div>
            </div>

            {/* 리스트 */}
            <div className="max-h-96 overflow-y-auto">
                {(workspaces || []).map((ws) => {
                    const active = ws.id === currentWorkspace?.id
                    return (
                        <div
                            key={ws.id}
                            className={`group flex items-center justify-between px-3 py-2 ${active ? 'bg-gray-50' : 'hover:bg-gray-50'
                                }`}
                            onClick={() => onPick(ws)}
                            role="button"
                        >
                            <div className="text-left min-w-0">
                                <div className={`truncate ${active ? 'font-semibold' : ''}`}>
                                    {ws.name}
                                </div>
                                <div className="text-xs text-gray-500">역할: {ws.role}</div>
                            </div>

                            <div className="flex items-center gap-1">
                                {active && <Check className="w-4 h-4 text-blue-600" />}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuOpenId((p) => (p === ws.id ? null : ws.id))
                                        }}
                                        className="p-2 rounded hover:bg-gray-100"
                                        aria-label="workspace menu"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {menuOpenId === ws.id && (
                                        <div
                                            className="absolute right-0 top-8 w-44 bg-white border rounded-md shadow-lg z-50"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setRenameTarget(ws)
                                                    setMenuOpenId(null)
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" /> 이름 변경
                                            </button>
                                            <button
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMemberTarget(ws)
                                                    setMenuOpenId(null)
                                                    // setOpen(false) // 필요 시 닫기
                                                }}
                                            >
                                                <Users className="w-4 h-4" /> 멤버 관리
                                            </button>
                                            <button
                                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setRenameTarget({ ...ws, __delete__: true })
                                                    setMenuOpenId(null)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" /> 삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {!workspaces?.length && (
                    <div className="px-3 py-3 text-sm text-gray-500">워크스페이스가 없습니다.</div>
                )}
            </div>

            {/* 하단 CTA */}
            <div className="border-t p-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowCreate(true)
                        setOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> 새 워크스페이스 만들기
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* 트리거 버튼: 라벨 + 체브론 */}
            <div className="relative flex items-center min-w-0">
                <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <button
                    ref={btnRef}
                    onClick={() => setOpen((v) => !v)}
                    className="flex justify-center items-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-gray-50"
                    aria-haspopup="menu"
                    aria-expanded={open}
                >
                    <span className="font-medium truncate max-w-[180px]">
                        {currentWorkspace?.name || '워크스페이스 선택'}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 opacity-60" />
                </button>
            </div>
            {open && createPortal(layer, document.body)}

            {/* 모달/시트 포털 */}
            {showCreate && <WorkspaceCreateModal onClose={() => setShowCreate(false)} />}
            {renameTarget && (
                <WorkspaceRenameModal ws={renameTarget} onClose={() => setRenameTarget(null)} />
            )}
            {memberTarget &&
                createPortal(
                    <div id="ws-member-sheet">
                        <WorkspaceMemberSheet workspace={memberTarget} onClose={() => setMemberTarget(null)} />
                    </div>,
                    document.body
                )}
        </>
    )
}
