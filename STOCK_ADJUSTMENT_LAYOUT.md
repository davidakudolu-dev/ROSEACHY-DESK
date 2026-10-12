# Roseachy v2.10.2 — Stock adjustment layout

## Change
The existing Stock → Stock adjustments panel is now a tidy two-column form rather than a vertical single-filed stack on mobile. Inputs/selects sit side by side with aligned control baselines and compact but readable vertical spacing. The Current unit cost and Selling price fields use the same two-column pattern when Update pricing is selected. On extremely narrow displays (340px or less), the product search alone spans both columns so autocomplete remains usable. The Apply adjustment button sits beside the reason field.

All existing form IDs, conditional show/hide logic, calculations, permanent stock adjustment history, transaction records, pricing, packs, date batches, backups, analytics, themes, and Financial/Market/Sales/Stock workflows are unchanged. No database or data format migration is required.

To upgrade an existing Cloudflare Pages installation, upload the ZIP contents at the same project address. Keep a recent backup first. Service-worker cache version is changed so clients can load the new application shell.
