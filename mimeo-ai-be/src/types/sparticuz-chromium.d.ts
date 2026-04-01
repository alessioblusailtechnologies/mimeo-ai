declare module '@sparticuz/chromium' {
  const chromium: {
    args: string[];
    executablePath(): Promise<string>;
    setGraphicsMode: boolean;
  };
  export default chromium;
}
