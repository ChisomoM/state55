import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ListState, PageHeader, Pager, Pill } from "@/components/admin/AdminUI";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { emailLogApi } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";
import type { EmailStatus } from "@/types/admin";

const PAGE_SIZE = 25;
const ALL = "all";

const STATUS_LABEL: Record<EmailStatus, { text: string; tone: "green" | "amber" | "red" | "gray" }> = {
  sent: { text: "Sent", tone: "green" },
  queued: { text: "Queued", tone: "amber" },
  failed: { text: "Retrying", tone: "red" },
  skipped: { text: "Skipped", tone: "gray" },
};

export function EmailLogPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const log = useApi(
    () => emailLogApi.list({ page, limit: PAGE_SIZE, q, status: status === ALL ? "" : status }),
    [page, q, status]
  );
  const items = log.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Email log"
        description="Every email the platform tries to send. A failed email is retried automatically until it goes through."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
          <Input
            placeholder="Search by recipient or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 sm:w-48">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="failed">Retrying / failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden card-elevated rounded-2xl border border-line bg-surface-raised">
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>When</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((m) => {
              const label = STATUS_LABEL[m.status] ?? { text: m.status, tone: "gray" as const };
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDateTime(m.created_at)}</TableCell>
                  <TableCell className="text-sm">{m.to_email}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm" title={m.subject}>
                    {m.subject}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{m.category || "-"}</TableCell>
                  <TableCell>
                    <Pill tone={label.tone}>{label.text}</Pill>
                    {m.attempts > 1 && <span className="ml-2 text-xs text-gray-mid">{m.attempts} attempts</span>}
                    {m.error && m.status !== "sent" && (
                      <div className="mt-1 max-w-xs truncate text-xs text-danger" title={m.error}>
                        {m.error}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ListState
          loading={log.loading && !log.data}
          error={log.error}
          empty={!log.loading && !log.error && items.length === 0}
          emptyText="No emails match these filters."
        />
      </div>

      {log.data && <Pager page={log.data.page} limit={log.data.limit} total={log.data.total} onChange={setPage} />}
    </div>
  );
}
