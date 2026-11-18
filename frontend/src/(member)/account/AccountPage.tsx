import { useState } from "react";
import { Label } from "@radix-ui/react-label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormError } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { ListState } from "@/components/admin/AdminUI";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/use-api";
import { notificationsApi, usersApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/context/useAuth";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

/** Self-service settings for any signed-in member. */
export default function AccountPage() {
  return (
    <div className="max-w-3xl space-y-[18px]">
      <PageHeader eyebrow="Account" title="My account" subtitle="Your profile, password and email settings." className="mb-0" />
      <ProfileCard />
      <PasswordCard />
      <NotificationsCard />
    </div>
  );
}

// --- Profile --------------------------------------------------------------------------------

function ProfileCard() {
  const { user, refreshMe } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = firstName.trim() !== (user?.firstName ?? "") || lastName.trim() !== (user?.lastName ?? "");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await usersApi.updateMe({ first_name: firstName.trim(), last_name: lastName.trim() });
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your email address and member ID cannot be changed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput id="acc-first" label="First name" value={firstName} onChange={setFirstName} disabled={busy} />
            <LabeledInput id="acc-last" label="Last name" value={lastName} onChange={setLastName} disabled={busy} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput id="acc-email" label="Email" value={user?.email ?? ""} disabled readOnly />
            <LabeledInput id="acc-member" label="Member ID" value={user?.memberId ?? "Assigned when your email is verified"} disabled readOnly mono />
          </div>
          <FormError message={error} />
          <Button type="submit" disabled={busy || !dirty}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Password -------------------------------------------------------------------------------

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (next.length < 8 || next.length > 72) {
      setError("New password must be between 8 and 72 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await usersApi.changePassword(current, next);
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <PasswordField id="pw-current" label="Current password" value={current} onChange={setCurrent} disabled={busy} />
          <PasswordField id="pw-new" label="New password" value={next} onChange={setNext} disabled={busy} autoComplete="new-password" placeholder="8 to 72 characters" />
          <PasswordField id="pw-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} disabled={busy} autoComplete="new-password" placeholder="Repeat the new password" />
          <FormError message={error} />
          <Button type="submit" disabled={busy || !current || !next}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Email notifications --------------------------------------------------------------------

function NotificationsCard() {
  const prefs = useApi(() => notificationsApi.get(), []);
  const [saving, setSaving] = useState<string | null>(null);
  // Local overrides so a switch responds instantly while the save is in flight.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const toggle = async (category: string, enabled: boolean) => {
    setOverrides((o) => ({ ...o, [category]: enabled }));
    setSaving(category);
    try {
      await notificationsApi.update([{ category, email_enabled: enabled }]);
    } catch (err) {
      // Put the switch back to what the server has.
      setOverrides((o) => Object.fromEntries(Object.entries(o).filter(([key]) => key !== category)));
      toast.error(errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
        <CardDescription>Choose which emails you want. Security and account emails are always sent.</CardDescription>
      </CardHeader>
      <CardContent>
        <ListState loading={prefs.loading && !prefs.data} error={prefs.error} empty={false} />
        <ul className="divide-y divide-line">
          {prefs.data?.map((p) => (
            <li key={p.category} className="flex items-center justify-between gap-4 py-3">
              <div>
                <Label htmlFor={`pref-${p.category}`} className="text-sm font-semibold text-ink">
                  {p.label}
                </Label>
                <p className="text-sm text-ink-muted">{p.description}</p>
              </div>
              <Switch
                id={`pref-${p.category}`}
                checked={p.mandatory ? true : (overrides[p.category] ?? p.email_enabled)}
                disabled={p.mandatory || saving === p.category}
                onCheckedChange={(v) => toggle(p.category, v)}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- Shared ---------------------------------------------------------------------------------

function LabeledInput({
  id,
  label,
  value,
  onChange,
  disabled,
  readOnly,
  mono,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className={mono ? "font-mono" : ""}
      />
    </div>
  );
}
