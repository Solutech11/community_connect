# Mapbox native setup

The event location picker uses `@rnmapbox/maps` and requires an Expo development build. It does not run in Expo Go. Expo SDK 54 defaults to React Native's New Architecture, which is required by the installed Mapbox package.

## Public map token

Create a restricted Mapbox public access token (`pk...`) and set it locally as:

```text
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-public-token
```

The app reads this value when it starts. It is a client-side token and must not be a secret token. Add the same variable to the EAS `development` environment before creating a new development build.

## Native build

The installed `@rnmapbox/maps` 10.3.5 config plugin includes the native Maven repository. Mapbox no longer requires a separate secret download token for these SDK artifacts, so do not set the deprecated `RNMapboxMapsDownloadToken` option or add a Mapbox secret to this app.

After adding the public token or changing native config, create a new development build. A JavaScript reload cannot add native modules to an existing app binary.
