// src/pages/Dashboard.tsx (추가)
import { useItemList, useMovementList } from "../stores/selectors";

export function Component() {
  const items = useItemList();
  const movements = useMovementList();
  return (
    <div className="space-y-2">
      <div className="text-xl">Dashboard</div>
      <div>Items: {items.length}</div>
      <div>Movements: {movements.length}</div>
    </div>
  );
}
export { Component as default };
export function ErrorBoundary() {
  return <div>Dashboard failed to load.</div>;
}
