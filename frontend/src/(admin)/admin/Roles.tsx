import { useEffect, useMemo, useState } from "react";
import { Label } from "@radix-ui/react-label";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ListState, PageHeader, Pill } from "@/components/admin/AdminUI";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { rolesApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/context/useAuth";
import type { Permission, Role } from "@/types/admin";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

export function RolesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("roles.create");
  const canUpdate = hasPermission("roles.update");
  const canDelete = hasPermission("roles.delete");

  const roles = useApi(() => rolesApi.list(), []);
  const permissions = useApi(() => rolesApi.permissions(), []);

  // `null` = closed, `"new"` = creating, a Role = editing (or viewing, for built-in roles).
  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const items = roles.data ?? [];

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="A role is a named set of permissions. Built-in roles are fixed; create custom roles for everything else."
        actions={
          canCreate && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="mr-2 h-4 w-4" />
              New role
            </Button>
          )
        }
      />

      <div className="overflow-hidden card-elevated rounded-2xl border border-line bg-surface-raised">
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium text-charcoal">{r.name}</div>
                  <div className="text-xs text-gray-mid">{r.description || r.slug}</div>
                </TableCell>
                <TableCell>{r.is_system ? <Pill tone="blue">Built-in</Pill> : <Pill tone="gray">Custom</Pill>}</TableCell>
                <TableCell>{r.slug === "super_admin" ? "All (bypasses checks)" : r.permissions.length}</TableCell>
                <TableCell>{r.user_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(r)}
                      aria-label={`${r.is_system || !canUpdate ? "View" : "Edit"} ${r.name}`}
                    >
                      {r.is_system || !canUpdate ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    {canDelete && !r.is_system && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(r)}
                        disabled={r.user_count > 0}
                        title={r.user_count > 0 ? "Reassign this role's users first" : undefined}
                        aria-label={`Delete ${r.name}`}
                      >
                        <Trash2 className={`h-4 w-4 ${r.user_count > 0 ? "text-line-strong" : "text-danger"}`} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ListState loading={roles.loading && !roles.data} error={roles.error} empty={!roles.loading && !roles.error && items.length === 0} />
      </div>

      <RoleDialog
        target={editing}
        permissions={permissions.data ?? []}
        canManage={editing === "new" ? canCreate : canUpdate}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          roles.reload();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the "{deleting?.name}" role?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. No users currently hold this role.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:opacity-90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await rolesApi.remove(deleting.id);
                  toast.success("Role deleted");
                  roles.reload();
                } catch (err) {
                  toast.error(errorMessage(err));
                } finally {
                  setDeleting(null);
                }
              }}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleDialog({
  target,
  permissions,
  canManage,
  onClose,
  onDone,
}: {
  target: Role | "new" | null;
  permissions: Permission[];
  canManage: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { permissions: mine } = useAuth();

  const isNew = target === "new";
  const role = target && target !== "new" ? target : null;
  // Built-in roles are fixed, and people without the matching roles permission can only look.
  const readOnly = !canManage || !!role?.is_system;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target === null) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    // super_admin is stored with no explicit permission rows; show it as "everything".
    setSelected(new Set(role?.slug === "super_admin" ? permissions.map((p) => p.code) : (role?.permissions ?? [])));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Group permissions by category for display.
  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      map.set(p.category, [...(map.get(p.category) ?? []), p]);
    }
    return [...map.entries()];
  }, [permissions]);

  // You can only hand out permissions you hold yourself (the server enforces this too).
  const canGrant = (code: string) => mine.includes(code);

  const toggle = (code: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const codes = [...selected];
      if (isNew) {
        await rolesApi.create({ name: name.trim(), description: description.trim(), permissions: codes });
        toast.success("Role created");
      } else if (role) {
        await rolesApi.update(role.id, { name: name.trim(), description: description.trim(), permissions: codes });
        toast.success("Role updated");
      }
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isNew ? "New role" : readOnly ? role?.name : `Edit ${role?.name}`}</DialogTitle>
            <DialogDescription>
              {role?.is_system
                ? "Built-in roles cannot be changed."
                : "Changes apply to everyone with this role immediately."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="role-name" className="text-sm font-semibold text-ink">
              Name
            </Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy || readOnly}
              required
              maxLength={100}
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc" className="text-sm font-semibold text-ink">
              Description
            </Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy || readOnly}
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-ink">Permissions</Label>
            {groups.map(([category, perms]) => (
              <fieldset key={category} className="rounded-xl border border-line p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-mid">{category}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {perms.map((p) => {
                    const grantable = !readOnly && canGrant(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`flex items-start gap-2 text-sm ${grantable ? "cursor-pointer" : "opacity-60"}`}
                        title={!readOnly && !grantable ? "You cannot grant a permission you do not hold" : undefined}
                      >
                        <Checkbox
                          checked={selected.has(p.code)}
                          onCheckedChange={(v) => toggle(p.code, v === true)}
                          disabled={busy || !grantable}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-charcoal">{p.code}</span>
                          <span className="block text-xs text-gray-mid">{p.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={busy || !name.trim()}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? "Create role" : "Save changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
