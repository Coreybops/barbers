import axios from 'axios';
import {
  CalendarEvent,
  CalendarFilters,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CalendarEventDrop,
  TimeBlock,
  AvailabilitySlot,
  RecurringPattern,
  CalendarExportOptions,
  Appointment
} from '../types';
import { formatISO } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const calendarApi = {
  /**
   * Get calendar events for date range
   */
  async getCalendarEvents(filters: CalendarFilters & {
    start: Date;
    end: Date;
  }): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      start: formatISO(filters.start),
      end: formatISO(filters.end),
      ...(filters.barberId && { barberId: filters.barberId }),
      ...(filters.barberIds && { barberIds: filters.barberIds.join(',') }),
      ...(filters.status && { status: filters.status.join(',') }),
      ...(filters.serviceId && { serviceId: filters.serviceId })
    });

    const response = await api.get(`/calendar/events?${params}`);
    return response.data;
  },

  /**
   * Get appointments for date range
   */
  async getAppointments(filters: CalendarFilters & {
    start: Date;
    end: Date;
  }): Promise<Appointment[]> {
    const params = new URLSearchParams({
      start: formatISO(filters.start),
      end: formatISO(filters.end),
      ...(filters.barberId && { barberId: filters.barberId }),
      ...(filters.barberIds && { barberIds: filters.barberIds.join(',') }),
      ...(filters.status && { status: filters.status.join(',') }),
      ...(filters.serviceId && { serviceId: filters.serviceId })
    });

    const response = await api.get(`/appointments?${params}`);
    return response.data;
  },

  /**
   * Create new appointment
   */
  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  /**
   * Update existing appointment
   */
  async updateAppointment(data: UpdateAppointmentRequest): Promise<Appointment> {
    const { id, ...updateData } = data;
    const response = await api.put(`/appointments/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete/cancel appointment
   */
  async cancelAppointment(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  /**
   * Move appointment (drag and drop)
   */
  async moveAppointment(data: CalendarEventDrop): Promise<Appointment> {
    const response = await api.patch(`/appointments/${data.eventId}/move`, {
      startTime: formatISO(data.newStart),
      endTime: formatISO(data.newEnd),
      ...(data.barberId && { barberId: data.barberId })
    });
    return response.data;
  },

  /**
   * Get barber availability
   */
  async getBarberAvailability(
    barberId: string,
    start: Date,
    end: Date
  ): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({
      start: formatISO(start),
      end: formatISO(end)
    });

    const response = await api.get(`/barbers/${barberId}/availability?${params}`);
    return response.data;
  },

  /**
   * Check appointment conflicts
   */
  async checkConflicts(
    barberId: string,
    start: Date,
    end: Date,
    excludeAppointmentId?: string
  ): Promise<{ hasConflict: boolean; conflicts: Appointment[] }> {
    const params = new URLSearchParams({
      barberId,
      start: formatISO(start),
      end: formatISO(end),
      ...(excludeAppointmentId && { exclude: excludeAppointmentId })
    });

    const response = await api.get(`/calendar/conflicts?${params}`);
    return response.data;
  },

  /**
   * Get time blocks (breaks, holidays, etc.)
   */
  async getTimeBlocks(
    start: Date,
    end: Date,
    barberId?: string
  ): Promise<TimeBlock[]> {
    const params = new URLSearchParams({
      start: formatISO(start),
      end: formatISO(end),
      ...(barberId && { barberId })
    });

    const response = await api.get(`/calendar/time-blocks?${params}`);
    return response.data;
  },

  /**
   * Create time block
   */
  async createTimeBlock(data: Omit<TimeBlock, 'id'>): Promise<TimeBlock> {
    const response = await api.post('/calendar/time-blocks', {
      ...data,
      start: formatISO(data.start),
      end: formatISO(data.end)
    });
    return response.data;
  },

  /**
   * Update time block
   */
  async updateTimeBlock(id: string, data: Partial<TimeBlock>): Promise<TimeBlock> {
    const updateData = {
      ...data,
      ...(data.start && { start: formatISO(data.start) }),
      ...(data.end && { end: formatISO(data.end) })
    };

    const response = await api.put(`/calendar/time-blocks/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete time block
   */
  async deleteTimeBlock(id: string): Promise<void> {
    await api.delete(`/calendar/time-blocks/${id}`);
  },

  /**
   * Get recurring appointments
   */
  async getRecurringAppointments(
    pattern: RecurringPattern,
    start: Date,
    end: Date
  ): Promise<Appointment[]> {
    const response = await api.post('/appointments/recurring/preview', {
      pattern,
      start: formatISO(start),
      end: formatISO(end)
    });
    return response.data;
  },

  /**
   * Create recurring appointments
   */
  async createRecurringAppointments(
    appointmentData: CreateAppointmentRequest,
    pattern: RecurringPattern
  ): Promise<Appointment[]> {
    const response = await api.post('/appointments/recurring', {
      ...appointmentData,
      recurring: pattern
    });
    return response.data;
  },

  /**
   * Update recurring appointment series
   */
  async updateRecurringAppointments(
    seriesId: string,
    data: UpdateAppointmentRequest,
    updateType: 'single' | 'series' | 'future' = 'single'
  ): Promise<Appointment[]> {
    const response = await api.put(`/appointments/recurring/${seriesId}`, {
      ...data,
      updateType
    });
    return response.data;
  },

  /**
   * Export calendar data
   */
  async exportCalendar(options: CalendarExportOptions): Promise<Blob> {
    const params = new URLSearchParams({
      format: options.format,
      start: formatISO(options.dateRange.start),
      end: formatISO(options.dateRange.end),
      includeCustomers: options.includeCustomers.toString(),
      includeNotes: options.includeNotes.toString(),
      ...(options.barberId && { barberId: options.barberId })
    });

    const response = await api.get(`/calendar/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get calendar statistics
   */
  async getCalendarStats(
    start: Date,
    end: Date,
    barberId?: string
  ): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    revenue: number;
    utilizationRate: number;
    averageAppointmentDuration: number;
  }> {
    const params = new URLSearchParams({
      start: formatISO(start),
      end: formatISO(end),
      ...(barberId && { barberId })
    });

    const response = await api.get(`/calendar/stats?${params}`);
    return response.data;
  },

  /**
   * Get next available appointment slot
   */
  async getNextAvailableSlot(
    barberId: string,
    serviceId: string,
    duration: number,
    startDate?: Date
  ): Promise<{ start: Date; end: Date } | null> {
    const params = new URLSearchParams({
      barberId,
      serviceId,
      duration: duration.toString(),
      ...(startDate && { startDate: formatISO(startDate) })
    });

    const response = await api.get(`/calendar/next-available?${params}`);
    return response.data ? {
      start: new Date(response.data.start),
      end: new Date(response.data.end)
    } : null;
  },

  /**
   * Bulk update appointment statuses
   */
  async bulkUpdateAppointments(
    appointmentIds: string[],
    updates: Partial<UpdateAppointmentRequest>
  ): Promise<Appointment[]> {
    const response = await api.patch('/appointments/bulk', {
      appointmentIds,
      updates
    });
    return response.data;
  },

  /**
   * Get appointment reminders
   */
  async getAppointmentReminders(
    start: Date,
    end: Date
  ): Promise<Array<{
    appointment: Appointment;
    reminderType: 'sms' | 'email';
    scheduledTime: Date;
    status: 'pending' | 'sent' | 'failed';
  }>> {
    const params = new URLSearchParams({
      start: formatISO(start),
      end: formatISO(end)
    });

    const response = await api.get(`/calendar/reminders?${params}`);
    return response.data;
  },

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    appointmentId: string,
    type: 'sms' | 'email'
  ): Promise<void> {
    await api.post(`/appointments/${appointmentId}/remind`, { type });
  }
};

export default calendarApi;