import React from 'react'
import { Link } from 'react-router-dom'

export default function StatCard({ icon, label, value, valueClassName, link, linkText, alertText }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 h-full flex flex-col justify-between">
                <div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">{icon}</div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                                <dd className={`font-bold ${valueClassName ? valueClassName : "text-lg text-gray-900"}`}>{value}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                {(link && linkText) && (
                    <div className="mt-4">
                        <Link
                            to={link}
                            className="text-sm font-medium"
                            style={{ color: "#2563eb" }} // 혹은 className="text-blue-600 hover:..."
                        >
                            {linkText}
                        </Link>
                    </div>
                )}
                {alertText && (
                    <div className="mt-4">
                        <span className="text-sm text-red-600 font-medium">{alertText}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
