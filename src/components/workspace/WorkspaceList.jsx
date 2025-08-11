// src/components/workspace/WorkspaceList.jsx
import React, { useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function WorkspaceList() {
    const { user } = useAuthStore()
    const { workspaces, loadWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user?.id) return
        loadWorkspaces(user.id)
    }, [user?.id])

    const onSelect = (ws) => {
        setCurrentWorkspace(ws)
        navigate(`/workspace/${ws.id}/dashboard`)
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">워크스페이스 선택</h2>
            <div className="grid gap-3">
                {workspaces.map(ws => (
                    <button
                        key={ws.id}
                        onClick={() => onSelect(ws)}
                        className="p-4 border rounded-lg text-left hover:bg-gray-50"
                    >
                        <div className="font-semibold">{ws.name}</div>
                        <div className="text-xs text-gray-500 mt-1">역할: {ws.role}</div>
                    </button>
                ))}
            </div>
            {!workspaces.length && (
                <p className="text-gray-500 mt-6">
                    아직 워크스페이스가 없습니다. 새 워크스페이스를 만들어 시작하세요.
                </p>
            )}
        </div>
    )
}
