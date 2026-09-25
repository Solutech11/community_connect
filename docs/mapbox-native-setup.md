# Mapbox native setup

The event location picker uses `@rnmapbox/maps` and requires an Expo development build. It does not run in Expo Go. Expo SDK 54 defaults to React Native's New Architecture, which is required by the installed Mapbox package.

## Public map token

Create a restricted Mapbox public access token (`pk...`) and add it to
`Screens/services/api/config.ts` as `mapboxPublicAccessToken`.

The app reads this public client token from the JavaScript bundle. Changing it
only requires restarting Metro after the development client already includes the
Mapbox native module. Never put a secret (`sk...`) Mapbox token in this file.

## Native build

The installed `@rnmapbox/maps` 10.3.5 config plugin includes the native Maven repository. Mapbox no longer requires a separate secret download token for these SDK artifacts, so do not set the deprecated `RNMapboxMapsDownloadToken` option or add a Mapbox secret to this app.

After adding the public token or changing native config, create a new development build. A JavaScript reload cannot add native modules to an existing app binary.
