# File formats

A repair is a JSON object with `schema: "paper-surgery/v1"`, `documentSha256`, `name`, and `blocks`. Each block contains `id`, `page`, `text`, `label`, `kind`, and original `x`, `y`, `width`, `height` coordinates. IDs must occur exactly once. The page count/order cannot change; coordinates are restored from the loaded original, not trusted from imported JSON. A document mismatch is rejected before changing the current repair.

## Examples

The included `public/sample.pdf` is reproducible with `npm run sample`. It intentionally interleaves left/right column content in extraction order. The visible values and labels are the source of truth. This fixture contains no real customer data.

Schema names are versioned. Unknown schemas are rejected rather than silently migrated. Keep the original input if you need to reproduce an export.
