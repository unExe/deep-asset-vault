import { supabase } from "@/integrations/supabase/client";
import {
  adminDelete,
  adminDeleteAllHomepageBlocks,
  adminInsert,
  adminLogin,
  adminRemoveFiles,
  adminSignedUpload,
  adminUpdate,
  adminAnalytics,
  adminChangePassword,
  adminChangePetAnswer,
  adminResetPasswordWithPet,
  adminSetSetting,
} from "@/lib/admin.functions";

const TOKEN_KEY = "vault_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAdminUnlocked(): boolean {
  return !!getAdminToken();
}

export function clearAdminToken() {
  if (typeof window !== "undefined") sessionStorage.removeItem(TOKEN_KEY);
}

export async function adminSignIn(password: string): Promise<void> {
  const { token } = await adminLogin({ data: { password } });
  sessionStorage.setItem(TOKEN_KEY, token);
}

function requireToken(): string {
  const token = getAdminToken();
  if (!token) throw new Error("Editor session expired — unlock again at /admin/letmeupload");
  return token;
}

export async function aInsert(
  table: string,
  rows: Record<string, unknown>[],
): Promise<string[]> {
  const { ids } = await adminInsert({ data: { token: requireToken(), table, rows } });
  return ids;
}

export async function aUpdate(table: string, id: string, values: Record<string, unknown>) {
  await adminUpdate({ data: { token: requireToken(), table, id, values } });
}

export async function aDelete(table: string, ids: string[]) {
  if (ids.length === 0) return;
  await adminDelete({ data: { token: requireToken(), table, ids } });
}

export async function aDeleteAllHomepageBlocks() {
  await adminDeleteAllHomepageBlocks({ data: { token: requireToken() } });
}

/** Build a storage-safe object key (Supabase signed uploads reject exotic characters). */
export function storagePath(folderId: string | null, name: string): string {
  const safe = name
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+/, "")
    .slice(0, 120) || "file";
  return `${folderId ?? "root"}/${crypto.randomUUID()}-${safe}`;
}

/** Upload a file to the assets bucket through a short-lived signed upload URL. */
export async function aUploadFile(path: string, body: Blob | File, contentType?: string) {
  const { uploadToken } = await adminSignedUpload({ data: { token: requireToken(), path } });
  const { error } = await supabase.storage
    .from("assets")
    .uploadToSignedUrl(path, uploadToken, body, contentType ? { contentType } : undefined);
  if (error) throw error;
}

export async function aRemoveFiles(paths: string[]) {
  if (paths.length === 0) return;
  await adminRemoveFiles({ data: { token: requireToken(), paths } });
}

export async function aSetSetting(key: "hero" | "socials", value: unknown) {
  await adminSetSetting({ data: { token: requireToken(), key, value } });
}

export async function aAnalytics(days = 30) {
  return adminAnalytics({ data: { token: requireToken(), days } });
}

export async function aChangePassword(currentPassword: string, newPassword: string) {
  const { token } = await adminChangePassword({ data: { currentPassword, newPassword } });
  sessionStorage.setItem(TOKEN_KEY, token);
}

export async function aResetPasswordWithPet(petAnswer: string, newPassword: string) {
  const { token } = await adminResetPasswordWithPet({ data: { petAnswer, newPassword } });
  sessionStorage.setItem(TOKEN_KEY, token);
}

export async function aChangePetAnswer(currentPassword: string, petAnswer: string) {
  await adminChangePetAnswer({ data: { currentPassword, petAnswer } });
}
