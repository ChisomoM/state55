import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MailWarning, ScrollText, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { KpiTile } from "@/components/shared/KpiTile";
import { SectionBody } from "@/components/shared/SectionBody";
import { SampleDataBadge } from "@/components/shared/SampleDataBadge";
import { AreaChart, BarList, ColumnChart, SegmentedBar } from "@/components/shared/charts";
import { useApi } from "@/hooks/use-api";
import { auditApi, emailLogApi, rolesApi, usersApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/context/useAuth";
import { formatDateTime } from "@/lib/format";
import type { AuditEntry } from "@/types/admin";

const ACTIVITY_DAYS = 14;
const ACTIVITY_SAMPLE = 100; // the audit API returns at most 100 rows per page

/** Counts audit entries per local calendar day for the last `days` days, oldest first. */
function activityByDay(items: AuditEntry[], days: number) {
  const buckets: { key: string; label: string; value: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    buckets.push({
      key: d.toDateString(),
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      value: 0,
    });
  }
  for (const e of items) {
    const bucket = buckets.find((b) => b.key === new Date(e.created_at).toDateString());
    if (bucket) bucket.value += 1;
  }
  return buckets;
}

/**
 * Admin home. Every number comes from the API, and each block is shown only if the signed-in
 * user holds the permission for that data (the backend would refuse it otherwise).
 * The "Membership overview" block at the bottom is the one exception: it is clearly marked sample data.
 */
export function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  const canUsers = hasPermission("users.read");
  const canRoles = hasPermission("roles.read");
  const canAudit = hasPermission("audit.read");
  const canEmail = hasPermission("email_log.read");

  const users = useApi(() => (canUsers ? usersApi.list({ limit: 1 }) : Promise.resolve(null)), [canUsers]);
  const inactive = useApi(() => (canUsers ? usersApi.list({ limit: 1, status: "inactive" }) : Promise.resolve(null)), [canUsers]);
  const roles = useApi(() => (canRoles ? rolesApi.list() : Promise.resolve(null)), [canRoles]);
  const audit = useApi(() => (canAudit ? auditApi.list({ limit: ACTIVITY_SAMPLE }) : Promise.resolve(null)), [canAudit]);
  const emails = useApi(async () => {
    if (!canEmail) return null;
    const [sent, queued, failed, skipped] = await Promise.all(
      ["sent", "queued", "failed", "skipped"].map((status) => emailLogApi.list({ limit: 1, status })),
    );
    return { sent: sent.total, queued: queued.total, failed: failed.total, skipped: skipped.total };
  }, [canEmail]);

  const daily = useMemo(() => activityByDay(audit.data?.items ?? [], ACTIVITY_DAYS), [audit.data]);
  const dailyTotal = daily.reduce((sum, d) => sum + d.value, 0);
  const recent = audit.data?.items.slice(0, 8) ?? [];
  const roleBars = [...(roles.data ?? [])]
    .sort((a, b) => b.user_count - a.user_count)
    .map((r) => ({ label: r.name, value: r.user_count, note: r.is_system ? "built in" : "custom" }));

  const failed = emails.data?.failed ?? 0;
  const hasAnyData = canUsers || canRoles || canAudit || canEmail;

  return (
    <div className="space-y-[18px]">
      <PageHeader
        eyebrow="Admin"
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="A snapshot of the platform. What you see here depends on your permissions."
      />

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {canUsers && (
          <Link to="/admin/users" className="block rounded-2xl">
            <KpiTile
              label="Users"
              icon={<Users size={18} />}
              tone="brand"
              value={users.data?.total ?? 0}
              isLoading={users.loading && !users.data}
              caption={inactive.data ? `${inactive.data.total} inactive` : undefined}
            />
          </Link>
        )}
        {canRoles && (
          <Link to="/admin/roles" className="block rounded-2xl">
            <KpiTile
              label="Roles"
              icon={<ShieldCheck size={18} />}
              tone="success"
              value={roles.data?.length ?? 0}
              isLoading={roles.loading && !roles.data}
              caption={roles.data ? `${roles.data.filter((r) => !r.is_system).length} custom` : undefined}
            />
          </Link>
        )}
        {canEmail && (
          <Link to="/admin/email-log" className="block rounded-2xl">
            <KpiTile
              label="Emails sent"
              icon={<Mail size={18} />}
              tone="info"
              value={emails.data?.sent ?? 0}
              isLoading={emails.loading && !emails.data}
              caption={emails.data ? `${emails.data.queued} waiting to send` : undefined}
            />
          </Link>
        )}
        {canEmail && (
          <Link to="/admin/email-log" className="block rounded-2xl">
            <KpiTile
              label="Needs attention"
              icon={<MailWarning size={18} />}
              tone={failed > 0 ? "danger" : "accent"}
              value={failed}
              isLoading={emails.loading && !emails.data}
              caption={failed > 0 ? "Failed emails are retried automatically" : "No failed emails"}
            />
          </Link>
        )}
      </div>

      {/* Trends */}
      {(canAudit || canRoles) && (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.7fr_1fr]">
          {canAudit && (
            <SectionCard
              title="Admin activity"
              subtitle={`Recorded actions per day, last ${ACTIVITY_DAYS} days (from the latest ${ACTIVITY_SAMPLE} records)`}
            >
              <SectionBody
                isLoading={audit.loading && !audit.data}
                error={audit.error}
                onRetry={audit.reload}
                isEmpty={(audit.data?.items.length ?? 0) === 0}
                emptyText="No activity recorded yet."
                skeletonClassName="h-48 w-full"
              >
                <ColumnChart
                  data={daily}
                  ariaLabel={`Recorded actions per day over the last ${ACTIVITY_DAYS} days. ${dailyTotal} actions in total.`}
                  className="pt-5"
                />
              </SectionBody>
            </SectionCard>
          )}

          {canRoles && (
            <SectionCard title="Users by role" subtitle="How many people hold each role">
              <SectionBody
                isLoading={roles.loading && !roles.data}
                error={roles.error}
                onRetry={roles.reload}
                isEmpty={roleBars.length === 0}
                emptyText="No roles yet."
                skeletonClassName="h-48 w-full"
              >
                <BarList data={roleBars} />
              </SectionBody>
            </SectionCard>
          )}
        </div>
      )}

      {/* Email delivery and recent activity */}
      {(canEmail || canAudit) && (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.4fr]">
          {canEmail && (
            <SectionCard
              title="Email delivery"
              subtitle="Every email the platform has queued"
              action={
                <Link
                  to="/admin/email-log"
                  className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-info underline-offset-4 hover:underline"
                >
                  Open log <ArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              <SectionBody
                isLoading={emails.loading && !emails.data}
                error={emails.error}
                onRetry={emails.reload}
                skeletonClassName="h-32 w-full"
              >
                {emails.data && (
                  <SegmentedBar
                    data={[
                      { label: "Sent", value: emails.data.sent, colour: "bg-success" },
                      { label: "Waiting", value: emails.data.queued, colour: "bg-accent" },
                      { label: "Failed", value: emails.data.failed, colour: "bg-danger" },
                      { label: "Skipped", value: emails.data.skipped, colour: "bg-line-strong" },
                    ]}
                  />
                )}
              </SectionBody>
            </SectionCard>
          )}

          {canAudit && (
            <SectionCard
              title="Recent activity"
              subtitle="The last 8 recorded actions"
              action={
                <Link
                  to="/admin/audit"
                  className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-info underline-offset-4 hover:underline"
                >
                  View all <ArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              <SectionBody
                isLoading={audit.loading && !audit.data}
                error={audit.error}
                onRetry={audit.reload}
                isEmpty={recent.length === 0}
                emptyText="No activity recorded yet."
                skeletonClassName="h-48 w-full"
              >
                <ul className="divide-y divide-line">
                  {recent.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted">
                          <ScrollText size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 truncate">
                          <span className="font-semibold text-ink">{e.user_email || e.user_id.slice(0, 8)}</span>
                          <span className="text-ink-muted">
                            {" "}
                            {e.action} {e.resource}
                          </span>
                        </span>
                      </span>
                      <span className="hidden flex-shrink-0 font-mono text-xs text-ink-muted sm:block">
                        {formatDateTime(e.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionBody>
            </SectionCard>
          )}
        </div>
      )}

      {/* Placeholder: not real data. */}
      <MembershipPreview />

      {!hasAnyData && (
        <p className="text-sm text-ink-muted">
          Your role can open the admin console but has no data permissions yet. Ask an administrator to grant some.
        </p>
      )}
    </div>
  );
}

// Illustrative figures for features that are not built yet (membership, communities, elections).
// They are constants on purpose: nothing here is read from the system.
const SAMPLE_GROWTH = [120, 128, 141, 150, 149, 163, 180, 195, 207, 226, 241, 258];
const SAMPLE_TILES = [
  { label: "Members", value: "1,284" },
  { label: "Communities", value: "36" },
  { label: "Open elections", value: "2" },
];

function MembershipPreview() {
  return (
    <SectionCard
      title="Membership overview"
      subtitle="A preview of what appears here once membership, communities and elections are live. Not real data."
      action={<SampleDataBadge />}
      className="border-dashed"
    >
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.7fr]">
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {SAMPLE_TILES.map((t) => (
            <div key={t.label} className="rounded-xl bg-surface-sunken px-4 py-3">
              <p className="label">{t.label}</p>
              <p className="mt-1 font-display text-display-xs font-bold tabular-nums text-ink-muted">{t.value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="label mb-3">Member growth, last 12 months</p>
          <AreaChart
            values={SAMPLE_GROWTH}
            labels={["12 months ago", "This month"]}
            ariaLabel="Sample chart: member growth over twelve months. Illustrative only."
          />
        </div>
      </div>
    </SectionCard>
  );
}
