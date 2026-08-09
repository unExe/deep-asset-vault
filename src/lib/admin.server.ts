// Server-only admin authorization + privileged write helpers.
// Never import this from client code (the `.server` suffix blocks client bundling).

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function adminPassword(): string {
  return process.env['VAULT_ADMIN_PASSWORD'] || 'letmeupload';
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`vault-admin-v1:${adminPassword()}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function issueToken(password: string): Promise<string> {
  if (typeof password !== 'string' || password !== adminPassword()) {
    throw new Error('Invalid password');
  }
  const exp = String(Date.now() + TOKEN_TTL_MS);
  return `${exp}.${await sign(exp)}`;
}

export async function assertAdmin(token: string | undefined | null): Promise<void> {
  const unauthorized = new Error('Unauthorized');
  if (!token || typeof token !== 'string') throw unauthorized;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) throw unauthorized;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now()) throw unauthorized;
  const expected = await sign(exp);
  if (expected.length !== sig.length || expected !== sig) throw unauthorized;
}

/** Tables an authenticated admin may write, with the columns they may set. */
const WRITABLE: Record<string, string[]> = {
  folders: ['id', 'name', 'parent_id', 'sidebar_pinned', 'info_md'],
  assets: ['id', 'name', 'storage_path', 'folder_id', 'file_type', 'size_bytes', 'is_info'],
  gdrive_embeds: ['id', 'name', 'drive_folder_id', 'parent_folder_id', 'position'],
  homepage_blocks: ['id', 'block_type', 'position', 'data'],
  blogs: [
    'id', 'title', 'slug', 'excerpt', 'content', 'cover_url', 'tags', 'published',
  ],
  folder_comments: [], // delete-only for admins
};

export function assertTable(table: string): void {
  if (!Object.prototype.hasOwnProperty.call(WRITABLE, table)) {
    throw new Error('Unsupported table');
  }
}

export function pickColumns(table: string, values: Record<string, unknown>): Record<string, unknown> {
  assertTable(table);
  const allowed = WRITABLE[table];
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(values ?? {})) {
    if (allowed.includes(k)) out[k] = values[k];
  }
  if (Object.keys(out).length === 0) throw new Error('No writable columns provided');
  return out;
}

export const STORAGE_BUCKET = 'assets';

/** Reject path traversal / absolute paths in storage keys. */
export function assertStoragePath(path: string): void {
  if (
    typeof path !== 'string' ||
    path.length === 0 ||
    path.length > 512 ||
    path.startsWith('/') ||
    path.includes('..')
  ) {
    throw new Error('Invalid storage path');
  }
}
