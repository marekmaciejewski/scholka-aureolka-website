I want to evaluate and, after I confirm the required choices, implement the “Cloudflare Worker with our own Google login, but without Cloudflare Access” private-gallery solution for Scholka Aureolka.

Work only in the current git worktree. Read AGENTS.md completely before doing anything else, inspect the repository, and inspect the current gallery implementation before proposing changes.

Current project context:

- React, TypeScript and Vite static multi-page site hosted on GitHub Pages.
- Production: https://scholka.urszula-gdynia.pl/
- The production Vite base path must remain `/`.
- `/gallery/` currently calls public Google Drive files directly from the browser.
- Relevant implementation currently includes:
    - `src/pages/GalleryPage.tsx`
    - `src/components/Gallery.tsx`
    - Google Drive gallery functions and types in `src/core.ts`
    - gallery translations in `src/siteContent.ts`
    - `gallery/index.html`
- Current album conventions:
    - folder: `YYYY-MM-DD - Polish title -- English title`
    - filename marker `[cover]` selects an album cover
- Preserve album links, lightbox behavior, Polish/English completeness and light/dark themes where practical.
- The gallery mostly contains photographs of children, so every photo response must require authorization.
- I will not pay. Only genuinely free services and quotas may be used.
- I can maintain the parent whitelist manually.
- This option is intended to avoid Cloudflare Access’s 50-active-seat cap.
- Google login is for proving the parent’s identity only.
- Parents must never authorize Drive access.
- The Worker accesses private Drive files using a separate Google service account.
- Do not commit credentials or a private parent-email list.

Target request flow:

1. The parent visits the protected gallery origin.
2. The gallery offers “Sign in with Google.”
3. Google returns an identity credential for the configured web client.
4. The Worker securely verifies the credential and its claims.
5. The Worker checks the verified email against our whitelist.
6. The Worker creates a short-lived secure session.
7. Every gallery API and media request validates the session and whitelist.
8. The Worker separately authenticates to Drive using its service account.
9. The private Drive folder is shared only with that service account.

Process requirements:

1. Inspect the current repository and explain exactly what would change.
2. Consult current official documentation for:
    - Google Identity Services for web;
    - server-side ID-token validation;
    - OAuth consent/branding requirements for basic `openid`, `email` and `profile` identity scopes;
    - Cloudflare Workers Free limits and current supported tooling;
    - secure cookies and Worker Web Crypto support;
    - Google service-account access to Drive;
    - Drive file listing and media download.
3. Confirm that basic Google identity login remains free and identify any current publication or verification requirements. Do not assume old Google OAuth behavior still applies.
4. Before coding, ask me the material questions and wait. Do not guess. At minimum, establish:
    - whether I already have a Google Cloud project;
    - whether I already have a Cloudflare account;
    - whether the gallery UI will be served from the Worker or remain on GitHub Pages and call it cross-origin;
    - whether the initial address will be `workers.dev` or a custom subdomain;
    - whether Cloudflare controls the domain’s DNS;
    - how I want to maintain the whitelist: encrypted Worker secret/config, KV, D1, or another free option;
    - expected number of parents;
    - desired session lifetime;
    - whether original downloads are required;
    - whether immediate access revocation is required;
    - whether I have allowed and disallowed Google accounts available for testing.
5. Explain the consequences of each choice in plain language. Do not select a whitelist store, session scheme, origin arrangement or domain arrangement silently.
6. Explicitly separate:
    - code changes you can make;
    - commands I need to execute;
    - Google Cloud/OAuth actions requiring my browser;
    - Cloudflare dashboard actions requiring my browser;
    - Google Drive sharing changes requiring my browser.
7. Give physical setup instructions one small step at a time. Tell me which values are safe to report back and which must remain secret. Pause when confirmation is required.
8. Never ask me to paste an OAuth secret, service-account private key, Worker secret, Cloudflare token or real whitelist into chat.
9. Do not enable a paid Cloudflare plan or usage-based billing. Warn me before any action that could create charges.
10. Design authentication as security-sensitive code. At minimum:
    - verify the Google token signature against current Google public keys;
    - validate audience, issuer, expiry and issued-at claims;
    - require a verified email where Google provides that assurance;
    - reject tokens for any other OAuth client;
    - avoid treating an unverified client-supplied email as identity;
    - use secure, HttpOnly and appropriate SameSite session cookies;
    - protect login/logout/session endpoints against CSRF and login-CSRF where applicable;
    - define session expiry and key rotation;
    - ensure removing an email from the whitelist actually revokes access within the agreed time;
    - prevent open redirects;
    - apply appropriate CSP and other security headers;
    - avoid leaking authentication details in errors or logs.
