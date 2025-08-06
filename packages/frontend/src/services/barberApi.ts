import api from './api';
import { 
  Barber, 
  BarberSearchParams, 
  BarberSearchResponse, 
  CreateBarberData, 
  UpdateBarberData,
  BarberPerformance,
  WeeklySchedule
} from '../types';

export const barberApi = {
  // Get all barbers with search and filtering
  searchBarbers: async (params: BarberSearchParams = {}): Promise<BarberSearchResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/barbers?${searchParams.toString()}`);
    return response.data;
  },

  // Get barber by ID
  getBarber: async (id: string): Promise<Barber> => {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  // Create new barber
  createBarber: async (data: CreateBarberData): Promise<Barber> => {
    const formData = new FormData();
    
    // Add basic fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'avatar' || key === 'portfolio') {
        return; // Handle files separately
      }
      
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add avatar file
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    // Add portfolio files
    if (data.portfolio && data.portfolio.length > 0) {
      data.portfolio.forEach(file => {
        formData.append('portfolio', file);
      });
    }

    const response = await api.post('/barbers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update barber
  updateBarber: async (id: string, data: UpdateBarberData): Promise<Barber> => {
    const formData = new FormData();
    
    // Add basic fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'avatar' || key === 'portfolio') {
        return; // Handle files separately
      }
      
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add avatar file
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    // Add portfolio files
    if (data.portfolio && data.portfolio.length > 0) {
      data.portfolio.forEach(file => {
        formData.append('portfolio', file);
      });
    }

    const response = await api.put(`/barbers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Deactivate barber
  deactivateBarber: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/barbers/${id}`);
    return response.data;
  },

  // Assign services to barber
  assignServices: async (barberId: string, serviceIds: string[]): Promise<Barber> => {
    const response = await api.post(`/barbers/${barberId}/services`, { serviceIds });
    return response.data;
  },

  // Get barber performance metrics
  getPerformance: async (
    barberId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<BarberPerformance> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/barbers/${barberId}/performance?${params.toString()}`);
    return response.data;
  },
};

export const scheduleApi = {
  // Get barber schedule
  getSchedule: async (barberId: string): Promise<WeeklySchedule[]> => {
    const response = await api.get(`/schedules?barberId=${barberId}`);
    return response.data;
  },

  // Create or update single day schedule
  updateDaySchedule: async (data: {
    barberId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<any> => {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  // Update entire weekly schedule
  updateWeeklySchedule: async (
    barberId: string, 
    weeklySchedule: Partial<WeeklySchedule>[]
  ): Promise<any> => {
    const response = await api.post('/schedules/bulk', {
      barberId,
      weeklySchedule
    });
    return response.data;
  },

  // Update specific schedule
  updateSchedule: async (
    scheduleId: string, 
    data: { startTime?: string; endTime?: string; isActive?: boolean }
  ): Promise<any> => {
    const response = await api.put(`/schedules/${scheduleId}`, data);
    return response.data;
  },

  // Delete/deactivate schedule
  deleteSchedule: async (scheduleId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/schedules/${scheduleId}`);
    return response.data;
  },

  // Get barber availability for date range
  getAvailability: async (
    barberId: string, 
    startDate: string, 
    endDate: string
  ): Promise<any> => {
    const response = await api.get(
      `/schedules/${barberId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },
};