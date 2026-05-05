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
      link: "border-rose-200 bg-rose-50/90 hover:bg-rose-50",
      title: "text-rose-950",
      due: "text-rose-700",
    };
  }

  if (task.isOverdue === true) {
    return {
      link: "border-amber-200 bg-amber-50/90 hover:bg-amber-50",
      title: "text-amber-950",
      due: "text-amber-800",
    };
  }

  return {
    link: "border-slate-100 bg-slate-50/50 hover:bg-sky-50",
    title: "text-slate-800",
    due: "text-slate-500",
  };
}