11. Do not use Google’s token-info endpoint on every media request. Verify the login credential correctly once, then use the agreed secure session mechanism.
12. Protect every API and media endpoint. Do not rely on hiding the React page.
13. Restrict Drive access so the Worker can serve only files contained within the configured gallery folder tree. It must not become a generic authenticated Drive proxy.
14. Keep the service-account credential and session-signing keys only in Worker secrets.
15. Provide local development and tests without requiring production credentials:
    - mock Google identity verification;
    - mock Drive token exchange and Drive API;
    - test allowed, denied, expired, malformed and removed users;
    - test unauthorized direct media requests;
    - test attempts to request Drive files outside the gallery tree;
    - test logout and session expiry.
16. Preserve the existing gallery experience where compatible with the chosen hosting arrangement.
17. Do not make Drive files private until both allowed and denied end-to-end tests succeed.
18. Run relevant verification:
    - Worker tests;
    - `npm run build`
    - `npm run lint`
    - `npm test`
    - relevant Playwright tests.
19. Document:
    - architecture and trust boundaries;
    - all Google and Cloudflare setup steps;
    - authorized origins and redirect configuration;
    - secret configuration;
    - whitelist maintenance;
    - session revocation and key rotation;
    - free-tier limits;
    - deployment and rollback;
    - safely changing Drive files from public to private.
20. Finish by reporting:
    - implementation changes;
    - tests and results;
    - current official free-tier assumptions with source links;
    - physical steps I completed;
    - steps still outstanding;
    - security and privacy limitations.

Do not deploy, create external resources, change DNS, publish OAuth configuration, alter Drive sharing, or modify production settings without first explaining the exact action and receiving my confirmation.

___

The solution is feasible on free tiers, without Cloudflare Access and without parents granting Drive access. I inspected the clean `worker-only` worktree, current gallery implementation, tests, Vite/GitHub Pages configuration, and current official documentation. No files or external settings were changed.

## Current implementation

The present gallery has no private server boundary:

- [GalleryPage.tsx](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/pages/GalleryPage.tsx:206) reads the public Drive configuration and fetches albums/photos from the browser.
- [core.ts](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/core.ts:1223) calls `drive/v3/files` with the public Vite API key.
- [Gallery.tsx](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/components/Gallery.tsx:478) places Google thumbnail URLs directly in `<img>` elements and refreshes them from Drive.
- Album slugs and `?album=...&photo=...` navigation are client-side and can be preserved.
- Folder date/title parsing, bilingual titles, `[cover]`, achievements presentation, lightbox, retries, themes, and responsive layout are all reusable.
- [pages.yml](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/.github/workflows/pages.yml:35) currently supplies the gallery folder ID to the public static build.
- [vite.config.ts](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/vite.config.ts:9) correctly uses `base: '/'`; that will remain unchanged.
- Existing unit and Playwright coverage already exercises album navigation, query links, the lightbox, retries, achievements, and responsive behavior.

Private Drive files cannot use the present approach. Google states that private `thumbnailLink` values are short-lived, require credentialed requests, and should be proxied rather than used directly in a web app. The Worker must therefore proxy thumbnail and media bytes after authorization. [Google Drive file resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)

## Proposed security boundary

The core flow would be:

1. Public login shell loads on the chosen gallery origin.
2. The Worker issues a short-lived login challenge and nonce.
3. Google Identity Services returns an ID token for exactly our web client ID.
4. The Worker verifies Google’s rotating keys, RS256 signature, exact `aud`, accepted `iss`, `exp`, required/recent `iat`, login nonce, `sub`, email, and `email_verified`.
5. The verified identity is compared with the current whitelist.
6. A secure session is created.
7. Every album, photo, thumbnail, media, and optional download request revalidates both the session and current whitelist.
8. The Worker obtains its own Drive access token from the service-account credential using the server-to-server JWT flow.
9. Before serving media, it verifies that the image belongs to an album under the configured root. There will be no generic `/drive-file/{arbitraryId}` proxy.
10. Private media responses use `Cache-Control: private, no-store` and are never placed in a shared Cloudflare cache.

