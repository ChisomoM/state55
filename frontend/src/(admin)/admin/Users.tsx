import { useEffect, useState } from "react";
import { Label } from "@radix-ui/react-label";
import { Loader2, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ListState, PageHeader, Pager, Pill } from "@/components/admin/AdminUI";
import { FormError } from "@/components/auth/AuthShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { rolesApi, usersApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/context/useAuth";
import { displayName, formatDate } from "@/lib/format";
import type { AdminUser, Role } from "@/types/admin";

const PAGE_SIZE = 15;
const ALL = "all"; // Radix Select items cannot have an empty value

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

export function UsersPage() {
  const { user: me, hasPermission } = useAuth();
  const canInvite = hasPermission("users.create");
  const canEdit = hasPermission("users.update");
  const canDelete = hasPermission("users.delete");
  const canSeeRoles = hasPermission("roles.read");

  // Filters. `search` is what the user types; `q` is the debounced value sent to the server.
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const users = useApi(
    () =>
      usersApi.list({
        page,
        limit: PAGE_SIZE,
        q,
        role: role === ALL ? "" : role,
        status: status === ALL ? "" : (status as "active" | "inactive"),
      }),
    [page, q, role, status]
  );

  // Roles are needed for the filter and the role pickers, but only users with roles.read can load them.
  const roles = useApi<Role[]>(() => (canSeeRoles ? rolesApi.list() : Promise.resolve([])), [canSeeRoles]);
  const roleOptions = roles.data ?? [];
  const roleName = (slug: string) => roleOptions.find((r) => r.slug === slug)?.name ?? slug;

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const items = users.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with an account. Invite people, change roles, and deactivate accounts."
        actions={
          canInvite && (
            <Button onClick={() => setInviting(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite user
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        {canSeeRoles && (
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 sm:w-48">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              {roleOptions.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 sm:w-40">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden card-elevated rounded-2xl border border-line bg-surface-raised">
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Joined</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium text-charcoal">{displayName(u)}</div>
                  <div className="text-xs text-gray-mid">{u.email}</div>
                </TableCell>
                <TableCell>{roleName(u.role_slug)}</TableCell>
                <TableCell>
                  {!u.is_active ? (
                    <Pill tone="red">Inactive</Pill>
                  ) : !u.email_verified ? (
                    <Pill tone="amber">Invited</Pill>
                  ) : (
                    <Pill tone="green">Active</Pill>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{u.member_id || "-"}</TableCell>
                <TableCell className="text-sm text-gray-mid">{formatDate(u.created_at)}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label={`Edit ${u.email}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && u.id !== me?.id && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(u)} aria-label={`Delete ${u.email}`}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ListState
          loading={users.loading && !users.data}
          error={users.error}
          empty={!users.loading && !users.error && items.length === 0}
          emptyText="No users match these filters."
        />
      </div>

      {users.data && (
        <Pager page={users.data.page} limit={users.data.limit} total={users.data.total} onChange={setPage} />
      )}

      <InviteDialog
        open={inviting}
        roles={roleOptions}
        onClose={() => setInviting(false)}
        onDone={() => {
          setInviting(false);
          users.reload();
        }}
      />

      <EditDialog
        user={editing}
        isSelf={editing?.id === me?.id}
        roles={roleOptions}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          users.reload();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && displayName(deleting)} ({deleting?.email}) will lose access immediately and their
              email address becomes free to use again. Their past activity stays in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:opacity-90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await usersApi.remove(deleting.id);
                  toast.success("User deleted");
                  users.reload();
                } catch (err) {
                  toast.error(errorMessage(err));
                } finally {
                  setDeleting(null);
                }
              }}
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Invite ---------------------------------------------------------------------------------

function InviteDialog({
  open,
  roles,
  onClose,
  onDone,
}: {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleSlug, setRoleSlug] = useState("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start with a clean form every time the dialog opens.
  useEffect(() => {
    if (open) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setRoleSlug("user");
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await usersApi.create({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role_slug: roleSlug,
      });
      toast.success(`Invitation sent to ${email.trim()}`);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              They get an email with a link to set their password. The link works for 7 days.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Field id="invite-first" label="First name" value={firstName} onChange={setFirstName} disabled={busy} />
            <Field id="invite-last" label="Last name" value={lastName} onChange={setLastName} disabled={busy} />
          </div>
          <Field id="invite-email" label="Email" type="email" value={email} onChange={setEmail} disabled={busy} required />
          <RolePicker id="invite-role" roles={roles} value={roleSlug} onChange={setRoleSlug} disabled={busy} />

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !email}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit -----------------------------------------------------------------------------------

function EditDialog({
  user,
  isSelf,
  roles,
  onClose,
  onDone,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  roles: Role[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleSlug, setRoleSlug] = useState("user");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setRoleSlug(user.role_slug);
      setActive(user.is_active);
      setError(null);
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);

    // Send only what changed, so an untouched field can never be rejected by a rule about it.
    const changes: Partial<{ first_name: string; last_name: string; role_slug: string; is_active: boolean }> = {};
    if (firstName.trim() !== user.first_name) changes.first_name = firstName.trim();
    if (lastName.trim() !== user.last_name) changes.last_name = lastName.trim();
    if (roleSlug !== user.role_slug) changes.role_slug = roleSlug;
    if (active !== user.is_active) changes.is_active = active;

    try {
      if (Object.keys(changes).length > 0) {
        await usersApi.update(user.id, changes);
        toast.success("User updated");
      }
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>{user?.email}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Field id="edit-first" label="First name" value={firstName} onChange={setFirstName} disabled={busy} />
            <Field id="edit-last" label="Last name" value={lastName} onChange={setLastName} disabled={busy} />
          </div>

          <RolePicker
            id="edit-role"
            roles={roles}
            value={roleSlug}
            onChange={setRoleSlug}
            disabled={busy || isSelf || roles.length === 0}
            // Keep the current role selectable even if the role list could not be loaded.
            currentSlug={user?.role_slug}
          />

          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div>
              <Label htmlFor="edit-active" className="text-sm font-semibold text-ink">
                Account active
              </Label>
              <p className="text-xs text-gray-mid">Inactive users cannot sign in or use the API.</p>
            </div>
            <Switch id="edit-active" checked={active} onCheckedChange={setActive} disabled={busy || isSelf} />
          </div>
          {isSelf && (
            <p className="text-xs text-gray-mid">You cannot change your own role or deactivate yourself.</p>
          )}

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Shared form bits -----------------------------------------------------------------------

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="h-10 text-sm"
      />
    </div>
  );
}

function RolePicker({
  id,
  roles,
  value,
  onChange,
  disabled,
  currentSlug,
}: {
  id: string;
  roles: Role[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  currentSlug?: string;
}) {
  // If roles could not be loaded (no roles.read), offer only what we know: the default role,
  // plus the user's current role when editing.
  const options =
    roles.length > 0
      ? roles.map((r) => ({ slug: r.slug, name: r.name }))
      : [{ slug: "user", name: "Member" }, ...(currentSlug && currentSlug !== "user" ? [{ slug: currentSlug, name: currentSlug }] : [])];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-ink">
        Role
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.slug} value={o.slug}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
