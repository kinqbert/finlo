# Finlo mobile

Finlo mobile is an Expo SDK 57 application that can be compiled and installed as its own iOS or Android app. Expo Go is not required.

## Local configuration

Install dependencies and create the environment file:

```bash
npm ci
cp .env.example .env
```

`EXPO_PUBLIC_API_URL` must be reachable from the target device. Use `http://localhost:8080` for an iOS simulator and the development computer's LAN address for a physical phone. The checked-out local `.env` is already configured with the LAN address detected during setup.

## First native development build

These commands generate the native project, compile Finlo, install it on the selected target, and start Metro:

```bash
# Physical device or selected Android emulator
npm run native:android

# Physical device or selected iOS simulator
npm run native:ios
```

Android requires Android Studio/SDK. iOS requires macOS and Xcode; a physical iPhone also requires code signing and Developer Mode.

After the first installation, TypeScript-only development uses the installed Finlo app:

```bash
npm run start:dev-client
```

Rebuild with `native:android` or `native:ios` after adding a native dependency or changing `app.json` or a config plugin.

## EAS builds

The committed `eas.json` includes:

- `development` — internal development-client build for physical devices.
- `development-simulator` — iOS simulator development client.
- `preview` — internal standalone build; Android produces an installable APK.
- `production` — auto-incremented store build.

Configure and build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

For EAS builds, configure `EXPO_PUBLIC_API_URL` and the optional Google client IDs in the corresponding EAS `development`, `preview`, and `production` environments. A distributed app should use an HTTPS API URL, not a private LAN address.

Store builds:

```bash
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform android --profile production
npx eas-cli@latest submit --platform ios --profile production
```
