"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Ban, Undo2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID" | "REFUNDED";

interface LineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: string | number;
  unitPriceUsd: string | number;
  amountUsd: string | number;
}

interface JournalLine {
  id: string;
  debit: string | number;
  credit: string | number;
  description: string | null;
  account: { code: string; name: string };
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  type: string;
  status: InvoiceStatus;
  counterpartyType: "SELLER" | "RUNNER";
  counterpartyName: string;
  counterpartyPhone: string | null;
  counterpartyAddress: string | null;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  currency: string;
  subtotalUsd: string | number;
  taxRate: string | number;
  taxUsd: string | number;
  totalUsd: string | number;
  journalEntryId: string | null;
  relatedInvoiceId: string | null;
  voidedByAdminId: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  issuedByAdminId: string | null;
  lineItems: LineItem[];
  seller: { id: string; businessName: string; user: { name: string; phoneNumber: string } | null } | null;
  deliveryPartner: { id: string; user: { name: string; phoneNumber: string } | null } | null;
  journalEntry: { id: string; entryNumber: string; description: string; date: string; lines: JournalLine[] } | null;
  relatedInvoice: { id: string; invoiceNumber: string } | null;
  creditNotes: Array<{ id: string; invoiceNumber: string }>;
}

const STATUS_TONE: Record<InvoiceStatus, "success" | "warning" | "neutral" | "danger"> = {
  PAID: "success",
  ISSUED: "warning",
  DRAFT: "neutral",
  VOID: "neutral",
  REFUNDED: "danger",
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("FINANCE_MANAGE");
  const { data: invoice, refetch } = useApi<InvoiceDetail>(`/api/admin/invoices/${params.id}`);
  const [action, setAction] = React.useState<null | "void" | "credit-note">(null);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function downloadPdf() {
    if (!invoice) return;
    try {
      await api.download(`/api/admin/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    }
  }

  async function submit() {
    if (!invoice || !action) return;
    if (!reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setSubmitting(true);
    try {
      const path = action === "void"
        ? `/api/admin/invoices/${invoice.id}/void`
        : `/api/admin/invoices/${invoice.id}/credit-note`;
      await api.post(path, { reason: reason.trim() });
      toast.success(action === "void" ? "Invoice voided" : "Credit note issued");
      setAction(null);
      setReason("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!invoice) {
    return (
      <PageContainer>
        <Skeleton className="h-96" />
      </PageContainer>
    );
  }

  const isCredit = invoice.type === "CREDIT_NOTE";
  const canVoid = canManage && invoice.status !== "VOID" && invoice.status !== "REFUNDED" && !invoice.journalEntryId;
  const canCreditNote = canManage && !isCredit && (invoice.status === "ISSUED" || invoice.status === "PAID");

  return (
    <PageContainer>
      <Link
        href="/finance/invoices"
        className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors mb-2"
      >
        <ArrowLeft className="h-3 w-3" /> Back to invoices
      </Link>
      <PageHeader
        title={invoice.invoiceNumber}
        description={
          <span className="inline-flex items-center gap-2">
            <Badge tone={isCredit ? "danger" : "neutral"} size="sm">{invoice.type.replace(/_/g, " ")}</Badge>
            <Badge tone={STATUS_TONE[invoice.status]} size="sm" dot>{invoice.status}</Badge>
            <span>Issued {new Date(invoice.issueDate).toLocaleString()}</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={downloadPdf} leadingIcon={<Download className="h-3.5 w-3.5" />}>
              PDF
            </Button>
            {canCreditNote && (
              <Button size="sm" variant="danger-ghost" onClick={() => { setAction("credit-note"); setReason(""); }} leadingIcon={<Undo2 className="h-3.5 w-3.5" />}>
                Issue credit note
              </Button>
            )}
            {canVoid && (
              <Button size="sm" variant="danger-ghost" onClick={() => { setAction("void"); setReason(""); }} leadingIcon={<Ban className="h-3.5 w-3.5" />}>
                Void
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          {/* Line items */}
          <Card padding={false}>
            <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Description</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Qty</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Unit</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="px-3 py-2 text-fg">{li.description}</td>
                      <td className="px-3 py-2 text-right tabular text-fg-muted">{Number(li.quantity)}</td>
                      <td className="px-3 py-2 text-right tabular text-fg-muted">{formatMoney(li.unitPriceUsd)}</td>
                      <td className={cn("px-3 py-2 text-right tabular", Number(li.amountUsd) < 0 ? "text-danger" : "text-fg")}>
                        {formatMoney(li.amountUsd)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-raised">
                    <td colSpan={3} className="px-3 py-2 text-right text-fg-muted">Subtotal</td>
                    <td className="px-3 py-2 text-right tabular text-fg">{formatMoney(invoice.subtotalUsd)}</td>
                  </tr>
                  {Number(invoice.taxRate) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-fg-muted">
                        VAT ({(Number(invoice.taxRate) * 100).toFixed(2)}%)
                      </td>
                      <td className="px-3 py-2 text-right tabular text-fg">{formatMoney(invoice.taxUsd)}</td>
                    </tr>
                  )}
                  <tr className="bg-raised font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-fg">Total</td>
                    <td className={cn("px-3 py-2 text-right tabular", Number(invoice.totalUsd) < 0 ? "text-danger" : "text-fg")}>
                      {formatMoney(invoice.totalUsd)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Linked journal entry */}
          {invoice.journalEntry ? (
            <Card padding={false}>
              <CardHeader>
                <div>
                  <CardTitle>Linked journal entry</CardTitle>
                  <div className="text-2xs text-fg-subtle mt-0.5">
                    <Link href={`/finance/journal/${invoice.journalEntry.id}`} className="text-accent hover:underline font-mono">
                      {invoice.journalEntry.entryNumber}
                    </Link>
                    {" · "}{new Date(invoice.journalEntry.date).toLocaleDateString()}
                    {" · "}{invoice.journalEntry.description}
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm-compact">
                  <thead>
                    <tr className="border-b border-muted bg-panel">
                      <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Account</th>
                      <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Debit</th>
                      <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                    {invoice.journalEntry.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs text-accent mr-2">{l.account.code}</span>
                          <span className="text-fg">{l.account.name}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular text-fg">
                          {Number(l.debit) > 0 ? formatMoney(l.debit) : ""}
                        </td>
                        <td className="px-3 py-2 text-right tabular text-fg">
                          {Number(l.credit) > 0 ? formatMoney(l.credit) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card variant="ghost" className="!p-3 text-xs text-fg-muted">
              This invoice is not linked to a journal entry yet.
            </Card>
          )}
        </div>

        <div className="space-y-3">
          {/* Counterparty */}
          <Card>
            <CardHeader><CardTitle>Bill to</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-fg">{invoice.counterpartyName}</div>
              <div className="text-2xs text-fg-subtle">{invoice.counterpartyType === "SELLER" ? "Seller" : "Runner"}</div>
              {invoice.counterpartyPhone && (
                <div className="text-xs text-fg-muted mt-2">📞 {invoice.counterpartyPhone}</div>
              )}
              {invoice.counterpartyAddress && (
                <div className="text-xs text-fg-muted mt-1">{invoice.counterpartyAddress}</div>
              )}
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Row label="Issue date">{new Date(invoice.issueDate).toLocaleString()}</Row>
              {invoice.paidAt && <Row label="Paid">{new Date(invoice.paidAt).toLocaleString()}</Row>}
              <Row label="Currency">{invoice.currency}</Row>
              <Row label="Tax rate">{(Number(invoice.taxRate) * 100).toFixed(2)}%</Row>
              {invoice.issuedByAdminId ? (
                <Row label="Issued by">{invoice.issuedByAdminId.slice(0, 12)}…</Row>
              ) : (
                <Row label="Issued by">System</Row>
              )}
              {invoice.relatedInvoice && (
                <Row label={isCredit ? "Credits" : "Credited by"}>
                  <Link href={`/finance/invoices/${invoice.relatedInvoice.id}`} className="text-accent hover:underline font-mono">
                    {invoice.relatedInvoice.invoiceNumber}
                  </Link>
                </Row>
              )}
              {invoice.creditNotes.length > 0 && (
                <Row label="Credit notes">
                  <div className="flex flex-col">
                    {invoice.creditNotes.map((cn) => (
                      <Link key={cn.id} href={`/finance/invoices/${cn.id}`} className="text-accent hover:underline font-mono">
                        {cn.invoiceNumber}
                      </Link>
                    ))}
                  </div>
                </Row>
              )}
              {invoice.voidedAt && (
                <>
                  <Row label="Voided">{new Date(invoice.voidedAt).toLocaleString()}</Row>
                  {invoice.voidReason && <Row label="Void reason">{invoice.voidReason}</Row>}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action sheet */}
      <Sheet open={!!action} onOpenChange={(o) => { if (!o) { setAction(null); setReason(""); } }}>
        {action && (
          <SheetContent width="md">
            <SheetHeader
              title={action === "void" ? "Void this invoice" : "Issue a credit note"}
              subtitle={
                <span className="text-2xs">
                  {action === "void"
                    ? "Only invoices not yet linked to a journal entry can be voided. For anything already booked, use a credit note."
                    : "Creates a negative-amount credit note that offsets this invoice. The original stays for audit."}
                </span>
              }
            />
            <SheetBody>
              <Field label="Reason" required>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={action === "void"
                    ? "Why are you voiding this invoice?"
                    : "Why are you issuing a credit note? (e.g. refund, billing error)"}
                />
              </Field>
            </SheetBody>
            <SheetFooter>
              <Button variant="ghost" size="sm" onClick={() => { setAction(null); setReason(""); }}>Cancel</Button>
              <Button
                variant={action === "void" ? "danger" : "primary"}
                size="sm"
                onClick={submit}
                loading={submitting}
                disabled={!reason.trim() || submitting}
              >
                {action === "void" ? "Confirm void" : "Issue credit note"}
              </Button>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </PageContainer>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-fg-subtle uppercase tracking-wider text-2xs">{label}</span>
      <span className="text-fg text-right">{children}</span>
    </div>
  );
}

function formatMoney(v: string | number): string {
  const n = Number(v);
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