Parents receive only a Google identity credential. GIS authentication returns an ID token, while access to Google APIs is a separate authorization API; we will not request a parent Drive token or Drive scope. [GIS overview](https://developers.google.com/identity/gsi/web/guides/overview)

Google recommends server-side token verification and requires signature, audience, issuer, and expiry checks; its OIDC reference also defines `iat` as required and recommends a one-time nonce against replay. [Server-side verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Google OIDC claims](https://developers.google.com/identity/openid-connect/reference)

Cookies would be host-only `__Host-...` cookies with `Secure`, `HttpOnly`, `Path=/`, explicit `SameSite`, and an absolute expiry. Login/logout would be POST-only with exact-origin checking, nonce validation, and CSRF protection. [Secure cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

Cloudflare Workers supports the required Web Crypto operations, including RSASSA-PKCS1-v1_5 and HMAC. [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

## Origin arrangement choices

| Arrangement | Consequences |
|---|---|
| Worker serves UI and API/media on one origin | Strongest and simplest. Host-only `SameSite=Lax` or `Strict` cookies, no credentialed CORS, no third-party-cookie dependence, and `Cross-Origin-Resource-Policy: same-origin`. This is my recommendation. |
| GitHub Pages UI → custom Worker subdomain | Workable when both origins are under the same registrable domain. Requires strict credentialed CORS and authenticated blob loading rather than direct `<img>` URLs. More moving pieces and weaker origin isolation. |
| GitHub Pages UI → `workers.dev` | Cross-site cookies require `SameSite=None; Secure`; browser third-party-cookie restrictions may break API and image loading. I do not recommend this for the production gallery. |
| Worker route on the existing `/gallery/*` URL | Best URL compatibility and same-origin behavior, but possible only if the hostname is proxied through an active Cloudflare DNS zone. It affects production routing and needs a separately confirmed DNS change. |

A `workers.dev` address needs no domain onboarding and is suitable for staging. Cloudflare recommends a custom domain or route for production. Custom domains and routes require a Cloudflare zone; routes additionally require a proxied DNS record. [Workers routing](https://developers.cloudflare.com/workers/configuration/routing/), [`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## Whitelist and session choices

| Store | Consequences |
|---|---|
| Encrypted Worker secret | Fewest services and no per-request storage quota. A 5 KB secret can hold a modest list. Updating it creates/deploys a Worker version, and the full list must be re-entered. Good for a small group if deployment-based maintenance is acceptable. |
| Workers KV | Easy per-parent changes and explicitly suitable for allowlists, but changes can remain stale at an edge location for 60 seconds or longer. It cannot provide immediate revocation. Free limit: 100,000 reads/day. |
| D1 | Supports indexed whitelist and session tables, individual logout/revocation, and immediate-current reads when kept on the primary. Plaintext emails need not be stored: entries can be keyed with an HMAC digest. More setup, but strongest operational control. Free limit: 5 million rows read/day, 100,000 written/day, 5 GB. |
| Another store | Needs separate evaluation for cost, consistency, privacy, and credentials. |

[KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [KV limits](https://developers.cloudflare.com/kv/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

Session choices are separate:

- A signed stateless session is simpler. Every request still checks the current whitelist. Logout clears the browser cookie but cannot invalidate a copied cookie; removal from the whitelist or signing-key rotation does.
- An opaque D1 session allows actual server-side logout and individual session revocation. Every request can perform one indexed join that checks both the live session and active whitelist entry.

For signing/pepper rotation, the Worker would accept current and previous keys during a bounded transition, issue only with the current key, retain the previous key no longer than the maximum session lifetime, and then remove it.

## Current cost and publication findings

- Plain Google Identity Services with a web OAuth client is not Google Cloud Identity Platform and has no per-parent/MAU charge. We will not enable Identity Platform.
- `openid`, `email`, and `profile` are basic, non-sensitive identity scopes. In External/Testing status, Google currently allows basic-identity users without putting every parent on the OAuth test-user list, although users see testing-warning UI. Published/unverified basic-scope apps remain accessible but do not display verified branding. [Current OAuth app-state rules](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview)
- Full sensitive/restricted-scope verification is not required for basic identity. A lighter brand verification is needed if a published external app should display the Scholka name/logo. It requires domain ownership through Search Console, a public home page, a public privacy policy on the same domain, and accurate authorized domains. Automated verification may take minutes; manual review is normally 2–3 business days. [Brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- Service-account Drive access uses a separate JWT exchange and requires no parent consent. We would use `drive.readonly`, no domain-wide delegation, and share only the gallery root with the service-account address. Folder permissions propagate to children. [Service-account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account), [Drive sharing](https://developers.google.com/workspace/drive/api/guides/manage-sharing)
- Drive listing uses `files.list`; media uses authenticated `files.get?alt=media`. [Drive listing](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list), [Drive downloads](https://developers.google.com/workspace/drive/api/guides/manage-downloads)
- Current Workers Free limits are 100,000 dynamic requests/day, 10 ms CPU per request, 128 MB memory, and 50 outbound subrequests. Static assets are free and unlimited. Free limits fail rather than creating Worker overage charges; we will not enable Workers Paid. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- Google currently says standard Drive API use is free, but its August 2026 documentation announces planned later-2026 charges for usage above very high thresholds. The expected choir usage is tiny relative to those thresholds, but we should keep the Google project without usage-based billing and document this as a time-sensitive assumption. [Current Drive limits and pricing notice](https://developers.google.com/workspace/drive/api/guides/limits)

## Exact code changes after confirmation

I would make these changes in this worktree:

- Add a Worker backend and Wrangler configuration covering auth, sessions, whitelist adapter, Drive token exchange, Drive tree enforcement, security headers, and normalized non-revealing errors.
- Add required secret names only; no values, parent emails, folder IDs, or private keys in git.
- Replace browser Drive functions in [core.ts](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/core.ts:1122) with a typed private-gallery API client.
- Add signed-out, checking-session, denied, expired-session, and signed-in states to [GalleryPage.tsx](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/pages/GalleryPage.tsx:206).
- Remove public API-key refresh behavior from [Gallery.tsx](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/components/Gallery.tsx:64) and load all displayed media through authenticated Worker endpoints.
- Preserve album slugs, query links, `[cover]`, achievements, image retries, lightbox, Polish/English UI, and themes.
- Add bilingual login/logout/privacy/session/error copy to [siteContent.ts](C:/Users/mmaciejewski/dev/repo/scholka-worker-only/src/siteContent.ts:140).
- Keep Vite `base: '/'`.
- If using a separate Worker origin, make the main-site gallery navigation and old `/gallery/?...` links hand off to a fixed configured origin without accepting arbitrary redirect targets.
- Remove the gallery folder ID from the public GitHub Pages build.
- Add Worker-runtime tests using Cloudflare’s current `@cloudflare/vitest-plugin`, with mocked Google JWKS/identity and Drive requests. [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- Add the required denied, expired, malformed, removed-user, direct-media, outside-tree, logout, expiry, and key-rotation tests.
- Extend Playwright coverage for the login shell and authenticated gallery using local mocks.
- Add operational/security documentation without expanding the concise README unnecessarily.

## Responsibility split

I can make:

- All source, configuration, test, documentation, and mock changes.
- Local builds, linting, unit tests, Worker tests, and Playwright checks.
- Exact commands and browser instructions after each confirmed choice.

Commands you will eventually execute locally:

- Interactive Cloudflare login.
- Secret-entry commands that prompt in your terminal.
- Resource/deployment commands only after I explain each one and you approve it.

Google browser actions you must perform:

- Select/create the Cloud project, enable Drive API, configure audience/branding, create the web OAuth client, create the service account, and create/download its key.

Cloudflare browser actions you must perform:

- Confirm the account is on Workers Free, choose the `workers.dev` subdomain, and—if selected—create D1/KV or attach a custom domain/route.

Google Drive browser actions you must perform:

- Share the still-public gallery root with the service-account email as Viewer.
- Only after allowed and denied end-to-end tests pass, remove public/“anyone” access.

## Choices I need from you

Please reply with numbered answers. Do not include real email addresses, credentials, private keys, tokens, or the whitelist.

1. Do you already have a Google Cloud project suitable for this? If yes, does it already have the Drive API or an OAuth web client?
2. Do you already have a Cloudflare account, and can you confirm it is—or will remain—Workers Free with no paid Workers subscription?
3. Which UI arrangement do you want: Worker-served same-origin UI, GitHub Pages cross-origin UI, or the existing `/gallery/*` URL through a Worker route?
4. For the first test deployment, do you want `workers.dev`, a custom subdomain, or the existing production path?
5. Does Cloudflare currently control the authoritative DNS for `urszula-gdynia.pl`, and can you add/modify records for the Scholka hostname?
6. Which whitelist store do you prefer: encrypted Worker secret, KV, D1, or another option?
7. Approximately how many parents should be allowed initially, and what is the plausible maximum?
8. Which session scheme do you want: signed stateless cookie or opaque D1 session?
9. What absolute session lifetime do you want—such as 8 hours, 24 hours, or 7 days? Should it remain absolute or extend while actively used?
10. Are original-file downloads required, or only display-sized thumbnails/lightbox images? Displayed images can still be saved by an authorized parent.
11. What does “immediate revocation” mean operationally: next request after an update, within roughly one minute, or no later than session expiry?
12. Do you have both an allowed and a disallowed Google account available for final staging tests? A yes/no answer is enough.
13. Must the system support Google Accounts using non-Gmail, non-Workspace addresses? Google warns that even `email_verified=true` may not prove continuing ownership for those accounts.
14. For final production, do you want to pursue Google brand verification so parents see the Scholka name/logo, and can you provide Search Console domain ownership plus a public privacy-policy page?

Safe to report back: the answers above, approximate counts, intended hostnames, project ID, OAuth client ID, and service-account email. Keep secret: OAuth client secret if one exists, service-account JSON/private key, session keys, Worker secrets, Cloudflare API tokens, and all real whitelist entries.

The only physical setup step now is to answer these choices. Please do not create resources, alter DNS, change Drive sharing, or publish OAuth settings yet.