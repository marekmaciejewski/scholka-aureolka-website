I want to evaluate and, after I confirm the required choices, implement the “Cloudflare Access plus Cloudflare Worker” private-gallery solution for Scholka Aureolka.

Work only in the current git worktree. Read AGENTS.md completely before doing anything else, inspect the repository, and inspect the current gallery implementation before proposing changes.

Current project context:

- React, TypeScript and Vite static multi-page site hosted on GitHub Pages.
- Production: https://scholka.urszula-gdynia.pl/
- The production Vite base path must remain `/`.
- `/gallery/` currently calls the Google Drive API directly from the browser using:
    - `VITE_GOOGLE_API_KEY`
    - `VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID`
- Relevant code currently includes:
    - `src/pages/GalleryPage.tsx`
    - `src/components/Gallery.tsx`
    - Drive gallery functions and types in `src/core.ts`
    - gallery translations in `src/siteContent.ts`
    - `gallery/index.html`
- Existing album naming and UI behavior should be preserved where practical:
    - album folders: `YYYY-MM-DD - Polish title -- English title`
    - `[cover]` before an image extension selects an album cover
    - album links, lightbox, Polish/English text, light/dark themes
- The current Drive files have to be public. The objective is to make them private.
- I will not pay. Stay entirely within genuinely free service allowances.
- I can manually maintain the parent whitelist.
- Expected users may be close to the Cloudflare Access Free seat limit, so verify the current official limit and its exact seat behavior before recommending this solution.
- No secrets or private parent lists may be committed.

Target architecture:

- Public pages remain on GitHub Pages.
- Cloudflare Access authenticates parents through Google and applies a manually managed email whitelist.
- A Cloudflare Worker serves the protected gallery/API/media.
- The Worker authenticates separately to Google Drive using a Google service account.
- The Drive gallery folder is private and shared only with the service account.
- Parent Google or Drive tokens must never be forwarded to Drive.
- Every album, metadata, thumbnail, preview and original-file response must be protected. Protecting only the HTML page is insufficient.

Process requirements:

1. Inspect the repository and identify what can be reused and what must move behind the Worker.
2. Verify current official documentation for:
    - Cloudflare Access Free user/seat limits;
    - Workers Free request, CPU, subrequest and asset limits;
    - protecting a Worker with Access;
    - Google identity-provider configuration for Access;
    - Google service-account access to a private Drive folder;
    - Drive API listing and media retrieval.
3. Do not use third-party tutorials as authority where official documentation exists.
4. Explain the architecture and request flow in simple language.
5. Before coding, ask me only material questions and wait for answers. Do not guess. At minimum, establish:
    - the approximate maximum number of distinct parents;
    - whether I already have Cloudflare and Google Cloud projects;
    - whether the initial address should be `workers.dev` or a custom gallery subdomain;
    - whether Cloudflare currently controls the domain’s DNS;
    - whether the whole gallery UI should be hosted by the protected Worker or whether the existing GitHub Pages gallery should call a protected Worker API;
    - whether original downloads are required or only previews;
    - whether the current album naming and “achievements” special behavior must remain unchanged;
    - whether I have allowed and disallowed Google accounts for testing.
6. For the hosting choice, explain the security, CORS, authentication-redirect and maintenance consequences. Do not choose silently.
7. Clearly separate:
    - repository work you can perform;
    - commands I must run locally;
    - actions I must perform in Cloudflare;
    - actions I must perform in Google Cloud;
    - actions I must perform in Google Drive or Google Groups.
