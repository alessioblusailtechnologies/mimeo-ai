declare module 'pdf-parse' {
  interface PDFParseOptions {
    data: Uint8Array;
    verbosity?: number;
  }
  interface PDFTextResult {
    text: string;
    pages: { text: string; num: number }[];
    total: number;
  }
  class PDFParse {
    constructor(options: PDFParseOptions);
    load(): Promise<void>;
    getText(): Promise<PDFTextResult>;
    destroy(): void;
  }
  export { PDFParse };
}
