/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_LANDING_URL?: string;
  readonly VITE_META_APP_ID?: string;
  readonly VITE_META_CONFIG_ID?: string;
  readonly VITE_META_CONFIGURATION_ID?: string;
  readonly VITE_META_WHATSAPP_CONFIG?: string;
  readonly VITE_META_EMBEDDED_REDIRECT_URI?: string;
  readonly VITE_META_OAUTH_REDIRECT_URI?: string;
  readonly VITE_META_INSTAGRAM_REDIRECT_URI?: string;
  readonly VITE_DEV_EMAIL?: string;
  readonly VITE_DEV_PASSWORD?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_ANALYTICS_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
