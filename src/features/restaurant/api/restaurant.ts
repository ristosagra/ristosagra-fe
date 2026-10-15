import { httpClient } from "../../../services/client/httpClient";
import type {
  RestaurantProfile,
  RestaurantProfileUpdate,
} from "../types/restaurant";

export const RestaurantService = {
  getProfile: (): Promise<RestaurantProfile> =>
    httpClient.get("/api/restaurant"),

  updateProfile: (
    changes: RestaurantProfileUpdate,
  ): Promise<RestaurantProfile> => httpClient.patch("/api/restaurant", changes),
};
