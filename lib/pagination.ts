export const ASSIGNMENTS_PAGE_SIZE = 12;

export function totalPages(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}