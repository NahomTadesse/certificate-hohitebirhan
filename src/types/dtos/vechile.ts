export enum VehicleCategory {
  FLATBED_TRUCK = "FLATBED_TRUCK",
  PICKUP = "PICKUP",
  LORRY = "LORRY",
  TRUCK = "TRUCK",
}

export interface Vechile {
  id: number;
  uuid: string;
  name: string;
  description: string;
  vehicleCategory: VehicleCategory;
  properties: Properties[];
}
export interface Properties {
  id: number;
  propertyName: string;
  propertyValue: string;
}
