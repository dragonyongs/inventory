// src/pages/WorkspaceEmptyState.jsx
export default function WorkspaceEmptyState() {
    return (
        <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4">
                <h2 className="text-xl font-semibold">선택된 워크스페이스가 없습니다</h2>
                <p className="text-gray-600">
                    왼쪽 상단의 워크스페이스 선택기에서 워크스페이스를 선택하거나 새 워크스페이스를 생성하세요.
                </p>
            </div>
        </div>
    )
}
