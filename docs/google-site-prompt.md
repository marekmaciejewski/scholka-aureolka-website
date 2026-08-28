I want to evaluate and, after I confirm the required choices, implement the “restricted Google Site” solution for the Scholka Aureolka private gallery.

Work only in the current git worktree. Read AGENTS.md completely before doing anything else, inspect the repository, and inspect the current gallery implementation before proposing changes.

Current project context:

- React, TypeScript and Vite static multi-page site hosted on GitHub Pages.
- Production: https://scholka.urszula-gdynia.pl/
- The production Vite base path must remain `/`.
- `/gallery/` currently uses browser-side Google Drive API calls.
- Relevant code currently includes:
    - `src/pages/GalleryPage.tsx`
    - `src/components/Gallery.tsx`
    - Google Drive gallery functions and types in `src/core.ts`
    - gallery translations in `src/siteContent.ts`
    - `gallery/index.html`
- Current gallery albums are Google Drive subfolders named:
  `YYYY-MM-DD - Polish title -- English title`
- A photo whose filename ends with `[cover]` before its extension is used as the album cover.
- The current Drive integration requires files to be public. The objective is to make all child photographs private.
- Polish and English public UI must remain complete.
- This is a parent coordination site, not a promotional/recruitment site.
- I will not pay for this solution. Only functionality genuinely available at no monetary cost is acceptable.
- I can manually maintain a whitelist of parent Google accounts.
- Do not add contact forms, email addresses or phone numbers.
- Do not commit credentials, account identifiers that should remain private, tokens, or secrets.

Target solution:

- Keep the main website public on GitHub Pages.
- Put the actual private gallery in a restricted Google Site.
- Restrict the Google Site to explicitly approved Google accounts or a Google Group.
- Keep the underlying Google Drive folders private and ensure their sharing settings agree with the Site’s viewer list.
- The public website should no longer retrieve or expose Drive gallery files directly.
- It may provide a bilingual parent-facing landing page or link to the private Google Site, but do not decide that presentation without asking me.

Process requirements:

1. Inspect the existing code and report exactly how the current gallery is connected.
2. Check current official Google Sites and Google Drive documentation. Do not rely on remembered UI labels, limits or behavior.
3. Explain the proposed end state in simple language.
4. Before changing code, ask me only the questions whose answers materially affect the result. Do not guess. At minimum, establish:
    - whether I will whitelist individual Google accounts or use a Google Group;
    - whether I already have a suitable Google Site;
    - whether I want `/gallery/` to show a public bilingual explanation and button, or redirect elsewhere;
    - whether the private Site should reproduce albums manually or primarily expose embedded Drive folders;
    - whether I have an allowed and a disallowed Google account available for testing.
5. Explicitly separate:
    - work you can perform in the repository;
    - physical actions I must perform in Google Sites, Google Drive or Google Groups.
6. For every physical action, give me current step-by-step instructions, including what result I should report back. Pause when you need my confirmation; do not pretend that an external setting has been changed.
7. Do not make the Drive files private until we have confirmed that the replacement path works for an allowed parent. Plan the migration so the live gallery is not accidentally lost or exposed.
8. Never request that I paste credentials or private parent email lists into chat. Tell me where to enter them securely.
9. If any part requires a paid Google Workspace feature, identify it before implementation and propose a genuinely free alternative instead.
10. Implement the agreed repository changes, including Polish and English text and relevant tests.
11. Remove only gallery-specific public Drive configuration that is no longer required. Do not break the API key’s other uses such as Calendar or Sheets.
12. Verify proportionately with:
    - `npm run build`
    - `npm run lint`
    - `npm test`
    - relevant Playwright tests if the changed UI requires them.
13. Update concise operational documentation with:
    - the final architecture;
    - how to add or remove a parent;
    - how to add an album;
    - how to test allowed and denied access;
    - how to roll back safely.
14. Finish with:
    - repository changes made;
    - checks executed and results;
    - external actions completed by me;
    - external actions still outstanding;
    - privacy limitations, especially that approved parents can still download or screenshot photos.

Do not deploy, change DNS, change Drive visibility, publish a Google Site, or make other external mutations without first explaining the exact action and obtaining my confirmation.

___

The gallery cards now use the standard flat card style: regular surface, 5px accent border, 8px corners, and soft shadow. No card gradients remain. Lint, eight focused tests, and live layout verification pass.

Because the Site contains only the pilot, prepare the real album cards next—but do not publish yet.

1. Open the existing gallery root in Google Drive.
2. Ignore the **Achievements** folder; it remains on the public website.
3. For the newest child-photo album:
    - Note its bilingual folder name.
    - Right-click the folder and select **Share → Copy link**.
    - Do not change **General access** or any permissions.
    - Identify the photo whose filename ends with `[cover]`.
4. Open the Google Site editor.
5. Duplicate the pilot album section using its **Duplicate section** control—the icon with two overlapping rectangles.
6. In the duplicate:
    - Replace the title with the album’s Polish title followed by its English title.
    - Keep the date visible.
    - Replace the image with the `[cover]` photo. If needed, use **Insert → Images → Drive**.
    - Select the album button, choose **Edit**, use the label `Otwórz album / Open album`, and paste the Drive folder link.
7. Repeat for every child-photo album, preferably newest first.
8. Use **Preview** to check desktop and mobile layouts and open every album link.
9. Do **not** click **Publish** yet.

Google notes that restricted Drive content remains visible only to viewers who also have access, which is why the Site and Drive will later use the same Group. [Google Sites file instructions](https://support.google.com/sites/answer/90569?hl=en)

Expected result: the draft contains all real child-photo albums, while the currently published Site and Drive permissions remain unchanged.

Report only: **draft has _N_ real album cards; preview links work**. Do not paste album links or filenames here.