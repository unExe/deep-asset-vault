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

export const adminChangePassword = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(6).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { changePassword } = await import('./admin.server');
    return { token: await changePassword(data.currentPassword, data.newPassword) };
  });

export const adminResetPasswordWithPet = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({ petAnswer: z.string().min(1).max(120), newPassword: z.string().min(6).max(200) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { resetPasswordWithPet } = await import('./admin.server');
    return { token: await resetPasswordWithPet(data.petAnswer, data.newPassword) };
  });

export const adminChangePetAnswer = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({ currentPassword: z.string().min(1).max(200), petAnswer: z.string().min(1).max(120) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { changePetAnswer } = await import('./admin.server');
    await changePetAnswer(data.currentPassword, data.petAnswer);
    return { ok: true };
  });

export const adminSetSetting = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: tokenField,
        key: z.enum(['hero', 'socials', 'branding', 'content']),
        value: z.unknown(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import('./admin.server');
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAnalytics = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ token: tokenField, days: z.number().int().min(1).max(90).default(30) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import('./admin.server');
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from('page_views')
      .select('path, referrer, visitor_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20000);
    if (error) throw new Error(error.message);
    const views = rows ?? [];

    const byDayMap = new Map<string, { views: number; visitors: Set<string> }>();
    const byPath = new Map<string, number>();
    const byReferrer = new Map<string, number>();
    const visitors = new Set<string>();

    for (const v of views) {
      const day = String(v.created_at).slice(0, 10);
      const bucket = byDayMap.get(day) ?? { views: 0, visitors: new Set<string>() };
      bucket.views += 1;
      bucket.visitors.add(v.visitor_id);
      byDayMap.set(day, bucket);
      byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
      const ref = v.referrer && v.referrer.length > 0 ? v.referrer : 'direct';
      byReferrer.set(ref, (byReferrer.get(ref) ?? 0) + 1);
      visitors.add(v.visitor_id);
    }

    const byDay = [...byDayMap.entries()]
      .map(([day, b]) => ({ day, views: b.views, visitors: b.visitors.size }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const top = (m: Map<string, number>) =>
      [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    return {
      totalViews: views.length,
      uniqueVisitors: visitors.size,
      byDay,
      topPaths: top(byPath),
      topReferrers: top(byReferrer),
    };
  });

export const adminListRequests = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ token: tokenField }).parse(d))
  .handler(async ({ data }) => {
    const { assertAdmin } = await import('./admin.server');
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: rows, error } = await supabaseAdmin
      .from('material_requests')
      .select('id, title, details, contact, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });
