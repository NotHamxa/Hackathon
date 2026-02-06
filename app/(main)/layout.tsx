import { Header } from "@/components/layout/header";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>
    </>
  );
}
