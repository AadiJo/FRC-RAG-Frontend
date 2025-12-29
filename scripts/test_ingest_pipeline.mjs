(async () => {
  try {
    console.log("[pipeline-test] importing pdfjs-dist...");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    console.log("[pipeline-test] pdfjs imported");

    try {
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      globalThis.pdfjsPreloadedWorker = worker;
      console.log("[pipeline-test] pdf.worker imported");
    } catch (e) {
      console.warn(
        "[pipeline-test] could not import pdf.worker:",
        e?.message ?? e
      );
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
    const data = new Uint8Array(buf);
    console.log("[pipeline-test] PDF bytes length", data.length);

    // Extraction (same logic as route)
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages ?? 0;
    console.log("[pipeline-test] numPages", numPages);

    let text = "";
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((it) => it.str || "").join(" ");
        text += `${pageText}\n`;
      } catch (pageErr) {
        console.debug(
          `[pipeline-test] Failed to extract text from page ${i}`,
          pageErr
        );
      }
    }

    text = text.trim();
    console.log("[pipeline-test] extracted text length", text.length);

    // Simulate sendToBackend: prepare payload
    const payload = {
      user_id: "test-user",
      documents: [
        {
          doc_id: "test-doc",
          title: "test.pdf",
          text: text || "<no text extracted>",
          source: { type: "gdrive", uri: "file://local/test.pdf" },
        },
      ],
      chunking: { strategy: "recursive", chunk_size: 900, chunk_overlap: 150 },
    };

    console.log(
      "[pipeline-test] payload chars",
      payload.documents[0].text.length
    );

    // Optionally send to configured backend if env var present
    const BACKEND = process.env.RAG_BACKEND_URL;
    if (BACKEND) {
      console.log("[pipeline-test] sending to backend", BACKEND);
      const res = await fetch(`${BACKEND}/api/v1/user-documents/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.RAG_API_KEY
            ? { "X-API-Key": process.env.RAG_API_KEY }
            : {}),
        },
        body: JSON.stringify(payload),
      });
      console.log("[pipeline-test] backend status", res.status);
      const bodyRes = await res.text();
      console.log("[pipeline-test] backend response", bodyRes.slice(0, 400));
    } else {
      console.log(
        "[pipeline-test] RAG_BACKEND_URL not set; skipping network upsert"
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("[pipeline-test] failure:", err);
    process.exit(1);
  }
})();
