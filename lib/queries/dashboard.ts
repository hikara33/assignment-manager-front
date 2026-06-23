import type { QueryClient } from "@tanstack/react-query";
import { ASSIGNMENTS_QUERY_KEY } from "./assignments";

/**
 * Ключи всех запросов, которые становятся устаревшими, когда у пользователя
 * меняется состав заданий (создание / редактирование / смена статуса / перенос / удаление).
 *
 * Бэкенд при таких мутациях бампает версию пользовательского ключа кеша,
 * поэтому ответы будут свежие — нужно лишь сбросить кеш React Query.
 */
const DASHBOARD_RELATED_KEYS = [
  "dashboard",
  "prioritized",
  "conflicts",
  "reschedule",
  ASSIGNMENTS_QUERY_KEY,
] as const;

/**
 * Сбрасывает все запросы, которые зависят от изменений в заданиях,
 * чтобы дашборд (статистика, конфликты, приоритеты, рекомендации по переносу)
 * подтянулся без ручного обновления страницы.
 */
export function invalidateDashboard(qc: QueryClient): void {
  for (const key of DASHBOARD_RELATED_KEYS) {
    void qc.invalidateQueries({ queryKey: [key] });
  }
}
