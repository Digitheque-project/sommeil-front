export function checkPublicEnv(_name: string, value: string | undefined): string {
  return value?.trim() ?? "";
}
