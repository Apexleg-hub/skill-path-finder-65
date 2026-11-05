# Structured Data Audit

## Pre-fix findings

The audit of the checked-in application found the following schema implementation and crawlability issues:

- The pre-fix workspace Course markup used `courseCategory`, which is not a Schema.org property. It has been removed. However, the production HTML inspected on 2026-11-05 does not contain this property, so it is not confirmed as the cause of the current live Semrush findings.
- The live course catalog reports 39 courses. A production course detail response contains a Course item without `hasCourseInstance`; this could explain a Semrush/Google Course rich-result issue repeated across the 39 live course pages. A Course without an instance can still be valid Schema.org, and no Semrush issue export was provided, so this is a plausible explanation rather than a confirmed mapping.
- `src/lib/structured-data.ts` contained reusable Organization, WebSite, WebPage, BreadcrumbList, Course, and BlogPosting generators, but no route called its page-level script helper. It did not control the markup emitted by the site.
- `src/routes/courses.$slug.tsx` independently emitted Course, BreadcrumbList, and optional FAQPage scripts. It added a CourseInstance to every catalog course without a specific schedule and serialized the scripts without shared HTML-safe escaping. The provider was an unlinked organization node.
- `src/routes/cohorts.$slug.index.tsx` independently emitted Course/CourseInstance/Offer markup. Its records do contain cohort dates and tuition, but the academy entity was not linked and only `<` was escaped in the JSON string.
- The homepage and most public routes lacked a shared Organization/WebPage/Breadcrumb graph. The catalog's ItemList was a separate script.
- Blog article data was fetched in a client-side effect in `src/routes/blog.$slug.tsx`, leaving the initial server response without article metadata/schema. The record exposes title, excerpt, author, creation timestamp, and image; the route does not select a modification timestamp.
- The blog record has `created_at` but no verified publication timestamp, and the editor supports drafts. BlogPosting therefore omits `datePublished` rather than treating draft creation as publication; it also omits `dateModified` because no modification timestamp is available.
- Footer phone/email and both shown locations are present in the contact page and were suitable for Organization data. Social links point to generic platform homepages rather than verified Corepoint profiles, so no `sameAs` links were added. The client-side course search does not establish a supported search URL, so no SearchAction was warranted.

The live public fetch listed 39 courses; the current local workspace catalog rendered 41 course detail URLs. Course titles, summaries, images, levels, and learning outcomes come from the course configuration. Cohort dates and tuition come from separate cohort records and are used only on cohort detail pages.

## Fixes implemented

- Centralized schema output in `src/lib/structured-data.ts`: one escaped JSON-LD `@graph` per page, stable academy/website/page IDs, optional-value filtering, and reusable Organization, WebSite, WebPage, BreadcrumbList, Course, scheduled-course, and BlogPosting generators.
- Removed `courseCategory` and generic CourseInstance output from catalog Course schema. Scheduled CourseInstance/Offer data is limited to cohort records with configured dates, modes, and prices.
- Added the shared graph to homepage, course catalog and details, cohort list/details, blog list/details, About, Contact, registration, payment-plan FAQ, and Data Science/AI landing pages. Added canonical URLs to the relevant routes.
- Moved blog article loading into the route loader so the initial server response contains article content and data-driven BlogPosting schema. `dateModified` is omitted because no modification field is selected or available to this route.
- Did not add SearchAction, unverified social profiles, business registration data, ratings/reviews, or course schedules where no supporting records exist.

## Semrush evidence limitation

The Semrush total (39 invalid items) was not accompanied by affected URLs, issue names, or a validation export. A direct raw-HTML check of the deployed site on 2026-11-05 found: zero JSON-LD blocks on the homepage, blog index, and sampled article; one ItemList block on the course index; and separate Course and FAQPage blocks on the sampled course detail page. The live Course block did not include `courseCategory` or `hasCourseInstance`. This differs from the corrected local source and prevents attributing all 39 findings to one specific error without Semrush's item-level report.

The local changes are not deployed. Consequently, zero of the 39 production Semrush items can yet be claimed as externally confirmed fixed. A production recrawl after deployment is required to establish the remaining count.

## Post-fix validation

- Production build completed successfully. Existing unrelated TanStack Start deprecation notices remain in `src/lib/applications.functions.ts`.
- Independently tested 52 unique URLs against the local production SSR server: 41 course detail URLs linked from the current workspace sitemap plus 11 representative public URLs covering the homepage, course catalog, About, Contact, cohort list and configured cohort detail, blog list and a published article, payment plans, registration, and the Data Science/AI landing page. All returned HTTP 200, contained exactly one parseable JSON-LD graph, and had a matching HTTPS canonical. Checks found no duplicate top-level `@id` values, non-HTTPS schema URLs, or `courseCategory`; course pages had one Course node, and no unscheduled CourseInstance.
- All tested responses returned HTTP 200 and contained exactly one parseable JSON-LD graph. Checks found no duplicate `@id` values, non-HTTPS schema URLs, or `courseCategory` property. Course pages had one Course and one BreadcrumbList and no unscheduled CourseInstance; the article response contained BlogPosting data.
- No validator failures were found by these local syntax/shape checks. The external Google Rich Results Test, Schema Markup Validator, and Semrush recrawl were not run because they cannot access the un-deployed local build. They remain required to confirm the public deployment and exact Semrush issue count.
- No business information needs to be added for the current graph. Add official social-profile URLs only after confirming the actual Corepoint accounts; add `dateModified` only if a real article modification timestamp becomes available.

## Recommendations

- Deploy the changes, run the Schema Markup Validator on representative live pages, then rerun the Semrush audit and compare its issue URLs/count with the 39-item baseline.
- Verify whether the live catalog should remain at 39 while the current workspace has 41 course routes; keep published page inventory and crawlable sitemap data aligned.
- Confirm whether the two published addresses both represent current academy locations. They are currently used because both appear in the public contact information.