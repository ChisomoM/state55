# M03 Membership and the digital card

**Depends on:** profiles (M01) and organizations, zones and areas (M02). **Needed by:** volunteering,
governance, elections, evaluations.

## What it is
Being a member is what allows someone to vote, volunteer and be counted. The membership card is the
visible proof: a card a member can show on their phone or print, and that anyone can check is genuine.
Today the member Home page only shows a picture of a card. This feature makes it real.

## What it should do

**Applying**
- A signed-in member whose email is verified and who has chosen where they belong (M02) can apply for
  membership.
- A member can have only one application or membership at a time. Applying twice does nothing new.
- The member can always see where their application stands.

**Approval**
- Authorised people review applications and approve or reject them. Rejecting needs a reason, and the
  member is told.
- Organization administrators decide for their own organization only. Staff with the right permission can
  decide for any.
- Approving a membership creates the card in the same step: there is never an approved member with no card.

**What a membership can be**
- *Pending*: applied, waiting for a decision.
- *Active*: approved, within its validity dates, card works.
- *Suspended*: temporarily not in good standing, card does not verify as valid.
- *Expired*: past its end date.
- *Revoked*: withdrawn by an administrator.
- The member is emailed when they are approved, rejected, suspended or revoked, and the email says what
  happens next.

**The digital card**
- The card shows the member's name, public member ID, organization, and the dates it is valid.
- It carries a QR code. Scanning it opens the public check described below.
- The card is digitally signed so that it cannot be altered or forged. (The blueprint specifies the ES256
  signature standard.) The signature can be verified by anyone using the platform's published public key.
- The card is never numbered in sequence, and nothing on it reveals the member's country or join date.

**Printable version**
- A member can ask for a printable PDF of their card. It is prepared in the background and ready shortly
  after. The member can download it, and old versions stop working when the card is revoked or replaced.
- The PDF is private to the member. Nobody else can download it.

**Public check**
- Anyone, signed in or not, can check a card by scanning its QR code or entering its reference.
- The result is one of: valid, expired, or revoked, together with the member's name and organization.
  Nothing else is shown: no email, no member ID, no dates, no place within the organization.
- The check always uses the current state, so a revoked or expired card fails immediately, even if the
  member still holds the QR code.
- Repeated rapid checks from one source are slowed down, to stop people harvesting names.

**Revoking and reinstating**
- Authorised people can revoke a membership, with a reason, and later reinstate it. Both take effect
  immediately for the public check, and both are recorded with who did it, when and why.

**Card expiry**
- Cards have an end date. After it, the card is shown as expired everywhere.

## Rules that must always hold
- The public check reveals only valid, expired or revoked, plus name and organization.
- The secret key used to sign cards is never stored in the code or the repository. The system refuses to
  start if it is missing or is a known default. The public key needed to verify cards is published.
- Members can see only their own card, application and PDF.
- Every approval, rejection, revocation, suspension and reinstatement is recorded in the audit log, in the
  same step as the change itself.
- A person is never both approved and without a card, or revoked and still valid.

## Done when
- [ ] A member who meets the conditions can apply, and can see their application status
- [ ] Approving and rejecting work for staff and for the relevant organization's administrators, and are refused elsewhere
- [ ] Approval creates a working card with a QR code; the member Home page shows the real card
- [ ] A card's signature verifies with the published key, and a tampered card does not
- [ ] The PDF can be requested and downloaded by the owner, and by nobody else
- [ ] The public check returns only the allowed information for valid, expired and revoked cards, with no sign-in
- [ ] Revoking or reinstating changes the public check immediately
- [ ] Members are emailed about decisions (and the emails respect the switch that turns email delivery off)
- [ ] The system will not start without a valid signing key
- [ ] The rules above are covered by automated tests

## Not part of this feature
Paid membership tiers and payments (a later phase), digital wallet passes, and a scanner inside the
mobile app.
