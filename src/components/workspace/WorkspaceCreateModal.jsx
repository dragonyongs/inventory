// src/components/workspace/WorkspaceCreateModal.jsx
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useNavigate } from 'react-router-dom'

export default function WorkspaceCreateModal({ onClose }) {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { createWorkspace, setCurrentWorkspace } = useWorkspaceStore()
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)

    const onCreate = async () => {
        if (!name.trim() || !user?.id) return
        try {
            setSaving(true)
            const ws = await createWorkspace(name.trim(), user.id)
            setCurrentWorkspace(ws)
            navigate(`/workspace/${ws.id}/dashboard`, { replace: true })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const content = (
        <div className="fixed inset-0 z-[10000]">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md p-4">
                <h3 className="text-lg font-semibold mb-2">새 워크스페이스 만들기</h3>
                <p className="text-sm text-gray-500 mb-3">회사, 집 등 최상위 공간을 만들어보세요.</p>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="워크스페이스 이름"
                    className="w-full border rounded-md px-3 py-2 mb-4"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded hover:bg-gray-50">취소</button>
                    <button
                        onClick={onCreate}
                        disabled={saving || !name.trim()}
                        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        생성
                    </button>
                </div>
            </div>
        </div>
    )
    return createPortal(content, document.body)
}
