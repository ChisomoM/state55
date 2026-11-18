package models

// PermissionDef describes one permission in the catalogue. The catalogue is seeded into every
// tenant's permissions table at startup (see db.SeedDefaultRoles). Add new permissions here as
// modules are built; they are picked up on the next start.
//
// Naming rule (enforced by a test):
//
//	<thing>[.<part>[.<part>]].<create|read|update|delete>      users.read, org.zone.create
//
// Only those four verbs exist. There is no "manage", "view", "approve" or "open". When a finer
// permission is needed, name the thing being acted on instead of inventing a verb:
//
//	org.zone.create               create a zone
//	membership.approval.create    approve a membership (an approval record is created)
//	election.open.create          open an election (an opening approval is created)
//
// Categories are the module name and group permissions in the roles screen.
type PermissionDef struct {
	Code        string // see the naming rule above
	Category    string
	Description string
}

// RoleDef describes a built-in (system) role.
type RoleDef struct {
	Slug        string
	Name        string
	Description string
	AllPerms    bool // true: holds every permission in the catalogue
}

// Slugs of built-in roles.
const (
	RoleSuperAdmin = "super_admin"
	RoleAdmin      = "admin"
	RoleUser       = "user"
)

// DefaultPermissions is the Phase 1 permission catalogue.
var DefaultPermissions = []PermissionDef{
	{"admin.console.read", "admin", "Open the admin console"},

	{"users.create", "users", "Invite and create users"},
	{"users.read", "users", "View users"},
	{"users.update", "users", "Edit users, change their role, activate or deactivate them"},
	{"users.delete", "users", "Delete users"},

	{"roles.create", "roles", "Create roles"},
	{"roles.read", "roles", "View roles and permissions"},
	{"roles.update", "roles", "Edit roles and their permissions"},
	{"roles.delete", "roles", "Delete roles"},

	{"audit.read", "audit", "View the audit log"},
	{"email_log.read", "notifications", "View the email delivery log"},

	{"org.create", "organizations", "Create organizations"},
	{"org.read", "organizations", "View organizations in the admin console"},
	{"org.update", "organizations", "Edit organizations"},
	{"org.delete", "organizations", "Delete organizations"},
	{"org.zone.create", "organizations", "Create zones"},
	{"org.zone.read", "organizations", "View zones in the admin console"},
	{"org.zone.update", "organizations", "Edit zones"},
	{"org.zone.delete", "organizations", "Delete zones"},
	{"org.area.create", "organizations", "Create areas"},
	{"org.area.read", "organizations", "View areas in the admin console"},
	{"org.area.update", "organizations", "Edit areas"},
	{"org.area.delete", "organizations", "Delete areas"},
	{"org.admin.create", "organizations", "Appoint organization admins"},
	{"org.admin.read", "organizations", "View organization admins"},
	{"org.admin.delete", "organizations", "Remove organization admins"},

	{"membership.read", "membership", "View memberships and cards"},
	{"membership.approval.create", "membership", "Approve membership applications"},
	{"membership.revocation.create", "membership", "Revoke memberships and cards"},
	{"membership.revocation.delete", "membership", "Reinstate revoked memberships"},

	{"community.update", "communities", "Edit any community"},
	{"community.delete", "communities", "Close any community"},

	{"event.create", "events", "Create events"},
	{"event.read", "events", "View events in the admin console"},
	{"event.update", "events", "Edit any event"},
	{"event.delete", "events", "Delete any event"},

	{"document.create", "documents", "Upload documents"},
	{"document.read", "documents", "View the document catalogue in the admin console"},
	{"document.update", "documents", "Edit documents and publish new versions"},
	{"document.delete", "documents", "Remove documents"},

	{"volunteering.review.create", "volunteering", "Approve or reject logged volunteer hours"},

	{"evaluation.period.create", "evaluations", "Create evaluation periods"},
	{"evaluation.period.read", "evaluations", "View evaluation periods and results"},
	{"evaluation.period.update", "evaluations", "Edit, open, close and publish evaluation periods"},
	{"evaluation.period.delete", "evaluations", "Delete evaluation periods"},

	{"governance.office.create", "governance", "Create offices"},
	{"governance.office.read", "governance", "View offices in the admin console"},
	{"governance.office.update", "governance", "Edit offices"},
	{"governance.office.delete", "governance", "Delete offices"},
	{"governance.nomination.update", "governance", "Approve or reject nominations"},
	{"governance.certificate.create", "governance", "Issue adoption certificates"},
	{"governance.certificate.read", "governance", "View adoption certificates"},
	{"governance.certificate.delete", "governance", "Revoke adoption certificates"},

	{"election.create", "governance", "Create elections"},
	{"election.read", "governance", "View elections and their log in the admin console"},
	{"election.update", "governance", "Edit elections that have not opened"},
	{"election.delete", "governance", "Cancel elections that have not opened"},
	{"election.open.create", "governance", "Approve opening voting"},
	{"election.close.create", "governance", "Approve closing voting"},
	{"election.certify.create", "governance", "Approve certifying results"},
}

