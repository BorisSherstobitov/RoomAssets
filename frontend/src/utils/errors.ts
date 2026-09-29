import axios from "axios";

/** Достаёт понятное сообщение об ошибке из ответа backend ({ message }) */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!e.response) return "Нет связи с сервером";
  }
  return fallback;
}
