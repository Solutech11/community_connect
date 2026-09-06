# Community Connect development-client setup

LiveKit voice and video calls use native WebRTC code. They cannot run in Expo Go. Use the installed Expo development client on Android, or create an EAS development build.

## 1. Prerequisites

- Node.js and Yarn
- Android Studio with an Android emulator **or** an Android phone with USB debugging enabled
- The Community Connect backend running and reachable from the device
- A configured LiveKit project or server

## 2. Configure local environment variables

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Set the public LiveKit WebSocket URL:

```text
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

For a physical Android device using the local backend, do not use `localhost`. Use the computer's LAN IP instead:

```text
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://192.168.x.x:5000
```

`EXPO_PUBLIC_LIVEKIT_URL` is a public server address. Never put `LIVEKIT_API_SECRET`, JWT secrets, or backend credentials in `.env.local` or Expo configuration.

## 3. Install dependencies

The project already contains the required LiveKit and Expo development-client packages. After cloning or switching machines, run:

```powershell
yarn install
```

## 4. Build and install locally on Android (Windows)

Connect an Android device by USB and accept the USB-debugging prompt, or start an Android emulator. Then run:

```powershell
npx expo run:android --device
```

For the currently selected emulator instead:

```powershell
npx expo run:android
```

Expo generates native Android files when required, builds the app with the LiveKit/WebRTC modules, installs it, and starts Metro.

## 5. Start development after the first build

Once the development build is installed, ordinary TypeScript/JavaScript changes do not need another native build:

```powershell
npx expo start
```

Open the installed **Community Connect** development build and scan the displayed QR code, or select the server from its launcher.

Rebuild with `npx expo run:android --device` whenever you change a native dependency, LiveKit/WebRTC package, Expo SDK version, or `app.json` permissions/plugins.

## 5. EAS LiveKit environment variables

`eas.json` now attaches its `development`, `preview`, and `production` profiles to the matching EAS environments. Create the public LiveKit URL in each environment you build:

```powershell
npx eas-cli@latest env:set --name EXPO_PUBLIC_LIVEKIT_URL --value wss://your-project.livekit.cloud --environment development --visibility plaintext
npx eas-cli@latest env:set --name EXPO_PUBLIC_LIVEKIT_URL --value wss://your-project.livekit.cloud --environment preview --visibility plaintext
npx eas-cli@latest env:set --name EXPO_PUBLIC_LIVEKIT_URL --value wss://your-project.livekit.cloud --environment production --visibility plaintext
```

The URL is intentionally `plaintext`: every `EXPO_PUBLIC_*` value embedded in a mobile app is public. Do not add LiveKit API keys or secrets to EAS client-side variables.

## 6. Build with EAS instead (Android or iOS)

Use this when you do not want to build locally, or need an iOS build from Windows.

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Use this `eas.json` development profile if one is not created for you:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

Create the build:

```powershell
npx eas-cli@latest build --profile development --platform android
```

Install the generated build on the device, then run:

```powershell
npx expo start --dev-client
```

## 7. Test a Community call

1. Ensure the backend has `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` configured.
2. Sign in to the development build and enter an active community.
3. An owner or moderator starts a voice or video call.
4. Another active member joins it.
5. Approve microphone/camera permissions when requested.

The app obtains a fresh, short-lived participant token from the backend for every join. Tokens and LiveKit API secrets never belong in the mobile app.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| It opens in Expo Go | Install and open the development build, not Expo Go. |
| `Call setup needed` | Set `EXPO_PUBLIC_LIVEKIT_URL` and rebuild/restart Metro. |
| `COMMUNITY_CALL_PROVIDER_UNAVAILABLE` | Configure LiveKit environment variables on the backend. |
| Phone cannot reach the backend | Use your computer's LAN IP, ensure both devices share Wi-Fi, and allow port 5000 through Windows Firewall. |
| Native module or permission change is ignored | Rebuild the development client with `npx expo run:android --device`. |

## API contract note

The call join response returns `provider`, `roomName`, `participantToken`, and `expiresAt`, but not the public LiveKit server URL. The app therefore reads `EXPO_PUBLIC_LIVEKIT_URL`. Returning a `serverUrl` field from the join endpoint later would remove this duplicated public configuration.

References: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [using a development build](https://docs.expo.dev/develop/development-builds/use-development-builds/), and [LiveKit Expo setup](https://docs.livekit.io/transport/sdk-platforms/expo/).