8. Give my physical actions one small step at a time and tell me what non-secret result to report. Pause when confirmation is necessary. Do not claim an external action succeeded merely because you documented it.
9. Never ask me to paste service-account private keys, OAuth secrets, Cloudflare tokens or parent email lists into chat. Explain how to store them with Worker secrets or other appropriate secure configuration.
10. Warn me before any screen asks for payment information. Do not enable a paid plan or usage-based billing. If a required capability is not free, stop and propose an alternative.
11. Implement a testable Worker project using current supported Cloudflare tooling, with:
    - protected album listing;
    - protected photo listing;
    - protected media delivery;
    - strict validation of requested Drive file IDs/folder membership;
    - no arbitrary Drive-file proxy;
    - safe error responses that do not expose credentials or Drive internals;
    - appropriate security headers;
    - bounded caching only if it cannot bypass authorization;
    - testable separation between Drive access and HTTP handlers.
12. Determine from current official guidance whether the Worker should independently validate the Cloudflare Access assertion. Explain and test the chosen approach.
13. Preserve the existing custom gallery UI where the agreed architecture permits it.
14. Do not make Drive files private until an allowed and denied account have been tested successfully against the replacement.
15. Add automated tests with mocked Google and Cloudflare boundaries. Tests must not require real parent accounts or real Drive credentials.
16. Run the relevant checks, including:
    - Worker unit/integration tests;
    - `npm run build`
    - `npm run lint`
    - `npm test`
    - relevant Playwright coverage where practical.
17. Add concise operational documentation covering:
    - architecture and trust boundaries;
    - free-tier limits and what happens when they are reached;
    - initial Cloudflare and Google setup;
    - secrets configuration;
    - adding/removing parents;
    - deploying and rolling back;
    - testing allowed and denied access;
    - moving Drive files from public to private safely.
18. Finish with:
    - code changed;
    - tests and results;
    - verified free-tier assumptions and source links;
    - steps I completed;
    - steps still requiring my physical action;
    - remaining risks and limitations.

Do not deploy, create external resources, alter DNS, publish a Worker, modify Access policies, share/unshare Drive folders, or change production configuration without explaining the exact action and receiving my confirmation.

___

The solution is technically viable on free tiers only if the total number of distinct Google identities remains within Cloudflare Access’s hard 50-seat limit. No code, configuration, DNS, cloud resources, or Drive permissions have been changed. The worktree is clean.

## Repository findings

The current gallery is entirely browser-to-Google-Drive:

- [GalleryPage.tsx](/C:/Users/mmaciejewski/dev/repo/scholka-cloudflare-with-worker/src/pages/GalleryPage.tsx) loads albums and photos with the browser API key.
- [Gallery.tsx](/C:/Users/mmaciejewski/dev/repo/scholka-cloudflare-with-worker/src/components/Gallery.tsx) displays Drive `thumbnailLink` URLs directly and refreshes them through additional browser API calls.
- [core.ts](/C:/Users/mmaciejewski/dev/repo/scholka-cloudflare-with-worker/src/core.ts) contains Drive listing, cover discovery, parsing, sorting, and URL helpers.
- [siteContent.ts](/C:/Users/mmaciejewski/dev/repo/scholka-cloudflare-with-worker/src/siteContent.ts) contains complete Polish/English gallery text.
- [gallery/index.html](/C:/Users/mmaciejewski/dev/repo/scholka-cloudflare-with-worker/gallery/index.html) is a normal Vite multipage entry.
- Unit tests already cover naming, covers, pagination, achievements, and error handling. Playwright covers navigation and lightbox layout.

Reusable unchanged or nearly unchanged:

- Album and lightbox UI, themes, responsive CSS, bilingual content.
- `YYYY-MM-DD - Polish -- English` parsing.
- `[cover]` behavior.
- Album/photo URL state.
- Achievements presentation and timeline.
- Loading and error UI.

Must move behind the Worker:

- Root-folder configuration.
- Drive OAuth authentication.
- Album and photo listing.
- Cover discovery.
- Thumbnail/preview retrieval and refresh.
- Original retrieval, if enabled.
- Drive error details.
- The hardcoded achievements Drive folder ID should no longer be shipped in the public bundle; it can become Worker configuration.

`VITE_GOOGLE_API_KEY` must remain because the public calendar, songs, and frequency functionality still uses it. Only the gallery’s use of that key and `VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID` would disappear from the public build.

