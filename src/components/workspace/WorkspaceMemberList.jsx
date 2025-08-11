import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function WorkspaceMemberList({ workspaceId }) {
    const [members, setMembers] = useState([])
    useEffect(() => {
        const fetchMembers = async () => {
            const { data, error } = await supabase
                .from('workspace_members')
                .select('user_id, role, inventory_users: user_id (name, username, email)')
                .eq('workspace_id', workspaceId)
            if (!error) setMembers(data || [])
        }
        fetchMembers()
    }, [workspaceId])
    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">멤버 목록</h3>
            <ul className="space-y-2">
                {members.map(m => (
                    <li key={m.user_id} className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                            <div className="font-medium">{m.inventory_users?.name || m.user_id}</div>
                            <div className="text-xs text-gray-500">{m.inventory_users?.email}</div>
                            <div className="text-xs text-gray-400">역할: {m.role}</div>
                        </div>
                    </li>
                ))}
                {!members.length && <li className="text-gray-400">멤버가 없습니다.</li>}
            </ul>
        </div>
    )
}
