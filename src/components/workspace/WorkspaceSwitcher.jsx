// src/components/workspace/WorkspaceSwitcher.jsx
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, MoreHorizontal, Plus, Users, Pencil, Trash2, Mail, Check } from 'lucide-react'
import WorkspaceCreateModal from './WorkspaceCreateModal'
import WorkspaceRenameModal from './WorkspaceRenameModal'
import WorkspaceMemberSheet from './WorkspaceMemberSheet'

export default function WorkspaceSwitcher() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const {
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
    } = useWorkspaceStore()

    const [open, setOpen] = useState(false)
    const [menuOpenId, setMenuOpenId] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [renameTarget, setRenameTarget] = useState(null)
    const [memberTarget, setMemberTarget] = useState(null)

    const btnRef = useRef(null)
    const [pos, setPos] = useState({ top: 0, left: 0, width: 320 })

    useEffect(() => {
        if (!user?.id) return
        useWorkspaceStore.getState().loadWorkspaces(user.id)
    }, [user?.id])


    useEffect(() => {
        if (memberTarget) {
            // 확인용 로그
            console.log('memberTarget set:', memberTarget)
        }
    }, [memberTarget])

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
            if (!layer) return
            if (btnRef.current?.contains(e.target)) return
            if (!layer.contains(e.target)) setOpen(false)
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
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 10000 }}
            className="rounded-xl border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] bg-white"
            onClick={(e) => {
                // 레이어 누적 버블링 방지 기본 가드
                e.stopPropagation()
            }}
        >
            <div className="px-3 py-2 border-b bg-gray-50">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                </div>
            </div>

            <div className="max-h-96">
                {(workspaces || []).map(ws => {
                    const active = ws.id === currentWorkspace?.id
                    return (
                        <div
                            key={ws.id}
                            className={`group flex items-center justify-between px-3 py-2 ${active ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                            // 행 전체 클릭 시에만 워크스페이스 선택
                            onClick={() => onPick(ws)}
                            role="button"
                        >
                            <div className="text-left min-w-0">
                                <div className={`truncate ${active ? 'font-semibold' : ''}`}>{ws.name}</div>
                                <div className="text-xs text-gray-500">역할: {ws.role}</div>
                            </div>

                            <div className="flex items-center gap-1">
                                {active && <Check className="w-4 h-4 text-blue-600" />}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation() // 부모 클릭 막기
                                            setMenuOpenId(p => (p === ws.id ? null : ws.id))
                                        }}
                                        className="p-2 rounded hover:bg-gray-100"
                                        aria-label="workspace menu"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {menuOpenId === ws.id && (
                                        <div
                                            className="absolute right-0 top-8 w-44 bg-white border rounded-md shadow-lg z-50"
                                            onClick={(e) => e.stopPropagation()} // 메뉴 내부 클릭 버블링 막기
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
                                                    console.log("ws", ws)
                                                    setMemberTarget(ws)
                                                    setMenuOpenId(null)
                                                    // setOpen(false) // 필요 시 드롭다운 닫기
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
            <button
                ref={btnRef}
                onClick={() => setOpen(v => !v)}
                className="flex justify-center items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="font-medium truncate max-w-[180px]">
                    {currentWorkspace?.name || '워크스페이스 선택'}
                </span>
                <ChevronsUpDown className="w-4 h-4 opacity-60" />
            </button>

            {open && createPortal(layer, document.body)}

            {/* 포털 모달/시트 */}
            {showCreate && <WorkspaceCreateModal onClose={() => setShowCreate(false)} />}
            {renameTarget && <WorkspaceRenameModal ws={renameTarget} onClose={() => setRenameTarget(null)} />}
            {memberTarget && <WorkspaceMemberSheet ws={memberTarget} onClose={() => setMemberTarget(null)} />}
        </>
    )
}
