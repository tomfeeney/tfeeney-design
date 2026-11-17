# SEO deployment checklist

## Included in this package

- Reformatted HTML with consistent indentation.
- One semantic `<h1>` on each public page while retaining the existing visual classes.
- Unique titles and meta descriptions.
- Canonical URLs using `https://tfeeney-design.com`.
- Open Graph and X/Twitter metadata with descriptive image alt text.
- JSON-LD for the portfolio owner, website, profile page, and public case studies.
- `robots.txt` and `sitemap.xml`.
- `rel="noopener noreferrer"` on external links that open a new tab.
- The confidential Audi page remains `noindex` and is excluded from the sitemap.

## Required during deployment

1. Upload `robots.txt` and `sitemap.xml` to the site root.
2. Force one preferred host and protocol: `https://tfeeney-design.com` without `www`.
3. Install a path-preserving 301 redirect on `iguanaman.com`. An Apache example is included, but confirm the host supports `.htaccess` before using it.
4. Verify both domains in Google Search Console. After redirects are live, use Google's Change of Address workflow and submit `https://tfeeney-design.com/sitemap.xml`.
5. Add any public pages not supplied in this package to `sitemap.xml`; remove any URLs that are not actually published.
6. Test every public URL with Search Console URL Inspection and test the JSON-LD with Google's Rich Results Test or Schema Markup Validator.
7. Confirm every canonical and social image URL returns HTTP 200 over HTTPS.
8. Keep old-domain redirects active for at least one year; longer is better.

## Confidential Audi page warning

The current password gate is implemented in front-end HTML/JavaScript. That hides the page visually but does **not** securely protect NDA content because the content remains in the downloaded source. Keep the `noindex` directive, but move the page behind server-side authentication or publish a sanitized public summary with no confidential assets.
