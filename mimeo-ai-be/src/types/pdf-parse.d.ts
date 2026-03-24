declare module 'pdf-parse' {
  interface PDFParseOptions {
    data: Uint8Array;
    verbosity?: number;
  }
  class PDFParse {
    constructor(options: PDFParseOptions);
    load(): Promise<void>;
    getText(): Promise<string>;
    destroy(): void;
  }
  export { PDFParse };
}
