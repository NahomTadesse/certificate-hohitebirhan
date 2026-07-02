export enum DistanceUnit {
  KILOMETER = "KILOMETER",
  MILE = "MILE",
}

export interface Route {
  routeName: string;
  distance: number;
  unit: DistanceUnit;
  routeId: number;
  pickupLocationId: number;
  pickupLocationName: string;
  dropLocationId: number;
  dropLocationName: string;
}
