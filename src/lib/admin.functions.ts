import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const tokenField = z.string().min(1);

export const adminLogin = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { issueToken } = await import('./admin.server');
    return { token: await issueToken(data.password) };
  });

export const adminInsert = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: tokenField,
        table: z.string().min(1).max(64),
        rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, pickColumns } = await import('./admin.server');
    await assertAdmin(data.token);
    const rows = data.rows.map((r) => pickColumns(data.table, r));
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: inserted, error } = await supabaseAdmin
      .from(data.table as never)
      .insert(rows as never)
      .select('id');
    if (error) throw new Error(error.message);
    return { ids: ((inserted as { id: string }[] | null) ?? []).map((r) => r.id) };
  });

export const adminUpdate = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: tokenField,
        table: z.string().min(1).max(64),
        id: z.string().uuid(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, pickColumns } = await import('./admin.server');
    await assertAdmin(data.token);
    const values = pickColumns(data.table, data.values);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from(data.table as never)
      .update(values as never)
      .eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: tokenField,
        table: z.string().min(1).max(64),
        ids: z.array(z.string().uuid()).min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, assertTable } = await import('./admin.server');
    await assertAdmin(data.token);
    assertTable(data.table);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from(data.table as never)
      .delete()
      .in('id', data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteAllHomepageBlocks = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ token: tokenField }).parse(d))
  .handler(async ({ data }) => {
    const { assertAdmin } = await import('./admin.server');
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('homepage_blocks').delete().not('id', 'is', null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSignedUpload = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ token: tokenField, path: z.string().min(1).max(512) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, assertStoragePath, STORAGE_BUCKET } = await import('./admin.server');
    await assertAdmin(data.token);
    assertStoragePath(data.path);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: signed, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(data.path);
    if (error || !signed) throw new Error(error?.message ?? 'Could not prepare upload');
    return { path: signed.path, uploadToken: signed.token };
  });

export const adminRemoveFiles = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({ token: tokenField, paths: z.array(z.string().min(1).max(512)).min(1).max(500) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, assertStoragePath, STORAGE_BUCKET } = await import('./admin.server');
    await assertAdmin(data.token);
    data.paths.forEach(assertStoragePath);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(data.paths);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
