import type { ReactNode } from "react";
import { CircleCheck, Globe, IdCard, TriangleAlert, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/brand/Wordmark";
import { WeaveBand } from "@/components/brand/WeaveBand";
import { TileMosaic } from "@/components/brand/TileMosaic";

/** Two-column layout shared by every auth screen: form on the left, brand panel on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <WeaveBand variant="thread" />
      <div className="flex min-h-[calc(100vh-6px)] flex-col lg:flex-row">
        <main id="main" className="flex w-full flex-1 flex-col justify-center px-5 py-10 md:px-8 lg:w-1/2 lg:px-12">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>

        {/* Brand panel: Earth ground, one mosaic bleeding off the top right, faded under the text */}
        <aside
          aria-label="About Motherland"
          className="section-dark relative hidden overflow-hidden lg:flex lg:w-1/2"
        >
          <TileMosaic cols={6} rows={9} className="absolute -right-12 -top-8 w-[72%] max-w-[560px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#1E1410_30%,rgba(30,20,16,.6)_62%,rgba(30,20,16,.05))]" />

          <div className="relative z-10 mt-auto flex w-full flex-col gap-8 p-10 xl:p-14">
            <div className="space-y-4">
              <p className="label !text-[#C9B8A6]">Pan-African digital community</p>
              <h2 className="font-display text-5xl font-extrabold leading-[1] tracking-[-0.02em] text-ivory">
                One Africa.
                <br />
                <span className="text-accent">One home.</span>
              </h2>
              <p className="max-w-md text-lg text-[#C9B8A6]">
                Sign in to connect, contribute and belong, on the continent or abroad.
              </p>
            </div>

            <ul className="grid gap-4 border-t border-[#3A2C23] pt-6">
              <Highlight icon={<Globe size={20} aria-hidden="true" />} title="Culture and heritage" text="Stories and traditions from across the continent" />
              <Highlight icon={<Users size={20} aria-hidden="true" />} title="Community" text="Connect with your people, wherever you are" />
              <Highlight icon={<IdCard size={20} aria-hidden="true" />} title="Membership and voice" text="A verifiable membership and a say in our future" />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Highlight({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#3D2C10] text-[#F0C46E]">{icon}</div>
      <div>
        <h3 className="!font-sans text-base font-semibold text-ivory">{title}</h3>
        <p className="text-sm text-[#C9B8A6]">{text}</p>
      </div>
    </li>
  );
}

/** Raised card with the thread band, the wordmark, a title and an optional subtitle. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-card">
      <WeaveBand variant="thread" />
      <div className="space-y-5 p-6 md:p-8">
        <div className="space-y-4">
          <Link to="/" aria-label="Motherland home" className="inline-block">
            <Wordmark size={26} />
          </Link>
          {title && <h1 className="font-display text-2xl font-extrabold leading-tight text-ink md:text-[28px]">{title}</h1>}
          {subtitle && <p className="text-ink-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Inline error banner. Icon plus words, never colour alone. Renders nothing when there is no message. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
      <TriangleAlert size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/** Inline success / info banner. */
export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl bg-success-soft p-3 text-sm text-success">
      <CircleCheck size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
