export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 250
) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), delay);
  };
}
