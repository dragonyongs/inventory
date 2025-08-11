// src/pages/NotFound.jsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
    const location = useLocation()

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
                <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
                <p className="mt-4 text-xl font-semibold text-gray-800">페이지를 찾을 수 없습니다</p>
                <p className="mt-2 text-gray-600 break-all">
                    요청하신 경로가 존재하지 않거나 이동되었어요.
                    <br />
                    <span className="text-gray-500">경로: {location.pathname}</span>
                </p>

                <div className="mt-8 flex items-center justify-center gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        홈으로 가기
                    </Link>
                    <Link
                        to="/public"
                        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        공개 카테고리 보기
                    </Link>
                </div>

                <details className="mt-6 mx-auto w-fit text-left text-sm text-gray-500 open:text-gray-600">
                    <summary className="cursor-pointer select-none">도움말</summary>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>주소창에 입력한 경로가 정확한지 확인하세요.</li>
                        <li>좌측 사이드바에서 원하는 메뉴를 다시 선택하세요.</li>
                        <li>권한이 필요한 페이지일 수 있습니다. 로그인 상태를 확인하세요.</li>
                    </ul>
                </details>
            </div>
        </div>
    )
}
