# Use Paper Surgery

1. Choose **Try the sample** to open the included two-column workshop report.
2. Select a text block to highlight its original location. Use the up/down controls to restore a logical reading order.
3. Attach **Revenue** to **$2,100** and **Refunds** to **$12,500**, checking their printed column positions. Preserve the negative net result.
4. Choose **Export Markdown**, then **Save repair**. Reopen the same PDF and choose **Load repair** to reproduce your edits.

## Save your work

Use the export controls before refreshing or closing the tab. Downloads are ordinary local files and can contain the input content. Review them before sharing.

## Troubleshooting

If a file is rejected, check [File formats](FORMATS.md) and the displayed error. Use the supplied synthetic sample to distinguish an application problem from an unsupported input. If the application does not start, verify Node.js 24 and run `npm ci` from the project directory. Report reproducible problems through GitHub with redacted inputs.

The included `public/sample.pdf` is reproducible with `npm run sample`. It intentionally interleaves left/right column content in extraction order. The visible values and labels are the source of truth. This fixture contains no real customer data.
