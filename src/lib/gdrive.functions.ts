import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DRIVE_API = "https://www.googleapis.com/drive/v3";

const idSchema = z
  .string()
  .min(5)
  .max(200)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Google Drive folder id");

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime: string | null;
  thumbnailLink: string | null;
  webViewLink: string | null;
}

interface RawFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

/** Lists the contents of a public ("anyone with the link") Google Drive folder. */
export const listDriveFolder = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ folderId: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["GOOGLE_DRIVE_API_KEY"];
    if (!key) return { name: null, files: [] as DriveFile[], error: "Drive API key is not configured" };

    try {
      const metaRes = await fetch(
        `${DRIVE_API}/files/${data.folderId}?fields=id,name,mimeType&supportsAllDrives=true&key=${key}`,
      );
      if (!metaRes.ok) {
        const body = await metaRes.text();
        console.error("[gdrive] meta error", metaRes.status, body);
        return {
          name: null,
          files: [] as DriveFile[],
          error:
            metaRes.status === 404
              ? "Folder not found. Make sure it's shared as 'Anyone with the link'."
              : `Drive error (${metaRes.status})`,
        };
      }
      const meta = (await metaRes.json()) as { name: string; mimeType: string };
      if (meta.mimeType !== "application/vnd.google-apps.folder") {
        return { name: null, files: [] as DriveFile[], error: "That link is not a folder" };
      }

      const q = encodeURIComponent(`'${data.folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent(
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink)",
      );
      const files: DriveFile[] = [];
      let pageToken: string | undefined;
      do {
        const url =
          `${DRIVE_API}/files?q=${q}&fields=${fields}&pageSize=200&orderBy=folder,name` +
          `&supportsAllDrives=true&includeItemsFromAllDrives=true&key=${key}` +
          (pageToken ? `&pageToken=${pageToken}` : "");
        const res = await fetch(url);
        if (!res.ok) {
          console.error("[gdrive] list error", res.status, await res.text());
          return { name: meta.name, files, error: `Drive error (${res.status})` };
        }
        const json = (await res.json()) as { files?: RawFile[]; nextPageToken?: string };
        for (const f of json.files ?? []) {
          files.push({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size ? Number(f.size) : null,
            modifiedTime: f.modifiedTime ?? null,
            thumbnailLink: f.thumbnailLink ?? null,
            webViewLink: f.webViewLink ?? null,
          });
        }
        pageToken = json.nextPageToken;
      } while (pageToken);

      return { name: meta.name, files, error: null as string | null };
    } catch (e) {
      console.error("[gdrive] request failed", e);
      return { name: null, files: [] as DriveFile[], error: "Google Drive is currently unavailable" };
    }
  });
