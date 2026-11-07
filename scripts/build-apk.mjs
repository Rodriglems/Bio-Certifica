// Gera o APK: compila o frontend com o endereço da API, sincroniza o Capacitor e roda o Gradle.
// Uso: node scripts/build-apk.mjs --api <url> [--release]
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const argValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const apiUrl = argValue('--api') ?? process.env.VITE_API_BASE_URL;
const isRelease = args.includes('--release');

if (!apiUrl) {
  console.error('Informe o endereço da API: node scripts/build-apk.mjs --api https://sua-api');
  process.exit(1);
}
if (isRelease && !apiUrl.startsWith('https://')) {
  console.error('O APK de produção exige uma API com HTTPS.');
  process.exit(1);
}

// Instalação local feita para este projeto; JAVA_HOME e ANDROID_HOME definidos têm prioridade.
const toolchain = join(homedir(), 'AppData', 'Local', 'BioCertifica', 'android-toolchain');
const env = {
  ...process.env,
  VITE_API_BASE_URL: apiUrl,
  CAP_HTTP_API: apiUrl.startsWith('http://') ? 'true' : 'false',
  JAVA_HOME: process.env.JAVA_HOME || join(toolchain, 'jdk'),
  ANDROID_HOME: process.env.ANDROID_HOME || join(toolchain, 'sdk'),
};
const run = (command, cwd = process.cwd()) => execSync(command, { stdio: 'inherit', env, cwd });

run('npx vite build');
run('npx cap sync android');

const androidDir = join(process.cwd(), 'android');
const gradle = process.platform === 'win32' ? `"${join(androidDir, 'gradlew.bat')}"` : './gradlew';
const task = isRelease ? 'assembleRelease' : 'assembleDebug';
run(`${gradle} ${task} --no-daemon`, androidDir);

const variant = isRelease ? 'release' : 'debug';
const fileName = isRelease ? 'app-release-unsigned.apk' : 'app-debug.apk';
const source = join('android', 'app', 'build', 'outputs', 'apk', variant, fileName);
if (!existsSync(source)) {
  console.error(`APK não encontrado em ${source}`);
  process.exit(1);
}

mkdirSync('apk', { recursive: true });
const target = join('apk', isRelease ? 'BioCertifica-release-sem-assinatura.apk' : 'BioCertifica-teste.apk');
copyFileSync(source, target);
console.log(`\nAPK gerado: ${target}\nAPI configurada: ${apiUrl}`);
