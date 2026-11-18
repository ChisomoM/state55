import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Label } from "@radix-ui/react-label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, AuthShell, FormError, FormNotice } from "@/components/auth/AuthShell";

type Status = "verifying" | "verified" | "failed";

/** Landing page for the link in the verification email: /verify-email?token=... */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "failed");
  const [error, setError] = useState<string | null>(
    token ? null : "This verification link is missing its token."
  );

  // Tokens are single-use. React StrictMode runs effects twice in development, which would
  // consume the token on the first call and report a failure on the second, so call only once.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Verification failed.");
        setStatus("failed");
      });
  }, [token]);

  return (
    <AuthShell>
      {status === "verifying" && (
        <AuthCard title="Verifying your email">
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-ink-muted" aria-label="Verifying" />
          </div>
        </AuthCard>
      )}

      {status === "verified" && (
        <AuthCard title="Email verified" subtitle="Your address is confirmed and your member ID is ready.">
          <div className="flex justify-center py-2">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Continue to sign in</Link>
          </Button>
        </AuthCard>
      )}

      {status === "failed" && (
        <AuthCard title="Verification failed">
          <FormError message={error} />
          <ResendForm />
          <p className="text-center text-sm text-ink-muted">
            <Link to="/login" className="inline-flex h-11 items-center font-semibold text-info underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </AuthCard>
      )}
    </AuthShell>
  );
}

/** Lets the user request a fresh verification email when their link expired or was already used. */
function ResendForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.resendVerification(email.trim());
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <FormNotice>If that account needs verifying, a new email is on its way.</FormNotice>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="resend-email" className="text-sm font-semibold text-ink">
          Send me a new link
        </Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
      </div>
      <Button type="submit" variant="outline" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend verification email"}
      </Button>
    </form>
  );
}
