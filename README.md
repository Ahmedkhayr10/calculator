# Calculator

A cross-platform calculator built with Expo and Expo Router.

Use Node.js `22.13+` (or `24.3+`) before installing dependencies. These are the
minimum supported versions for the installed Expo/React Native toolchain.

## Run the app

From this directory (`calculator/`):

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go to open the app on a device, or press `a` to open
an Android emulator, `i` for an iOS simulator, or `w` for the web app.

The calculator screen is implemented in `src/app/index.tsx`. Expo Router
provides the app entry point and platform routing.

## Check the project

```sh
npx expo-doctor
npx tsc --noEmit
```
