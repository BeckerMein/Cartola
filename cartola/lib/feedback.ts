import { Alert } from "react-native";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
): string {
  if (typeof error === "string" && error.trim()) return error;
  if (isRecord(error)) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function showError(title: string, error?: unknown, fallback?: string) {
  const message = error ? getErrorMessage(error, fallback) : fallback;
  Alert.alert(title, message);
}

export function showSuccess(title: string, message?: string) {
  Alert.alert(title, message);
}

