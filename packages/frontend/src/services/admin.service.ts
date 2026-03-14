import api from './api';
import type { PaginatedResponse, Ride, RideStatus } from '@cts/shared';

export const getAllRides = async (params?: {
  status?: RideStatus;
  startDate?: string;
  endDate?: string;
  customer?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Ride>> => {
  const response = await api.get('/rides/admin/all', { params });
  return response.data.data.rides;
};

export const acceptRide = async (rideId: string): Promise<Ride> => {
  const response = await api.patch(`/rides/${rideId}/accept`);
  return response.data.data.ride;
};

export const rejectRide = async (rideId: string, reason?: string): Promise<Ride> => {
  const response = await api.patch(`/rides/${rideId}/reject`, { reason });
  return response.data.data.ride;
};

export const completeRide = async (rideId: string, price: number): Promise<Ride> => {
  const response = await api.patch(`/rides/${rideId}/complete`, { price });
  return response.data.data.ride;
};

export const updateRide = async (
  rideId: string,
  updateData: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    pickup?: { address: string };
    dropoff?: { address: string };
    scheduledFor?: string;
    people?: number;
    isRoundtrip?: boolean;
    returnScheduledFor?: string;
    returnPeople?: number;
    notes?: string;
  }
): Promise<Ride> => {
  const response = await api.patch(`/rides/${rideId}/update`, updateData);
  return response.data.data.ride;
};
