import * as Location from 'expo-location';

import type { PostAuthRegisterBody } from '../../types/api.generated';

export type RegistrationLocation = NonNullable<PostAuthRegisterBody['location']>;

/** Requests foreground-only access and maps the reading to the API's GeoJSON Point. */
export async function getRegistrationLocation(): Promise<RegistrationLocation | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted || !(await Location.hasServicesEnabledAsync())) {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}
