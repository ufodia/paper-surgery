# Privacy and data flow

PDF bytes, extracted text, file names, and edits stay in memory in your browser tab. The bundled PDF.js worker processes the document locally. Loading the included sample makes a same-origin request for `sample.pdf`. The source and donation links open their respective external websites only when clicked. There is no telemetry, account system, remote OCR, or document storage. Exported files contain document text; store them accordingly.

## Running locally

The development/preview server binds to `127.0.0.1`. Package installation contacts npm to download dependencies. Production assets may be served by any static host you choose; hosting is not configured automatically. A host can log ordinary page requests, so review its policy before using it for sensitive work.
