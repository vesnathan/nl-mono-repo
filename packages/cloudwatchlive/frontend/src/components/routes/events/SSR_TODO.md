Server rendering is not yet available for event pages.

Why SSR? For SEO, social previews, and faster first paint we should render event pages on the server.

Plan (future):

- Move event data lookup into the server component (or into getServerSideProps / app router server layout)
- Use the shared dev-mocks/mockEvents.json as a source while BE is not available
- Optionally generate static pages for known event IDs
- Add OpenGraph meta tags per event for sharing/SEO

TODO: Add OpenGraph / Twitter meta tags per-event when converting to SSR so social previews show title, description and image.

For now the page is client-side rendered and reads mocks from the frontend bundle.
