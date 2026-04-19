import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { NavBar } from "@/components/layout/navbar";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-context";

/**
 * Authenticated app shell shared by all pages under `(app)/`.
 *
 * Composes the collapsible sidebar, top navbar (server component), and the
 * purple breadcrumb header into a standard two-column layout. Page content
 * is rendered inside `<main>` via the `children` slot.
 *
 * `h-dvh overflow-hidden` on SidebarProvider constrains the shell to the
 * viewport height so that `<main>` (overflow-auto) is the scroll container —
 * not the body. This makes `sticky` positioning work inside <main>.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-dvh">
      <BreadcrumbProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <NavBar />
          <PageHeader />
          <main className="flex-1 min-h-0 overflow-auto flex flex-col p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
