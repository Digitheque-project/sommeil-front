import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 min-h-screen pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
