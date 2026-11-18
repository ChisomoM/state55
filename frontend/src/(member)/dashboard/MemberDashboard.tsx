import { Link } from "react-router-dom";
import { ArrowRight, Hourglass } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { WeaveBand } from "@/components/brand/WeaveBand";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/lib/context/useAuth";

/** A member's home inside the app. Everything here comes from their own account. */
export default function MemberDashboard() {
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Member";

  return (
    <div className="space-y-[18px]">
      <PageHeader
        eyebrow="Home"
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Your membership and account at a glance."
      />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* Membership card */}
        <div
          className="relative flex aspect-[85.6/54] w-full max-w-md flex-col justify-between overflow-hidden rounded-2xl bg-earth p-5 text-ivory shadow-3"
          aria-label="Membership card"
        >
          <Wordmark size={16} tone="inverse" band={false} />
          <div className="pb-4">
            <p className="font-display text-2xl font-extrabold leading-tight">{name}</p>
            <p className="mt-1 font-mono text-sm tracking-wider text-[#C9B8A6]">
              {user?.memberId ?? "Assigned when your email is verified"}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <WeaveBand height={20} />
          </div>
        </div>

        {/* Account summary */}
        <SectionCard
          title="Your account"
          action={
            <Link
              to="/account"
              className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-info underline-offset-4 hover:underline"
            >
              Manage <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        >
          <dl className="divide-y divide-line text-sm">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-muted">Email</dt>
              <dd className="min-w-0 truncate font-semibold text-ink">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-muted">Email status</dt>
              <dd>
                <StatusBadge status={user?.emailVerified ? "verified" : "pending"} label={user?.emailVerified ? "Verified" : "Not verified"} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-muted">Member ID</dt>
              <dd className="font-mono text-xs font-semibold tabular-nums text-ink">{user?.memberId ?? "Not assigned yet"}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Communities, events and voting">
        <EmptyState
          icon={<Hourglass size={22} aria-hidden="true" />}
          title="These open soon"
          description="Communities, events and member voting will appear here as they launch. We will email you when they do."
        />
      </SectionCard>
    </div>
  );
}
