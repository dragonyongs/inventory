// src/utils/workspaceLabels.ts

import type { WorkspaceType } from "../stores/workspaceStore";

export interface ActionLabels {
  IN: string;
  OUT: string;
  USE: string;
  ADJUST: string;
  TRANSFER?: string;
}

export const getActionLabels = (workspaceType: WorkspaceType): ActionLabels => {
  switch (workspaceType) {
    case "EVENT": // 뮤지컬 행사장
      return {
        IN: "📦 입고 (업체→본사)",
        OUT: "🚚 출고 (본사→행사장)",
        USE: "💰 판매",
        ADJUST: "📋 재고조정",
        TRANSFER: "🎁 증정",
      };

    case "OFFICE": // 본사 사무실
      return {
        IN: "📦 입고",
        OUT: "📤 출고 (다른부서/외부)",
        USE: "✋ 사용 (현장소모)",
        ADJUST: "📋 재고조정",
      };

    case "WAREHOUSE": // 창고
      return {
        IN: "📥 입고",
        OUT: "📤 출고",
        USE: "🔧 사용/소모",
        ADJUST: "📋 재고조정",
        TRANSFER: "🔄 이동",
      };

    case "RETAIL": // 매장
      return {
        IN: "📦 입고",
        OUT: "🛒 판매",
        USE: "🔧 사용/소모",
        ADJUST: "📋 재고조정",
      };

    default:
      return {
        IN: "📥 입고",
        OUT: "📤 출고",
        USE: "✋ 사용",
        ADJUST: "📋 조정",
      };
  }
};

export const getActionDescription = (
  workspaceType: WorkspaceType,
  actionType: string
): string => {
  const descriptions: Record<WorkspaceType, Record<string, string>> = {
    EVENT: {
      IN: "본사에서 행사장으로 물품이 들어왔습니다",
      OUT: "행사장에서 다른 곳으로 물품을 보냈습니다",
      USE: "고객에게 판매했습니다",
      TRANSFER: "무료로 증정했습니다",
      ADJUST: "관리자가 재고를 조정했습니다",
    },
    OFFICE: {
      IN: "새로운 물품을 구매해서 들어왔습니다",
      OUT: "다른 부서나 외부로 물품을 보냈습니다",
      USE: "사무실에서 직접 사용했습니다",
      ADJUST: "관리자가 재고를 조정했습니다",
    },
    WAREHOUSE: {
      IN: "공급업체에서 물품이 입고되었습니다",
      OUT: "각 부서로 물품을 배송했습니다",
      USE: "창고에서 직접 사용/소모했습니다",
      TRANSFER: "다른 창고로 이동했습니다",
      ADJUST: "관리자가 재고를 조정했습니다",
    },
    RETAIL: {
      IN: "매장에 새 상품이 입고되었습니다",
      OUT: "고객에게 판매했습니다",
      USE: "매장에서 직접 사용했습니다",
      ADJUST: "관리자가 재고를 조정했습니다",
    },
    DEFAULT: {
      IN: "물품이 들어왔습니다",
      OUT: "물품이 나갔습니다",
      USE: "물품을 사용했습니다",
      ADJUST: "재고를 조정했습니다",
    },
  };

  return descriptions[workspaceType]?.[actionType] || "재고가 변경되었습니다";
};

export const getWorkspaceTypeOptions = () => [
  { value: "DEFAULT", label: "🏢 기본", description: "일반적인 재고 관리" },
  {
    value: "OFFICE",
    label: "🏢 사무실",
    description: "사무용품 및 소모품 관리",
  },
  { value: "WAREHOUSE", label: "📦 창고", description: "물류 및 유통 관리" },
  { value: "RETAIL", label: "🛒 매장", description: "소매점 상품 관리" },
  { value: "EVENT", label: "🎭 행사장", description: "이벤트 및 굿즈 관리" },
];

export const getWorkspaceTypeLabel = (type: WorkspaceType): string => {
  const options = getWorkspaceTypeOptions();
  return options.find((opt) => opt.value === type)?.label || "🏢 기본";
};
