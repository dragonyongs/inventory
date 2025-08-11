import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useNavigate } from 'react-router-dom'

export default function WorkspaceRenameModal({ ws, onClose }) {
    const navigate = useNavigate()
    const { updateWorkspaceName, deleteWorkspace, currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()
    const [name, setName] = useState(ws.__delete__ ? ws.name : ws.name || '')
    const [saving, setSaving] = useState(false)

    const onSave = async () => {
        setSaving(true)
        try {
            if (ws.__delete__) {
                await deleteWorkspace(ws.id)
                // 삭제 후 다른 워크스페이스로 전환
                const left = useWorkspaceStore.getState().workspaces[0]
                if (left?.id) {
                    setCurrentWorkspace(left)
                    navigate(`/workspace/${left.id}/dashboard`, { replace: true })
                }
                onClose()
                return
            }
            const res = await updateWorkspaceName(ws.id, name.trim())
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const content = (
        <div className="fixed inset-0 z-[10000] bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
                <h3 className="text-lg font-semibold mb-2">
                    {ws.__delete__ ? '워크스페이스 삭제' : '워크스페이스 이름 변경'}
                </h3>
                {ws.__delete__ ? (
                    <p className="text-sm text-gray-600 mb-4">
                        “{ws.name}” 워크스페이스를 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-3">최상위 공간의 이름을 바꿉니다.</p>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="워크스페이스 이름"
                            className="w-full border rounded-md px-3 py-2 mb-4"
                        />
                    </>
                )}

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded hover:bg-gray-50">취소</button>
                    <button
                        onClick={onSave}
                        disabled={saving || (!ws.__delete__ && !name.trim())}
                        className={`px-3 py-2 rounded ${ws.__delete__ ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white disabled:opacity-60`}
                    >
                        {ws.__delete__ ? '삭제' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body)
}
