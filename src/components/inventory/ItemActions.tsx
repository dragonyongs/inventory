// src/components/inventory/ItemActions.tsx

import React from "react";
import { Edit, Trash2, Settings, CheckCircle, X } from "lucide-react";

interface ItemActionsProps {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAdjust: () => void;
  onDelete: () => void;
}

export const ItemActions: React.FC<ItemActionsProps> = React.memo(
  ({ editing, onEdit, onSave, onCancel, onAdjust, onDelete }) => {
    return (
      <td className="p-4">
        {editing ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              저장
            </button>
            <button
              onClick={onCancel}
              className="flex items-center px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="flex items-center px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs transition-colors min-w-14"
              title="수정"
            >
              <Edit className="w-3 h-3 mr-1" />
              수정
            </button>
            <button
              onClick={onAdjust}
              className="flex items-center px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs transition-colors min-w-14"
              title="조정"
            >
              <Settings className="w-3 h-3 mr-1" />
              조정
            </button>
            <button
              onClick={onDelete}
              className="flex items-center px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors min-w-14"
              title="삭제"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              삭제
            </button>
          </div>
        )}
      </td>
    );
  }
);

ItemActions.displayName = "ItemActions";
