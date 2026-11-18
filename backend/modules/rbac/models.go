package rbac

import "errors"

// PermissionDTO is one entry of the permission catalogue.
type PermissionDTO struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

// RoleDTO is a role with its permission codes and how many users hold it.
type RoleDTO struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description string   `json:"description"`
	IsSystem    bool     `json:"is_system"`
	Permissions []string `json:"permissions"` // permission codes
	UserCount   int64    `json:"user_count"`
}

// CreateRoleRequest creates a custom role. Slug is optional (derived from the name).
type CreateRoleRequest struct {
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// UpdateRoleRequest edits a custom role. Omitted fields are left unchanged. The slug never changes.
type UpdateRoleRequest struct {
	Name        *string   `json:"name"`
	Description *string   `json:"description"`
	Permissions *[]string `json:"permissions"`
}

// Errors returned by the service; the handler maps them to HTTP responses.
var (
	ErrNotFound    = errors.New("role not found")
	ErrInvalidName = errors.New("role name is required (max 100 characters)")
	ErrInvalidSlug = errors.New("role slug must be 2-40 characters: lowercase letters, digits and underscores, starting with a letter")
	ErrSlugTaken   = errors.New("a role with this slug already exists")
	ErrUnknownPerm = errors.New("one or more permissions do not exist")
	ErrSystemRole  = errors.New("built-in roles cannot be changed")
	ErrRoleInUse   = errors.New("this role is assigned to users; reassign them first")
	ErrCannotGrant = errors.New("you cannot grant permissions you do not hold yourself")
)
