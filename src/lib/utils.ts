/**
 * Calcula a sprint atual baseada na semana do ano
 * Formato: YYYY-WW (ex: 2025-48)
 */
export function getCurrentSprint(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-${week.toString().padStart(2, "0")}`;
}

/**
 * Formata a sprint para exibição
 * Ex: "2025-48" -> "Semana: 2025-48"
 */
export function formatSprint(sprintKey: string): string {
  return `Semana: ${sprintKey}`;
}

