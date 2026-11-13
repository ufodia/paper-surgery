# Architecture

`src/main.ts` owns PDF.js loading, canvas rendering, block editing, and browser downloads. `src/core.ts` owns immutable block moves, Markdown rendering, and repair validation. The PDF worker is bundled as a same-origin asset; documents are passed as byte arrays, never uploaded. Source coordinates remain authoritative when loading patches. The sample PDF is generated from the tracked `scripts/make-sample.mjs`.

## Trust boundaries

All imported content is untrusted data. Render document text through text nodes or textarea values. JSON importers validate shapes and limits before applying state. Exports are generated locally. Tests cover meaningful state/provenance invariants; the browser remains responsible for file decoding and rendering.
