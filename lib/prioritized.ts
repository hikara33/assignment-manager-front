import type { PrioritizedAssignment } from "./types";

export function maxPrioritizedScore(
  assignments: PrioritizedAssignment[] | undefined,
): number | null {
  if (!assignments?.length) return null;
  const scores = assignments
    .map((a) => a.score)
    .filter((s): s is number => typeof s === "number" && !Number.isNaN(s));
  if (!scores.length) return null;
  return Math.max(...scores);
}

/** Классы для строки «приоритетных»: красный — топ по score, жёлтый — просрочено (если не топ). */
export function prioritizedTaskRowClasses(
  task: PrioritizedAssignment,
  topScore: number | null,
): { link: string; title: string; due: string } {
  const isTop =
    topScore !== null &&
    typeof task.score === "number" &&
    !Number.isNaN(task.score) &&
    task.score === topScore;

  if (isTop) {
    return {
      link: "xmb-row xmb-row-danger",
      title: "text-[var(--danger)]",
      due: "text-[var(--danger)] opacity-80",
    };
  }

  if (task.isOverdue === true) {
    return {
      link: "xmb-row xmb-row-warning",
      title: "text-[var(--warning)]",
      due: "text-[var(--warning)] opacity-80",
    };
  }

  return {
    link: "xmb-row",
    title: "text-[var(--foreground)]",
    due: "text-[var(--foreground-muted)]",
  };
}
