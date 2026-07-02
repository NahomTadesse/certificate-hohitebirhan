import { LoginResponse } from "@/types/dtos/auth";
import { LocationCreateRequest, LocationResponse } from "@/types/dtos/location";
import { Route } from "@/types/dtos/route";
import { Vechile } from "@/types/dtos/vechile";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "cookies-next/client";

export const apiSlice = createApi({
  reducerPath: "api",
  // Same-origin proxy: `/api/...` is handled by `src/app/api/[...path]/route.ts`.
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const storedToken = getCookie("accessTokendash") as string | null;

      if (storedToken) {
        headers.set("Authorization", `Bearer ${storedToken}`);
      } else {
        console.warn("No valid token found in cookies");
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<
      LoginResponse,
      { phoneNumber: string; password: string }
    >({
      query: ({ phoneNumber, password }) => ({
        url: "admin/v1/api/auth/authenticate",
        method: "POST",
        body: { phoneNumber, password },
      }),
    }),

    createVechileType: builder.mutation<unknown, { vechile: Vechile }>({
      query: ({ vechile }) => ({
        url: `admin/v1/api/vehicleType`,
        method: "POST",
        body: vechile,
      }),
    }),

    updateVechileType: builder.mutation<unknown, number>({
      query: (id) => ({
        url: `admin/v1/api/vehicleType/${id}`,
        method: "PUT",
      }),
    }),

    getVechileType: builder.query<Vechile, void>({
      query: () => "admin/v1/api/vehicleType",
    }),

    getRoute: builder.query<Route, void>({
      query: () => "admin/v1/api/route",
    }),

    createRoute: builder.mutation<unknown, { route: Route }>({
      query: ({ route }) => ({
        url: `admin/v1/api/route`,
        method: "POST",
        body: route,
      }),
    }),

    updateRoute: builder.mutation<unknown, number>({
      query: (id) => ({
        url: `admin/v1/api/route/${id}`,
        method: "PUT",
      }),
    }),

    getLocation: builder.query<LocationResponse[], void>({
      query: () => "admin/v1/api/location",
    }),

    createLocation: builder.mutation<
      { message: string },
      LocationCreateRequest
    >({
      query: (body) => ({
        url: "admin/v1/api/location",
        method: "POST",
        body,
      }),
    }),

    updateLocation: builder.mutation<unknown, number>({
      query: (id) => ({
        url: `admin/v1/api/location/${id}`,
        method: "PUT",
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetVechileTypeQuery,
  useCreateVechileTypeMutation,
  useUpdateVechileTypeMutation,
  useGetRouteQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useLogoutMutation,
} = apiSlice;
