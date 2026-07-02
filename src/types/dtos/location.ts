export interface LocationResponse {
  id: number;
  latitude: number;
  longitude: number;
  nameEng: string;
  nameAmh: string;
  placeId: string;
  region: string;
  locationGroups: string;
  googlePlaceId: string;
}
export type LocationCreateRequest = Omit<LocationResponse, "id">;
