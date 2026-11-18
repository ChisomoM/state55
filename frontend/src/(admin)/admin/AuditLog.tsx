import { useState } from "react";
import { Label } from "@radix-ui/react-label";
import { ListState, PageHeader, Pager, Pill } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { auditApi } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 25;

interface Filters {
  action: string;
  resource: string;
  from: string;
  to: string;
}
const EMPTY: Filters = { action: "", resource: "", from: "", to: "" };

/** Reads the HTTP status the audit middleware stored in the details JSON, if any. */
function statusOf(details?: string): number | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details);
    return typeof parsed.status === "number" ? parsed.status : null;
  } catch {
    return null; // plain-text details (sign-ins, role changes)
  }
}

export function AuditLogPage() {
  const [draft, setDraft] = useState<Filters>(EMPTY); // what is typed in the form
  const [applied, setApplied] = useState<Filters>(EMPTY); // what the list is using
  const [page, setPage] = useState(1);

  const log = useApi(
    () => auditApi.list({ page, limit: PAGE_SIZE, ...applied }),
    [page, applied]
  );
  const items = log.data?.items ?? [];

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ ...draft, action: draft.action.trim().toUpperCase(), resource: draft.resource.trim().toLowerCase() });
    setPage(1);
  };

  const clear = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Who did what, and whether it worked. Entries cannot be edited or deleted."
      />

      <form onSubmit={apply} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <FilterField id="f-action" label="Action" placeholder="e.g. LOGIN, POST" value={draft.action} onChange={(v) => setDraft({ ...draft, action: v })} />
        <FilterField id="f-resource" label="Resource" placeholder="e.g. users" value={draft.resource} onChange={(v) => setDraft({ ...draft, resource: v })} />
        <FilterField id="f-from" label="From" type="date" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} />
        <FilterField id="f-to" label="To" type="date" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} />
        <div className="flex gap-2">
          <Button type="submit">
            Filter
          </Button>
          <Button type="button" variant="outline" onClick={clear}>
            Clear
          </Button>
        </div>
      </form>

      <div className="overflow-hidden card-elevated rounded-2xl border border-line bg-surface-raised">
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>IP</TableHead>
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => {
              const status = statusOf(e.details);
              return (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDateTime(e.created_at)}</TableCell>
                  <TableCell className="text-sm">{e.user_email || <span className="font-mono text-xs">{e.user_id.slice(0, 8)}</span>}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">{e.action}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {e.resource}
                    {e.resource_id && <span className="ml-1 font-mono text-xs text-gray-mid">{e.resource_id.slice(0, 8)}</span>}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">
                    {status !== null ? (
                      <Pill tone={status >= 400 ? "red" : "green"}>{status >= 400 ? `Failed (${status})` : `OK (${status})`}</Pill>
                    ) : (
                      <span className="text-gray-mid" title={e.details}>
                        {e.details || "-"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-mid">{e.ip_address || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ListState
          loading={log.loading && !log.data}
          error={log.error}
          empty={!log.loading && !log.error && items.length === 0}
          emptyText="No entries match these filters."
        />
      </div>

      {log.data && <Pager page={log.data.page} limit={log.data.limit} total={log.data.total} onChange={setPage} />}
    </div>
  );
}

function FilterField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-10 text-sm" />
    </div>
  );
}
