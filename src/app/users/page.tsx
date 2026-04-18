"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Ban, Download, Users as UsersIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useApi } from "@/hooks/useApi";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { FilterChip } from "@/components/ui/FilterChip";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Kbd } from "@/components/ui/Kbd";
import { pushRecent } from "@/hooks/useRecent";
import { cn } from "@/lib/cn";

type User = {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  verificationStatus: string;
  location?: string;
  createdAt: string;
  _count?: { orders: number };
};

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data, loading } = useApi<{ data: User[]; total: number }>(
    `/api/admin/users?page=${page}&limit=20&search=${debouncedSearch}&role=${roleFilter}&status=${statusFilter}`
  );

  const users = data?.data || [];
  const total = data?.total || 0;

  const { run } = useOptimisticAction();
  const handleBulkAction = (action: string) => {
    const ids = [...selectedIds];
    run({
      action: () => api.post("/api/admin/users/bulk-action", { userIds: ids, action }),
      optimistic: () => setSelectedIds(new Set()),
      label: `${ids.length} user${ids.length === 1 ? "" : "s"} ${action === "verify" ? "verified" : action === "suspend" ? "suspended" : "updated"}`,
    });
  };

  const toggleAll = (on: boolean) => {
    setSelectedIds(on ? new Set(users.map((u) => u.id)) : new Set());
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someSelected = users.some((u) => selectedIds.has(u.id));

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      size: 36,
      header: () => (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onCheckedChange={(v) => toggleAll(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleOne(row.original.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const u = row.original;
        const initials = (u.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-accent-bg text-accent flex items-center justify-center text-2xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm-compact text-fg truncate">{u.name || "Unknown"}</div>
              <div className="text-2xs text-fg-muted tabular">{u.phoneNumber}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: "verification",
      header: "Verification",
      accessorKey: "verificationStatus",
      cell: ({ row }) => {
        const s = row.original.verificationStatus;
        const tone = s === "VERIFIED" ? "success" : s === "REJECTED" ? "danger" : s === "PENDING" ? "warning" : "neutral";
        return <Badge tone={tone} size="sm" dot>{s}</Badge>;
      },
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
      cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.location || "—"}</span>,
    },
    {
      id: "orders",
      header: () => <span className="text-right block">Orders</span>,
      accessorFn: (u) => u._count?.orders ?? 0,
      cell: ({ row }) => <span className="text-sm-compact text-fg tabular block text-right">{row.original._count?.orders ?? 0}</span>,
    },
    {
      id: "created",
      header: "Joined",
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <span className="text-xs text-fg-muted tabular">
          {new Date(row.original.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" })}
        </span>
      ),
    },
  ];

  const openUser = (u: User) => {
    pushRecent({ id: u.id, kind: "user", label: u.name || u.phoneNumber, href: `/users/${u.id}` });
    router.push(`/users/${u.id}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description={`${total.toLocaleString()} total`}
        actions={
          <Button variant="secondary" size="sm" leadingIcon={<Download className="h-3.5 w-3.5" />}>
            Export
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or phone…"
            leadingIcon={<Search className="h-3.5 w-3.5" />}
            trailingIcon={!search ? <Kbd>/</Kbd> : undefined}
          />
        </div>

        <FilterChip
          label="Role"
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          onClear={() => { setRoleFilter(""); setPage(1); }}
          options={[
            { value: "BUYER", label: "Buyer" },
            { value: "SELLER", label: "Seller" },
            { value: "DELIVERY_PARTNER", label: "Runner" },
          ]}
        />

        <FilterChip
          label="Status"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          onClear={() => { setStatusFilter(""); setPage(1); }}
          options={[
            { value: "VERIFIED", label: "Verified" },
            { value: "PENDING", label: "Pending" },
            { value: "REJECTED", label: "Rejected" },
            { value: "GUEST", label: "Guest" },
          ]}
        />

        {(search || roleFilter || statusFilter) && (
          <span className="text-2xs text-fg-subtle ml-1">
            Showing {users.length} of {total}
          </span>
        )}
      </div>

      {/* Table */}
      <Table<User>
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={openUser}
        rowId={(u) => u.id}
        emptyTitle="No users found"
        emptyDescription={debouncedSearch ? `Nothing matches "${debouncedSearch}"` : "Adjust filters to see users"}
        emptyIcon={<UsersIcon className="h-5 w-5" />}
      />

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-2xs text-fg-subtle tabular">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action sticky toolbar */}
      <BulkToolbar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onVerify={() => handleBulkAction("verify")}
        onSuspend={() => handleBulkAction("suspend")}
      />
    </PageContainer>
  );
}

function BulkToolbar({
  count, onClear, onVerify, onSuspend,
}: {
  count: number; onClear: () => void; onVerify: () => void; onSuspend: () => void;
}) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
        "flex items-center gap-2 bg-overlay border border-strong rounded-xl shadow-elev-4 px-2 py-1.5",
        "animate-slide-up"
      )}
    >
      <span className="text-xs text-fg-muted pl-2">
        <span className="font-semibold text-fg tabular">{count}</span> selected
      </span>
      <div className="w-px h-4 bg-muted mx-1" />
      <Button size="sm" variant="primary" leadingIcon={<ShieldCheck className="h-3.5 w-3.5" />} onClick={onVerify}>
        Verify
      </Button>
      <Button size="sm" variant="danger-ghost" leadingIcon={<Ban className="h-3.5 w-3.5" />} onClick={onSuspend}>
        Suspend
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