Google explicitly says Drive `thumbnailLink` values are short-lived, require authenticated retrieval for private files, and are not intended for direct browser use because of CORS. Proxying them through the Worker is the documented direction. [Google Drive file resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)

## Free-tier feasibility

Cloudflare Access Free currently has a **50-user limit**. A successful Access authentication creates an active user consuming one seat. The same identity uses one seat regardless of devices, applications, or repeated logins. A seat remains occupied until manually removed or removed by optional inactivity expiration. Once all seats are occupied, further users are blocked; there is no free overage. Removing a seat alone does not prevent reauthentication if the Access allow policy still permits that email. [Cloudflare Zero Trust pricing](https://www.cloudflare.com/plans/zero-trust-services/), [Cloudflare seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/)

Cloudflare’s documentation says “any authentication event” consumes a seat but does not explicitly settle whether a Google-authenticated account that subsequently fails the email allowlist consumes one. I would plan conservatively and verify this with the denied test account while watching the seat dashboard.

Workers Free currently provides:

- 100,000 dynamic Worker requests per account per day, reset at midnight UTC.
- 10 ms CPU per HTTP invocation.
- 50 external subrequests per invocation.
- Six simultaneous outgoing connections.
- 128 MB memory.
- 3 MB compressed Worker bundle.
- 20,000 static assets per version, maximum 25 MiB each.
- Static-asset requests are free and unlimited; gallery API and media proxy requests are dynamic and count toward the daily 100,000.
- No enforced Worker response-body limit, although other cache/platform limits apply.

If the request quota is exhausted, protected traffic must fail closed; it must never bypass the Worker. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

Google Drive API standard use is currently available without additional cost, but Google’s August 2026 documentation says charges above new thresholds are planned later in 2026. We must therefore recheck this immediately before production, leave billing disabled, and configure conservative quota caps where available. I will stop if Google asks for payment details or requires billing. [Drive API usage limits](https://developers.google.com/workspace/drive/api/guides/limits)

## Proposed request flow

In simple terms:

1. A parent opens the protected gallery address.
2. Cloudflare Access asks Google to identify the parent.
3. Cloudflare checks the verified email against the manually maintained exact-email allowlist.
4. Only an allowed parent’s request reaches the Worker.
5. The Worker authenticates to Google separately as its service account. It never forwards the parent’s Google or Cloudflare credentials to Drive.
6. Before listing or serving anything, the Worker verifies that the requested album is directly inside the configured private gallery root.
7. Before serving media, it verifies that the file is an image directly inside that validated album.
8. The Worker fetches the private Drive content and streams it to the parent.

The browser receives only Worker URLs, never credentialed Drive URLs.

For authentication inside the Worker:

- Current Worker-level Access guidance says a directly invoked Worker can trust `ctx.access`; no extra JWT parsing is required, but the handler must deny requests when it is absent.
- General Access/hostname guidance says origins should validate the signed `Cf-Access-Jwt-Assertion`, including signature, issuer, audience, and expiry.
- There is an important current limitation: Workers Static Assets remain protected by Access, but their internal router does not propagate `ctx.access` to the user Worker.

Therefore, if the Worker hosts the Vite gallery using Static Assets, I propose independently verifying the Access JWT for dynamic API/media handlers. If it is an API-only Worker with direct Worker-level Access and no Static Assets router, I propose using and testing `ctx.access` as Cloudflare now recommends. We will never trust an email header or merely decode an unsigned token. [Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

## Hosting decision

| Consequence     | Whole gallery UI on protected Worker                                         | GitHub gallery calling protected API                                                                                                           |
|-----------------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Protection      | UI, assets, metadata, and media under one Access application                 | Public HTML/JS; only metadata and media are private                                                                                            |
| CORS            | None; everything is same-origin                                              | Exact-origin CORS, credentialed requests, and preflight handling required                                                                      |
| Login redirects | Normal top-level navigation triggers Access reliably                         | An API `fetch()` cannot reliably present the Access login; a separate top-level authentication bootstrap is needed                             |
| Cookies         | First-party at the protected gallery host                                    | `workers.dev` becomes cross-site from GitHub Pages and can be disrupted by third-party-cookie blocking, especially private browsing and Safari |
| Maintenance     | Second deployment target for the gallery UI, but simpler authentication code | UI remains in the GitHub deployment, but client authentication, session expiry, CORS, and redirects become substantially more complicated      |
| Best address    | Either `workers.dev` or a custom subdomain                                   | Strongly favors a same-site custom subdomain                                                                                                   |

Cloudflare documents the cross-origin Access-cookie limitations directly. [Cloudflare Access CORS guidance](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/)

My provisional preference is **the whole gallery UI on the protected Worker**, with public `/gallery/` becoming a safe link or redirect to it. That gives the fewest browser-dependent failure modes and makes it easiest to prove that every gallery resource is protected. This is only a recommendation; I will not choose it without your answer.

A `workers.dev` pilot is viable without DNS changes when the whole UI is on the Worker. A custom gallery subdomain is cleaner and branded. The normal free custom-domain route requires the relevant DNS zone or delegated subdomain to be controlled through Cloudflare.

## External responsibilities later

After your answers, repository work I can perform includes:

- Add a Wrangler-based TypeScript Worker project.
- Refactor the gallery client to use Worker endpoints.
- Separate Drive access, authorization, membership validation, and HTTP handlers.
- Add mocked Worker tests and adapt existing UI tests.
- Add security headers, safe errors, optional bounded caching, and operational documentation.
- Run build, lint, unit, Worker, and relevant Playwright checks.

Actions that will eventually require you physically:

- Locally: authenticate Wrangler and enter Worker secrets through interactive secret commands.
- Cloudflare: select the Free plans, configure Google as IdP, create the exact-email Access policy, and later protect the Worker.
- Google Cloud: create/select a project, enable Drive API, configure the Google OAuth client for Access, and create the dedicated service account.
- Google Drive: initially share the still-public gallery root with the service account as Viewer.
- Only after allowed and denied tests succeed: remove public Drive sharing.
- Google Groups are optional; an exact-email Cloudflare allowlist does not require one.

No secret, parent list, OAuth client secret, service-account private key, or Cloudflare token will enter the repository or chat.

## Decisions I need from you

Please answer these without including any email addresses, IDs, keys, or secrets:

1. Approximately how many distinct parent Google accounts might need access at maximum? Include two-parent households, choir staff, administrators, and test accounts—not just the number of families.

2. Do you already have:

    - A Cloudflare account?
    - A Cloudflare Zero Trust organization?
    - A Google Cloud project suitable for this gallery?
    - The Drive API enabled in any project?

3. For the initial test address, do you want:

    - A `workers.dev` address, or
    - A custom subdomain such as `gallery.urszula-gdynia.pl`?

4. Does Cloudflare currently control the authoritative DNS for `urszula-gdynia.pl`, or could the gallery subdomain be delegated to your Cloudflare account?

5. Which hosting model do you confirm:

    - Entire protected gallery UI on the Worker, or
    - Existing public GitHub Pages gallery calling a protected Worker API?

6. Do you require a dedicated original-file/download response, or only protected thumbnails and large lightbox previews? An authorized parent can still save a preview or take a screenshot; Access cannot prevent that.

7. Must the naming and achievements behavior remain exactly unchanged—including the current special achievements folder, featured first position, no photograph cover, and dated timeline—or may that special folder be identified differently?

8. Is the current gallery root located in an individual account’s **My Drive** or in a Google Workspace **Shared drive**?

9. Do you have two separate Google accounts available for testing—one intended to be allowed and one denied—and can you test them in separate browser profiles? Do not send their addresses.

Once you answer these, I’ll confirm whether the free-seat limit is safe and present the exact implementation choice before modifying the worktree.