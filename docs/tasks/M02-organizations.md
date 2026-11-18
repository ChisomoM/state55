# M02 Organizations, zones and areas

**Depends on:** nothing. **Needed by:** membership (M03), documents, volunteering, governance.

**Words we use:** an **organization** contains **zones**, and a zone contains **areas**. (The blueprint
calls these constituencies and wards. Use zone and area everywhere, in code and in what people read.)

## What it is
Membership, documents, volunteering, offices and elections all belong somewhere. This feature defines
"where". It records the structure of the movement and lets each member say where they belong. Other
features ask this one "which organization, zone and area is this member in?".

## What it should do

**The structure**
- Administrators can set up organizations. Organizations can sit inside other organizations (for example
  a region inside a state), so they form a tree.
- Each organization has a name, a type (such as state, region, branch or chapter) and a short description,
  and can be switched off without being deleted.
- Each organization can have zones, and each zone can have areas. An area always belongs to exactly one zone.
- Administrators can create, edit and deactivate all of these.
- Something cannot be deleted while anything depends on it: an organization with sub-organizations, zones
  or members, or a zone that still has areas. The administrator is told what is blocking the deletion.

**Who runs what**
- Staff with the right permission can manage any part of the structure.
- A person can also be appointed administrator of one particular organization. They can manage that
  organization and everything beneath it, and nothing else.
- Appointing and removing organization administrators is itself restricted to staff, and every change is
  recorded.

**Where a member belongs**
- Each member chooses the organization, zone and area they belong to. A member belongs to one place at a time.
- A member can change where they belong. Every change is kept as history: what it was, what it became,
  who changed it and when.
- Members only see active organizations when choosing. The zone must be one of the chosen organization's
  zones, and the area must be one of the chosen zone's areas.
- Administrators can see which members belong to an organization they run, without being shown personal
  details they do not need.
- Other features can ask where a member belongs and who administers an organization.

## Rules that must always hold
- The tree can never loop (an organization cannot end up inside itself) and has a maximum depth.
- Where a member belongs is sensitive personal information. It is never shown to other members or to the
  public, only to the member and to administrators of that member's organization.
- An organization administrator can never reach outside their own organization.
- Nothing that other records point to is ever permanently deleted.
- Every administrative change is recorded in the audit log.

## Done when
- [ ] Organizations, zones and areas can be created, edited, deactivated, and blocked from deletion when in use
- [ ] The tree cannot loop or grow past its maximum depth
- [ ] An organization administrator can manage their own organization and below, and is refused anywhere else
- [ ] A member can choose and change where they belong, and each change is kept in history
- [ ] Invalid combinations (a zone from another organization, an area from another zone) are refused
- [ ] Where a member belongs is not visible to other members or the public
- [ ] Other features can look up a member's place and an organization's administrators
- [ ] All administrative changes appear in the audit log, and the rules above are covered by automated tests

## Not part of this feature
Maps and boundaries, bulk import of structure, and approving membership (see M03).
