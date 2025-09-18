import { create } from "zustand";
import type { User } from "../types/auth";

type State = { user: User | null };
type Actions = {
  signInMock: (u: User) => void;
  signOut: () => void;
};
export const useAuthStore = create<State & Actions>((set) => ({
  user: { id: "u-A", name: "Alice" }, // 초기 mock
  signInMock: (u) => set({ user: u }),
  signOut: () => set({ user: null }),
}));
