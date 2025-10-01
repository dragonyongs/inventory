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
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onSave}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              aria-label="저장"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="취소"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="수정"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onAdjust}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              aria-label="조정"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    );
  }
);

ItemActions.displayName = "ItemActions";
