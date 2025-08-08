// src/components/SearchInput.jsx
import React from 'react'
import { Search } from 'lucide-react'

// variant: 테마나 강조색을 다르게, filterComponent: 외부에서 넘기는 필터(셀렉트박스 등)
export default function SearchInput({
    value,
    onChange,
    placeholder = "검색...",
    variant = "blue",
    filterComponent,
    className
}) {
    const ringColor =
        variant === "red"
            ? "focus:ring-red-500 focus:border-red-500"
            : "focus:ring-blue-500 focus:border-blue-500"

    return (
        <div className={`flex flex-col sm:flex-row gap-4 ${className || ""}`}>
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 ${ringColor}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            </div>
            {filterComponent && (
                <div className="flex items-center space-x-2">{filterComponent}</div>
            )}
        </div>
    )
}
