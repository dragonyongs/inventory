import {
  Building,
  Users,
  Shield,
  Eye,
  Crown,
  Package,
  UtensilsCrossed,
  Pill,
  PartyPopper,
  Briefcase,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { WorkspaceType } from "../types/workspace";

interface WorkspaceTypeOption {
  value: WorkspaceType;
  label: string;
  description: string;
  icon: LucideIcon; // JSX Element가 아니라 컴포넌트 타입
}

export const workspaceTypeOptions: WorkspaceTypeOption[] = [
  {
    value: "DEFAULT",
    label: "기본",
    description: "기본 워크스페이스",
    icon: Building, // JSX가 아니라 컴포넌트 자체
  },
  {
    value: "RETAIL",
    label: "소매",
    description: "소매업 관리",
    icon: Users,
  },
  {
    value: "WAREHOUSE",
    label: "창고",
    description: "창고 관리",
    icon: Package,
  },
  {
    value: "RESTAURANT",
    label: "식당",
    description: "식당업 관리",
    icon: UtensilsCrossed,
  },
  {
    value: "PHARMACY",
    label: "약국",
    description: "약국 관리",
    icon: Pill,
  },
  {
    value: "EVENT",
    label: "이벤트",
    description: "이벤트 관리",
    icon: PartyPopper,
  },
  {
    value: "OFFICE",
    label: "사무실",
    description: "사무실 관리",
    icon: Briefcase,
  },
  {
    value: "GENERAL",
    label: "일반",
    description: "일반 업무",
    icon: Layers,
  },
];

interface RoleInfo {
  label: string;
  icon: LucideIcon; // 컴포넌트 타입
  color: string;
  bgColor: string;
}

export const roleOptions: Record<string, RoleInfo> = {
  owner: {
    label: "소유자",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  admin: {
    label: "관리자",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  member: {
    label: "멤버",
    icon: Users,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  guest: {
    label: "게스트",
    icon: Eye,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
  },
};
