import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <PageGuard permission="COMMUNICATIONS_VIEW">{children}</PageGuard>
    </DashboardLayout>
  );
}
