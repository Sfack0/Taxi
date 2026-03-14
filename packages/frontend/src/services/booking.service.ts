import api from './api';
import type {
  CreateRideRequest,
  Ride,
  RateRideRequest,
  ApiResponse,
  PaginatedResponse,
} from '@cts/shared';

export const createRide = async (data: CreateRideRequest): Promise<Ride> => {
  const response = await api.post<ApiResponse<{ ride: Ride }>>('/rides', data);
  return response.data.data!.ride;
};

export const getRide = async (rideId: string): Promise<Ride> => {
  const response = await api.get<ApiResponse<{ ride: Ride }>>(`/rides/${rideId}`);
  return response.data.data!.ride;
};

export const getUserRides = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
}): Promise<PaginatedResponse<Ride>> => {
  const response = await api.get<ApiResponse<{ rides: PaginatedResponse<Ride> }>>(
    '/rides',
    { params }
  );
  return response.data.data!.rides;
};

export const cancelRide = async (rideId: string): Promise<Ride> => {
  const response = await api.patch<ApiResponse<{ ride: Ride }>>(
    `/rides/${rideId}/cancel`
  );
  return response.data.data!.ride;
};

export const rateRide = async (
  rideId: string,
  data: RateRideRequest
): Promise<Ride> => {
  const response = await api.post<ApiResponse<{ ride: Ride }>>(
    `/rides/${rideId}/rate`,
    data
  );
  return response.data.data!.ride;
};

export const getRideStatus = async (rideId: string): Promise<{ status: string; ride: Ride }> => {
  const response = await api.get<ApiResponse<{ status: string; ride: Ride }>>(
    `/rides/${rideId}/status`
  );
  return response.data.data!;
};
