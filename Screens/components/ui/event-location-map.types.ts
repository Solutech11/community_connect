export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type EventLocationMapProps = {
  country: string;
  coordinate: MapCoordinate | null;
  onCoordinateChange: (longitude: number, latitude: number) => void;
  interactive?: boolean;
};
