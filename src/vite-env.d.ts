/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCKING?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_ROOT_DOMAIN?: string;
  readonly VITE_DEMO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
