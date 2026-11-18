# M01 Profiles and countries

**Depends on:** nothing. **Needed by:** membership (M03), communities, posts, culture.

## What it is
Right now a member is only a name and an email address. This feature gives every member a profile, so
people can see who they are dealing with, and gives the platform one shared list of countries.

## What it should do

**A profile for every member**
- Each member has a profile with: a display name, a short bio, a photo, the country they are from, the
  country they live in now, and the languages they speak.
- A profile exists for every member automatically. Nobody has to create one, and not having filled it in
  never stops anyone from signing in or using the platform.
- Members can edit their own profile at any time, and only their own.

**Profile photo**
- A member can add, replace or remove their photo.
- Only ordinary image files are accepted (JPEG, PNG, WebP) and there is a size limit (5 MB). Anything else
  is refused with a clear message, even if someone tries to get around the form.
- Where there is no photo, the member's initials are shown instead.

**Who can see a profile**
- By default a profile can be seen by other signed-in members. A member can switch their profile to
  private, and then nobody else can see it.
- What other members see: display name, photo, bio, countries and languages. They never see the email
  address, member ID, role, or anything about account activity.
- Visitors who are not signed in cannot see profiles.

**The country list**
- The platform has one fixed, standard list of countries (name and international code), available to
  everything that needs it: profiles now, and country pages and communities later.
- Members and admins cannot edit the list. It is loaded automatically and stays the same after restarts.
- Where a long list has to be picked from, it is searchable.

## Rules that must always hold
- A member can change only their own profile.
- A private profile is invisible to everyone else, including when someone guesses the address.
- Private details (email, member ID, role) never appear on a profile, however it is viewed.
- Photos live in file storage, not in the database, and uploads are checked by the server, not only by
  the browser.

## Done when
- [ ] A member can fill in and change every profile field, and see the change straight away
- [ ] A photo can be added, replaced and removed; wrong file types and oversized files are refused
- [ ] Another signed-in member can view a public profile, and gets "not found" for a private one
- [ ] A signed-out visitor cannot see any profile
- [ ] No private detail is visible on a profile
- [ ] The country list is available, complete and unchanged after a restart
- [ ] The rules above are covered by automated tests

## Not part of this feature
Cover images, follower counts, verified badges, and the membership card (see M03).
