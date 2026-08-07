# ANDROID — GUIA SIMPLES

## Objetivo
Transformar a interface Web/PWA do LOGOS MASTER em aplicativo Android.

## O que já está pronto
- Configuração Capacitor.
- Pasta `mobile/android/`.
- Scripts NPM.
- Estrutura para apontar o app à API do LOGOS MASTER.

## Você precisará no computador
- Node.js
- Java JDK 17+
- Android Studio

## Passos

### 1. Entrar na pasta mobile
```bash
cd mobile/android
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Criar plataforma Android
```bash
npx cap add android
```

### 4. Sincronizar
```bash
npx cap sync android
```

### 5. Abrir no Android Studio
```bash
npx cap open android
```

### 6. Gerar APK
No Android Studio:
`Build > Build Bundle(s) / APK(s) > Build APK(s)`

## Importante
O aplicativo Android usa a mesma API do LOGOS MASTER.
Não duplique o backend.

Em produção, configure `server.url` no `capacitor.config.ts` com o endereço HTTPS da API/Web publicada.
