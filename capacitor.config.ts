import type { CapacitorConfig } from '@capacitor/cli';

// Só o APK de teste contra uma API HTTP local define esta variável (veja scripts/build-apk.mjs).
// Uma página em https://localhost não pode chamar uma API http://.
const usesHttpApi = process.env.CAP_HTTP_API === 'true';

const config: CapacitorConfig = {
  appId: 'br.com.biocertifica.app',
  appName: 'Bio Certifica',
  webDir: 'build',
  ...(usesHttpApi ? { server: { androidScheme: 'http', cleartext: true } } : {}),
};

export default config;
