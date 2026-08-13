# AssetVault 🎬📁

A high-performance, dark-themed, folder-based asset management and download web application tailored for content creators and video editors. Designed to mimic desktop OS file explorers (Windows/macOS), AssetVault provides a seamless directory navigation experience, rich thumbnail previews, bulk downloadable zip archives, and an integrated hidden admin upload interface.

---

## ✨ Features

- **📂 OS-Style Folder System**: Infinite nesting support (`Folders` inside `Folders`) using parent-child relational database structures.
- **🍞 Dynamic Breadcrumb Trail**: Instant navigation through deeply nested paths (e.g., `Home > Attack on Titan > OVA > A Choice With No Regrets`) with clickable path segments.
- **🎨 Deep Dark Aesthetic**: Sleek UI designed for high-contrast viewing, matching professional editor environments (`#0D0D0D` background with `#1A1A1A` cards).
- **⚡ Phosphor Icons**: Integrated with `phosphor-react` for modern, clean visual indicators.
- **Selection & Multi-Download**:
  - Select individual or multiple assets with radio/checkmark overlays.
  - Floating action menu with **Preview** and **Download** actions.
  - On-the-fly **ZIP compression** using `jszip` for downloading entire folders or multi-selected items in one click.
- **🔐 Secret Admin Drag-and-Drop (`/admin/letmeupload`)**:
  - Unlocked via secret URL path without confusing UI overlays for general users.
  - Whole-screen dropzone instantly uploads assets into the current open folder directory.
  - Automatically handles storage upload and database record creation.

---

## 🗝️ How to Use

### For Public Users
1. Visit the root URL `https://your-domain.com`.
2. Browse through folders and subfolders seamlessly.
3. Click on items to select them (indicated by a circular checkmark).
4. Use the floating action bar at the bottom to **Preview** files or **Download** them (single files or zipped packages).

### For Admins (Uploading & Asset Management)
1. Navigate directly to `https://your-domain.com/admin/letmeupload`.
2. Navigate to the desired folder where you want to add assets.
3. Simply **Drag & Drop** files anywhere onto the window.
4. Assets will automatically upload to Supabase Storage and register into that exact folder in real-time.
5. Select items in Editor Mode to reveal the **Delete** action in the floating menu.
