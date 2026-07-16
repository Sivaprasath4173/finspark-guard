/**
 * Sidebar — re-export from the trustlens sub-folder.
 *
 * This top-level export exists to satisfy the target directory structure
 * (`src/components/Sidebar.tsx`). The canonical implementation is the
 * `AppShell` component at `src/components/trustlens/AppShell.tsx` which
 * renders both the sidebar nav and the main content wrapper.
 */
export { AppShell as Sidebar } from "@/components/trustlens/AppShell";
