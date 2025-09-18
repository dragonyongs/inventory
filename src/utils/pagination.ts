export function paginate<T>(rows: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}
