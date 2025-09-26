import { Package } from "lucide-react";
import { type Item } from "@/stores/itemsStore";
import { ItemRow } from "./ItemRow";
import { MobileItemCard } from "./MobileItemCard";

interface InventoryTableProps {
  items: Item[];
  onEdit: (id: string, patch: Partial<Item>) => void;
  onDelete: (id: string) => void;
  onAdjust: (id: string) => void;
}

export default function InventoryTable({
  items,
  onEdit,
  onDelete,
  onAdjust,
}: InventoryTableProps) {
  return (
    <div className="min-h-screen">
      {/* 헤더 - 모던한 미니멀 디자인 */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">품목 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                총 {items.length}개 품목
              </p>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <>
          {/* 데스크탑 테이블 뷰 */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto bg-white mx-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      상품 정보
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      재고량
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      입고일
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      유통기한
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      상태
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700 text-nowrap">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={(patch) => onEdit(item.id, patch)}
                      onDelete={() => onDelete(item.id)}
                      onAdjust={() => onAdjust(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 태블릿 수평 스크롤 테이블 */}
          <div className="hidden md:block lg:hidden mx-4 mt-6">
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      상품 정보
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      재고량
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      입고일
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      유통기한
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      상태
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={(patch) => onEdit(item.id, patch)}
                      onDelete={() => onDelete(item.id)}
                      onAdjust={() => onAdjust(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 모바일 카드 뷰 - 깔끔한 리스트 */}
          <div className="md:hidden px-4 py-6 space-y-3">
            {items.map((item) => (
              <MobileItemCard
                key={item.id}
                item={item}
                onEdit={(patch) => onEdit(item.id, patch)}
                onDelete={() => onDelete(item.id)}
                onAdjust={() => onAdjust(item.id)}
              />
            ))}
          </div>
        </>
      ) : (
        /* 빈 상태 - 모던한 디자인 */
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            등록된 품목이 없습니다
          </h3>
          <p className="text-gray-600 text-center max-w-sm mb-6">
            새 품목을 추가하여 재고 관리를 시작해보세요.
          </p>
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-blue-700 text-sm font-medium">
              💡 체계적인 재고 관리로 효율성을 높여보세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
