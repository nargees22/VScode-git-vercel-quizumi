
// Fallback definitions for process.env and ImportMeta to resolve environment-specific TypeScript errors.
// Fix: Use namespace augmentation for NodeJS to avoid "subsequent variable declarations" conflict with existing Process types.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
