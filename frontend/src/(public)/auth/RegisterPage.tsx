import { useState } from "react";
import { Link } from "react-router-dom";
import { Label } from "@radix-ui/react-label";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/context/useAuth";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, AuthShell, FormError } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

export default function RegisterPage() {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await authApi.register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      if (res?.verification_sent === false) {
        // The account is already verified (the server skips verification emails), so sign in and
        // go straight to the dashboard. login() navigates to the right landing page.
        await login(email.trim(), password);
        return;
      }
      setRegistered(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendVerification(email.trim());
      toast.success("If the account needs it, a new verification email is on its way.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (registered) {
    return (
      <AuthShell>
        <AuthCard title="Check your email" subtitle={`We sent a verification link to ${email.trim()}.`}>
          <div className="flex flex-col items-center gap-3 py-2">
            <MailCheck className="h-10 w-10 text-success" aria-hidden="true" />
            <p className="text-center text-sm text-ink-muted">
              Open the link to confirm your address. You can sign in once it is verified. The link
              expires in 24 hours.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={resend}>
            Resend verification email
          </Button>
          <p className="text-center text-sm text-ink-muted">
            <Link to="/login" className="inline-flex h-11 items-center font-semibold text-info underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard title="Create your account" subtitle="Join the community.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name" className="text-sm font-semibold text-ink">
                First name
              </Label>
              <Input
                id="first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name" className="text-sm font-semibold text-ink">
                Last name
              </Label>
              <Input
                id="last_name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-ink">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            placeholder="8 to 72 characters"
            value={password}
            onChange={setPassword}
            disabled={busy}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm"
            label="Confirm password"
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="inline-flex h-11 items-center font-semibold text-info underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
