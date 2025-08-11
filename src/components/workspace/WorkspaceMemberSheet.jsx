// src/components/workspace/WorkspaceMemberSheet.jsx
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function WorkspaceMemberSheet({ workspace, onClose }) {
    const { loadMembers, members, updateMemberRole, removeMember } = useWorkspaceStore()
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('member')

    useEffect(() => {
        if (workspace?.id) loadMembers(workspace.id)
    }, [workspace?.id, loadMembers])
    const content = (
        <div id="ws-member-sheet" className="fixed inset-0 z-[11000]"> {/* z-index 크게 */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">멤버 관리 — {workspace?.name}</h3>
                    <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-50">닫기</button>
                </div>

                {/* 이하 기존 코드 동일 */}
                <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">멤버 초대</div>
                    <div className="flex gap-2">
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="초대할 사용자 이메일"
                            className="flex-1 border rounded-md px-3 py-2"
                        />
                        <select value={role} onChange={e => setRole(e.target.value)} className="border rounded-md px-2">
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                            <option value="viewer">viewer</option>
                        </select>
                        <button
                            onClick={() => { }}
                            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            초대
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">초대는 서버에서 이메일→사용자 매핑이 필요합니다.</p>
                </div>

                <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">멤버 목록</div>
                    <div className="space-y-2">
                        {(Array.isArray(members) ? members : []).map(m => (
                            <div key={m.user_id} className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <div className="font-medium">{m.name || m.username}</div>
                                    <div className="text-xs text-gray-500">{m.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={m.role}
                                        onChange={e => updateMemberRole(workspace.id, m.user_id, e.target.value)}
                                        className="border rounded-md px-2"
                                    >
                                        <option value="owner">owner</option>
                                        <option value="admin">admin</option>
                                        <option value="member">member</option>
                                        <option value="viewer">viewer</option>
                                    </select>
                                    <button
                                        onClick={() => removeMember(workspace.id, m.user_id)}
                                        className="px-2 py-1 rounded border hover:bg-gray-50"
                                    >
                                        제거
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!members?.length && <div className="text-sm text-gray-500">멤버가 없습니다.</div>}
                    </div>
                </div>
            </div>
        </div>
    )
    return createPortal(content, document.body)
}
