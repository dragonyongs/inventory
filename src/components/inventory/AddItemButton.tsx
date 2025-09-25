// src/components/inventory/AddItemButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus } from "lucide-react";

export const AddItemButton: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/inventory/new");
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="flex items-center justify-between w-full p-3 bg-white border border-blue-100 rounded-lg hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-medium text-gray-900">
              새 상품 등록
            </h3>
            <p className="text-xs text-gray-500">
              새로운 상품을 추가하여 재고를 관리하세요
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded">
          <Plus className="w-4 h-4" />
          <span className="text-sm">등록하기</span>
        </div>
      </button>
    </div>
  );
});

AddItemButton.displayName = "AddItemButton";

// src/components/inventory/AddItemButton.tsx
// import React from "react";
// import { Plus } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export const AddItemButton: React.FC = React.memo(() => {
//   const navigate = useNavigate();

//   const handleAddItem = () => {
//     navigate("/items/add");
//   };

//   return (
//     <button
//       onClick={handleAddItem}
//       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
//     >
//       <Plus className="w-5 h-5" />
//       새 품목 추가
//     </button>
//   );
// });

// AddItemButton.displayName = "AddItemButton";
