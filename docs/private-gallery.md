# Private gallery operations

## Architecture

- The public GitHub Pages site keeps `/gallery/` as two clearly separated cards: public **Achievements** and the private parent gallery.
- The public application calls Google Drive only for the fixed, child-free Achievements folder. That folder and its photo identifiers are public by design.
- The application does not request or contain identifiers for Drive folders holding child photographs.
- `VITE_PRIVATE_GALLERY_URL` supplies the restricted Google Site URL at build time. The URL is not a secret and is visible to visitors.
- The Google Site is **Restricted** and the private gallery Google Group has the **Published Viewer** role.
- The Drive gallery root is **Restricted** and the same Group has the **Viewer** role. Albums inherit access from that root.
- The Google Site contains bilingual album cards. Each card opens its matching private Drive folder.
- The public Achievements folder is kept outside the private gallery root so permission inheritance cannot accidentally make child albums public or Achievements private.

Never put parent account addresses, the Group address, credentials, tokens, or private identifiers in the repository.

## Add or remove a parent

Manage membership only in Google Groups. Add the parent's Google Account as a Member with no email subscription when practical. Remove the member from the Group to revoke both Site and Drive access. Do not separately grant parent accounts direct access unless there is a documented exception.

After a membership change, allow time for Google permissions to propagate and test with that account. Keep the Group invitation-only and restrict member-list visibility and membership management to its owner.

## Add an album

1. In the restricted Drive gallery root, create a subfolder using `YYYY-MM-DD - Polish title -- English title`.
2. Confirm the new folder inherits **Viewer** access for the gallery Group and has no public or link-wide access.
3. Upload the approved photographs.
4. In Google Sites, duplicate an existing album card.
5. Replace its date, Polish and English title, manually selected cover, and Drive-folder link.
6. Preview desktop and mobile layouts, then publish the Site update.
7. Test the card with an allowed account. Adding more photos to an existing folder needs no Site change.

The legacy `[cover]` filename suffix may remain as an editorial convention, but Google Sites does not process it automatically.

## Add a public achievement

Only diplomas, awards, trophies, and other material with no child photographs belong in the public Achievements folder. Name an image `YYYY-MM-DD - Polish title -- English title.ext`; the public timeline groups and labels it automatically. Before uploading, inspect the entire image for children, names, signatures, or other personal information that should not be public. No React or Google Sites change is needed.

## Test access

Use separate browser profiles so account state cannot leak between tests.

1. With an allowed Group member, open the public `/gallery/` page, the restricted Site, an album folder, and a photo.
2. With a Google Account outside the Group, open the same Site and album URLs. Both must deny access or request permission.
3. Recheck the Site is **Restricted** with the Group as **Published Viewer**.
4. Recheck the private Drive root is **Restricted** with the Group as **Viewer**. Audit child album folders and files for any separately granted public or broader permission.
5. In a signed-out window, confirm Achievements still opens while every child-photo folder remains denied.

## Safe cutover and rollback

Before changing the production Drive gallery from public to restricted, deploy and verify both landing-page cards and confirm the restricted Site works for an allowed parent. Move the Achievements folder outside the private gallery root without recreating it so its stable folder ID and links remain valid, and verify it is still intentionally public. Then restrict the child-photo root, grant the Group Viewer access, audit inherited and direct permissions, and repeat allowed/denied tests.

If the private path fails after cutover, keep Drive private. Show the landing page's unavailable state by removing `VITE_PRIVATE_GALLERY_URL`, or correct the Site/Group permissions. Restoring public Drive visibility is a privacy-impacting last resort and must not be used as the routine rollback.

## Privacy limitation

Access control limits who Google allows to open the gallery. It cannot prevent an approved viewer from downloading a permitted file, taking a screenshot, photographing the screen, or redistributing a copy. Parent approval and clear handling expectations remain necessary.

Achievements is deliberately public: anyone can view, download, index, or redistribute its files. Treat every upload to that folder as public publication and never place a child photograph or private document there.
