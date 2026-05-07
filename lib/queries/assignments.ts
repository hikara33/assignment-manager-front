import { queryOptions } from "@tanstack/react-query";
import { Assignment, AssignmentStatus, Paginated } from "../types";
import { ASSIGNMENTS_PAGE_SIZE } from "../pagination";
import { apiJson } from "../api";

export const ASSIGNMENTS_QUERY_KEY = "assignments";

export function useAssignmentsQuery(
  status: AssignmentStatus | "",
  page: number,
) {
  return queryOptions({
    queryKey: [ASSIGNMENTS_QUERY_KEY, status, page],

    queryFn: async (): Promise<Paginated<Assignment>> => {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(ASSIGNMENTS_PAGE_SIZE),
      });

      if (status) q.set("status", status);

      return apiJson(`/assignment?${q}`);
    },

    staleTime: 1000 * 30,
  });
}