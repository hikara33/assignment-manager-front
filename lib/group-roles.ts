import { apiJson } from "./api";
import type { GroupMemberRow } from "./types";

export type GroupRole = "OWNER" | "MEMBER";

export async function fetchMyRolesInGroups(
  groupIds: string[],
  userId: string,
): Promise<Map<string, GroupRole>> {
  const unique = [...new Set(groupIds)];
  const pairs = await Promise.all(
    unique.map(async (groupId) => {
      const members = await apiJson<GroupMemberRow[]>(
        `/group/${groupId}/members`,
      );
      const row = members.find((m) => m.userId === userId);
      return [groupId, row?.role] as const;
    }),
  );

  const map = new Map<string, GroupRole>();
  for (const [groupId, role] of pairs) {
    if (role) map.set(groupId, role);
  }
  return map;
}

/** Личные задания — всем; групповые — только владельцу. */
export function canRescheduleByRole(
  groupId: string | null | undefined,
  roles: Map<string, GroupRole> | undefined,
): boolean {
  if (!groupId) return true;
  return roles?.get(groupId) === "OWNER";
}
