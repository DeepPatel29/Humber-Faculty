declare module "pdf-parse" {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, string>;
    metadata: Record<string, string>;
    text: string;
    version: string;
  }

  function pdf(
    buffer: Buffer,
    options?: Record<string, unknown>,
  ): Promise<PDFParseResult>;

  export = pdf;
}
