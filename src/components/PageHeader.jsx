// src/components/PageHeader.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ icon, title, description, rightSection = null, children }) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-h-[60px] py-6">
            <div className="flex items-center space-x-4">
                {icon && <>{icon}</>}
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        {children}
                    </div>
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
            </div>
            {rightSection && <div>{rightSection}</div>}
        </div>
    )
}
