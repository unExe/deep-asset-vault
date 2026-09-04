// Server-only admin authorization + privileged write helpers.
// Never import this from client code (the `.server` suffix blocks client bundling).

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const DEFAULT_PASSWORD = 'abcD1136';
const DEFAULT_PET_ANSWER = 'lucy';
const SALT = 'vault-admin-v2';

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hash(kind: 'pw' | 'pet', value: string): Promise<string> {
  const normalized = kind === 'pet' ? value.trim().toLowerCase() : value;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${SALT}:${kind}:${normalized}`),
  );
  return toHex(digest);
}

type Creds = { password_hash: string; pet_answer_hash: string };

async function loadCreds(): Promise<Creds> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin
    .from('admin_credentials')
    .select('password_hash, pet_answer_hash')
    .eq('id', 1)
    .maybeSingle();
  if (data) return data as Creds;
  const seeded: Creds = {
    password_hash: await hash('pw', process.env['VAULT_ADMIN_PASSWORD'] || DEFAULT_PASSWORD),
    pet_answer_hash: await hash('pet', DEFAULT_PET_ANSWER),
  };
  await supabaseAdmin.from('admin_credentials').insert({ id: 1, ...seeded });
  return seeded;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VAULT_ADMIN_PASSWORD'] || SALT;
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`vault-admin-token:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(payload));
  return toHex(sig);
}

async function mintToken(): Promise<string> {
  const exp = String(Date.now() + TOKEN_TTL_MS);
  return `${exp}.${await sign(exp)}`;
}

export async function issueToken(password: string): Promise<string> {
  const creds = await loadCreds();
  if (typeof password !== 'string' || !constantTimeEqual(await hash('pw', password), creds.password_hash)) {
    throw new Error('Invalid password');
  }
  return mintToken();
}

export async function assertAdmin(token: string | undefined | null): Promise<void> {
  const unauthorized = new Error('Unauthorized');
  if (!token || typeof token !== 'string') throw unauthorized;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) throw unauthorized;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now()) throw unauthorized;
  const expected = await sign(exp);
  if (!constantTimeEqual(expected, sig)) throw unauthorized;
}

async function saveCreds(values: Partial<Creds>): Promise<void> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error } = await supabaseAdmin
    .from('admin_credentials')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}

/** Change the password using the current password. Returns a fresh token. */
export async function changePassword(current: string, next: string): Promise<string> {
  const creds = await loadCreds();
  if (!constantTimeEqual(await hash('pw', current), creds.password_hash)) {
    throw new Error('Current password is incorrect');
  }
  await saveCreds({ password_hash: await hash('pw', next) });
  return mintToken();
}

/** Recover the password by answering the pet-name question. Returns a fresh token. */
export async function resetPasswordWithPet(petAnswer: string, next: string): Promise<string> {
  const creds = await loadCreds();
  if (!constantTimeEqual(await hash('pet', petAnswer), creds.pet_answer_hash)) {
    throw new Error('Incorrect answer');
  }
  await saveCreds({ password_hash: await hash('pw', next) });
  return mintToken();
}

/** Update the recovery answer (requires the current password). */
export async function changePetAnswer(current: string, nextAnswer: string): Promise<void> {
  const creds = await loadCreds();
  if (!constantTimeEqual(await hash('pw', current), creds.password_hash)) {
    throw new Error('Current password is incorrect');
  }
  await saveCreds({ pet_answer_hash: await hash('pet', nextAnswer) });
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
  announcements: ['id', 'title', 'description', 'banner_url', 'published'],
  material_requests: ['id', 'status'],
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
