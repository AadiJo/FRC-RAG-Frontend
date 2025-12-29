declare module "pdfjs-dist/legacy/build/pdf.js" {
  export * from "pdfjs-dist/types/src/pdf";
}

declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  const worker: unknown;
  export = worker;
}

declare module "pdfjs-dist/build/pdf.worker.mjs" {
  const worker: unknown;
  export = worker;
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export * from "pdfjs-dist/types/src/pdf";
}
