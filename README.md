# AssetVault Explorer

Role: You are an expert Full-Stack Developer specializing in React, Tailwind CSS, and  (PostgreSQL + Storage).

Project Goal: Build "AssetVault," a high-end, folder-based asset management system for editors. The UI must be a pixel-perfect recreation of the dark, desktop-OS style seen in the provided reference images.

1. Core Architecture (The Filesystem)

Folder Fundamental: The UI is a file explorer. Everything is controlled by a currentFolderId state.

Database Schema (PostgreSQL): * folders table: id, name, parent_id (UUID, self-referencing for nesting).

assets table: id, name, storage_url, folder_id (Foreign Key to folders), file_type.

Recursive Breadcrumbs: Implement a dynamic breadcrumb trail (e.g., Home > Attack on Titan > OVA). Each segment must be clickable to navigate back. Use Phosphor Icons <CaretRight /> as separators.

2. The "Hidden Admin" Protocol

The Entry Point: The site is read-only by default. Admin capabilities are unlocked ONLY when the URL matches: /admin/letmeupload.

Editor Mode: When this path is active, set a global state isEditorMode = true.

Integrated Uploading: In Editor Mode, the folder view becomes a Drag & Drop zone. Dropping a file triggers:

An upload to Supabase Storage bucket.

An insert into the Supabase assets table, linked to the currentFolderId.

Security: Use the URL path to toggle the UI, but ensure the logic is stripped for public users.

3. UI/UX Specifications (Based on Images)

Theme: Deep Dark Mode. Background: #0D0D0D, Folder/File Cards: #1A1A1A.

Icons: Use Phosphor Icons (phosphor-react) in Regular or Light weight.

Asset Grid:

Folders: Use <FolderSimple weight="fill" />.

Files: Show thumbnails. Clicking a file toggles a selection indicator (Phosphor <CheckCircle weight="fill" />) at the bottom center of the item.

Floating Action Bar: When items are selected, show a bottom bar with:

"Preview" (Phosphor <Eye />)

"Download" (Phosphor <DownloadSimple />)

"Delete" (Visible/Active only in Editor Mode).

4. Technical Implementation

Framework: React (Vite) + Tailwind CSS.

State Management: Use Zustand or React Context to manage navigation and selection.

Bulk Downloading: Integrate jszip. When a user clicks download, the app must fetch the public URLs from Supabase and bundle them into a .zip.

Supabase Client: Generate a useFileSystem hook to handle the select queries for folders and assets based on the parent_id.

5. Output Requirements

Please generate:

The Supabase Database Schema (SQL) for folders and assets.

The FolderGrid Component handling selection and Phosphor Icon implementation.

The Breadcrumb Logic for deep-nested navigation.

The Upload & Delete Logic reserved for the /admin/letmeupload route.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7bfb0e44-cd00-4016-924a-6cc3e0678097).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