// LegacyPermissionRenames maps an old permission code to the code or codes that replace it.
// db.SeedDefaultRoles applies it once per tenant on start: every role and per-user override that
// held the old code receives all of the new ones, then the old code is removed. Existing databases
// therefore keep working after the rename. Never reuse an old code for something new.
var LegacyPermissionRenames = map[string][]string{
	"admin.access":       {"admin.console.read"},
	"users.view":         {"users.read"},
	"roles.view":         {"roles.read"},
	"roles.manage":       {"roles.create", "roles.update", "roles.delete"},
	"audit.view":         {"audit.read"},
	"notifications.view": {"email_log.read"},
	"organizations.manage": {
		"org.create", "org.read", "org.update", "org.delete",
		"org.zone.create", "org.zone.read", "org.zone.update", "org.zone.delete",
		"org.area.create", "org.area.read", "org.area.update", "org.area.delete",
		"org.admin.create", "org.admin.read", "org.admin.delete",
	},
	"membership.view":     {"membership.read"},
	"membership.approve":  {"membership.approval.create"},
	"membership.revoke":   {"membership.revocation.create", "membership.revocation.delete"},
	"communities.manage":  {"community.update", "community.delete"},
	"events.manage":       {"event.create", "event.read", "event.update", "event.delete"},
	"documents.manage":    {"document.create", "document.read", "document.update", "document.delete"},
	"volunteering.review": {"volunteering.review.create"},
	"evaluations.manage": {
		"evaluation.period.create", "evaluation.period.read",
		"evaluation.period.update", "evaluation.period.delete",
	},
	"governance.manage": {
		"governance.office.create", "governance.office.read", "governance.office.update", "governance.office.delete",
		"governance.nomination.update",
		"governance.certificate.create", "governance.certificate.read", "governance.certificate.delete",
		"election.read", "election.update", "election.delete",
	},
	"election.open":    {"election.open.create"},
	"election.close":   {"election.close.create"},
	"election.certify": {"election.certify.create"},
}

// DefaultRoles are the built-in roles. They cannot be edited or deleted.
//
//   - super_admin: bypasses permission checks; the only role that can manage other super admins.
//   - admin: holds every permission in the catalogue, but cannot touch super admins.
//   - user: the default role for registered members; holds no admin permissions.
var DefaultRoles = []RoleDef{
	{Slug: RoleSuperAdmin, Name: "Super Admin", Description: "Full access. Can manage other super admins.", AllPerms: true},
	{Slug: RoleAdmin, Name: "Admin", Description: "Every permission, except managing super admins.", AllPerms: true},
	{Slug: RoleUser, Name: "Member", Description: "Default role for registered members."},
}
