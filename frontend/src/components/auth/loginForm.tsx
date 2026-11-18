import { useState } from "react";
import { Link } from "react-router-dom";
import { Label } from "@radix-ui/react-label";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/crud";
import { useAuth } from "@/lib/context/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AuthCard, FormError } from "./AuthShell";
import { PasswordField } from "./PasswordField";

interface LoginFormProps {
  onSignUpClick: () => void;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "We could not complete that. Check your connection and try again.";

export const LoginForm: React.FC<LoginFormProps> = ({ onSignUpClick }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setBusy(true);
    setError(null);
    setNeedsVerification(false);
    try {
      // On success the auth context redirects to the user's landing page.
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setNeedsVerification(true);
      }
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    try {
      await authApi.resendVerification(email);
      toast.success("If your account needs it, a new verification email is on its way.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Use the email you joined with.">
      <form onSubmit={handleCredentials} className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-semibold text-ink">
            Email address
          </Label>
          <Input
            placeholder="name@example.com"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy}
          />
        </div>

        <PasswordField id="password" label="Password" value={password} onChange={setPassword} disabled={busy} />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="inline-flex h-11 items-center text-sm font-semibold text-info underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <FormError message={error} />
        {needsVerification && (
          <button
            type="button"
            onClick={resendVerification}
            className="inline-flex h-11 items-center text-sm font-semibold text-info underline-offset-4 hover:underline"
          >
            Resend verification email
          </button>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        <span>New to Motherland?</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" onClick={onSignUpClick} className="w-full">
          <UserPlus aria-hidden="true" />
          Create an account
        </Button>
        <p className="text-sm text-ink-muted">You will confirm your email address first.</p>
      </div>
    </AuthCard>
  );
};
