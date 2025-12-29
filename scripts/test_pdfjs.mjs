(async () => {
  try {
    console.log("[test] importing pdfjs-dist...");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    console.log("[test] pdfjs imported");

    try {
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      globalThis.pdfjsPreloadedWorker = worker;
      console.log("[test] pdf.worker imported");
    } catch (e) {
      console.warn("[test] could not import pdf.worker:", e?.message ?? e);
    }

    // Minimal 1-page PDF (simple text "Hello") encoded as base64
    const b64 =
      "JVBERi0xLjQKJaqrrK0KNCAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBS" +
      "L1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDUgMCBSPj4+Pi9Db250ZW50cyA1IDAg" +
      "Ui9NZWRpYUJveFswIDAgNjEyIDc5Ml0vUmVzb3VyY2VzIDw8L1g0IDEgMCBSPj4+" +
      "Pj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFz" +
      "ZUZvbnQvSGVsdmV0aWNhL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9i" +
      "agozIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1sgNCAwIFJdL0NvdW50IDE+Pgpl" +
      "bmRvYmoKMiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMyAwIFI+PgplbmRv" +
      "YmoKMSAwIG9iago8PC9UeXBlL1BhZ2VDb250ZW50L1BhZ2VzIDIgMCBSPj4KZW5k" +
      "b2JqCjAgMCBvYmoKPDwvQ3JlYXRvcihQREYpL0NyZWF0aW9uRGF0ZShEOjIwMjUw" +
      "MTEyMTEyMzQ1Wik+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwIDY1NTM1IGYg" +
      "CjAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwNzUgMDAwMDAgbiAKMDAwMDAwMTEy" +
      "IDAwMDAwIG4gCjAwMDAwMDE5MCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNi9S" +
      "b290IDEgMCBSPj4Kc3RhcnR4cmVmCjIxOAolJUVPRgo=";

    const buf = Buffer.from(b64, "base64");
    console.log("[test] PDF bytes length", buf.length);

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
    const pdf = await loadingTask.promise;
    console.log("[test] numPages", pdf.numPages);

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => it.str || "").join(" ");
      fullText += `${pageText}\n`;
    }

    console.log("[test] extracted text:", fullText.trim());
    process.exit(0);
  } catch (err) {
    console.error("[test] failure:", err);
    process.exit(1);
  }
})();
