import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/crud";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthShell, FormError, FormNotice } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";

/** Landing page for the link in the reset email: /reset-password?token=... */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_token") {
        setLinkInvalid(true);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <AuthCard title="Password updated">
          <FormNotice>Your password has been changed. You can sign in with it now.</FormNotice>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Continue to sign in</Link>
          </Button>
        </AuthCard>
      </AuthShell>
    );
  }

  if (linkInvalid) {
    return (
      <AuthShell>
        <AuthCard title="Link expired">
          <FormError message="This password reset link is invalid, has expired, or was already used." />
          <Button asChild size="lg" className="w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard title="Choose a new password">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="password"
            label="New password"
            placeholder="8 to 72 characters"
            value={password}
            onChange={setPassword}
            disabled={busy}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm"
            label="Confirm new password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={setConfirm}
            disabled={busy}
            autoComplete="new-password"
          />

          <FormError message={error} />

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
