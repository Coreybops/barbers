import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CalendarView,
  CalendarSettings,
  CalendarEvent,
  CalendarFilters,
  DragDropContext,
  TimeBlock,
  AvailabilitySlot,
  Appointment,
  CalendarEventDrop
} from '../types';
import { calendarApi } from '../services/calendarApi';
import { 
  getCalendarDateRange, 
  appointmentToCalendarEvent,
  timeBlockToCalendarEvent,
  DEFAULT_WORKING_HOURS,
  DEFAULT_TIME_SLOT_DURATION
} from '../utils/calendar';

interface CalendarState {
  // Settings
  settings: CalendarSettings;
  
  // Data
  events: CalendarEvent[];
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  availability: AvailabilitySlot[];
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedDate: Date | null;
  selectedEvent: CalendarEvent | null;
  dragDropContext: DragDropContext;
  
  // Modals
  isAppointmentModalOpen: boolean;
  isEditingAppointment: boolean;
  isTimeBlockModalOpen: boolean;
  
  // Actions
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  setWorkingHours: (hours: { start: string; end: string }) => void;
  setTimeSlotDuration: (duration: number) => void;
  setShowWeekends: (show: boolean) => void;
  
  // Data actions
  fetchCalendarData: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Event actions
  selectEvent: (event: CalendarEvent | null) => void;
  selectDate: (date: Date) => void;
  
  // Appointment actions
  createAppointment: (data: any) => Promise<void>;
  updateAppointment: (id: string, data: any) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  moveAppointment: (dropData: CalendarEventDrop) => Promise<void>;
  
  // Time block actions
  createTimeBlock: (data: Omit<TimeBlock, 'id'>) => Promise<void>;
  updateTimeBlock: (id: string, data: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;
  
  // Drag and drop
  startDrag: (event: CalendarEvent) => void;
  endDrag: () => void;
  setDropTarget: (target: { date: Date; timeSlot?: any } | null) => void;
  
  // Modal actions
  openAppointmentModal: (editing?: boolean) => void;
  closeAppointmentModal: () => void;
  openTimeBlockModal: () => void;
  closeTimeBlockModal: () => void;
  
  // Utility actions
  navigateDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  exportCalendar: (options: any) => Promise<Blob>;
}

export const useCalendarStore = create<CalendarState>()(
  subscribeWithSelector((set, get) => ({
    // Initial settings
    settings: {
      view: 'month',
      currentDate: new Date(),
      workingHours: DEFAULT_WORKING_HOURS,
      timeSlotDuration: DEFAULT_TIME_SLOT_DURATION,
      showWeekends: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      filters: {}
    },
    
    // Initial data
    events: [],
    appointments: [],
    timeBlocks: [],
    availability: [],
    
    // Initial UI state
    loading: false,
    error: null,
    selectedDate: null,
    selectedEvent: null,
    dragDropContext: {
      draggedEvent: null,
      isDragging: false,
      dropTarget: null
    },
    
    // Initial modal state
    isAppointmentModalOpen: false,
    isEditingAppointment: false,
    isTimeBlockModalOpen: false,
    
    // Settings actions
    setView: (view) => {
      set((state) => ({
        settings: { ...state.settings, view }
      }));
      get().fetchCalendarData();
    },
    
    setCurrentDate: (date) => {
      set((state) => ({
        settings: { ...state.settings, currentDate: date }
      }));
      get().fetchCalendarData();
    },
    
    setFilters: (filters) => {
      set((state) => ({
        settings: {
          ...state.settings,
          filters: { ...state.settings.filters, ...filters }
        }
      }));
      get().fetchCalendarData();
    },
    
    setWorkingHours: (hours) => {
      set((state) => ({
        settings: { ...state.settings, workingHours: hours }
      }));
    },
    
    setTimeSlotDuration: (duration) => {
      set((state) => ({
        settings: { ...state.settings, timeSlotDuration: duration }
      }));
    },
    
    setShowWeekends: (show) => {
      set((state) => ({
        settings: { ...state.settings, showWeekends: show }
      }));
    },
    
    // Data actions
    fetchCalendarData: async () => {
      const { settings } = get();
      set({ loading: true, error: null });
      
      try {
        const dateRange = getCalendarDateRange(settings.currentDate, settings.view);
        
        // Fetch appointments and time blocks in parallel
        const [appointments, timeBlocks] = await Promise.all([
          calendarApi.getAppointments({
            ...settings.filters,
            start: dateRange.start,
            end: dateRange.end
          }),
          calendarApi.getTimeBlocks(
            dateRange.start,
            dateRange.end,
            settings.filters.barberId
          )
        ]);
        
        // Convert to calendar events
        const appointmentEvents = appointments.map(appointmentToCalendarEvent);
        const timeBlockEvents = timeBlocks.map(timeBlockToCalendarEvent);
        const allEvents = [...appointmentEvents, ...timeBlockEvents];
        
        set({
          appointments,
          timeBlocks,
          events: allEvents,
          loading: false
        });
        
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch calendar data'
        });
      }
    },
    
    refreshData: async () => {
      await get().fetchCalendarData();
    },
    
    // Event actions
    selectEvent: (event) => {
      set({ selectedEvent: event });
    },
    
    selectDate: (date) => {
      set({ selectedDate: date });
    },
    
    // Appointment actions
    createAppointment: async (data) => {
      set({ loading: true, error: null });
      
      try {
        const appointment = await calendarApi.createAppointment(data);
        
        // Add to local state
        set((state) => ({
          appointments: [...state.appointments, appointment],
          events: [...state.events, appointmentToCalendarEvent(appointment)],
          loading: false,
          isAppointmentModalOpen: false
        }));
        
      } catch (error) {
        console.error('Failed to create appointment:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to create appointment'
        });
      }
    },
    
    updateAppointment: async (id, data) => {
      set({ loading: true, error: null });
      
      try {
        const appointment = await calendarApi.updateAppointment({ id, ...data });
        
        // Update local state
        set((state) => ({
          appointments: state.appointments.map(a => 
            a.id === id ? appointment : a
          ),
          events: state.events.map(e => 
            e.id === id ? appointmentToCalendarEvent(appointment) : e
          ),
          loading: false,
          isAppointmentModalOpen: false,
          selectedEvent: null
        }));
        
      } catch (error) {
        console.error('Failed to update appointment:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to update appointment'
        });
      }
    },
    
    cancelAppointment: async (id) => {
      set({ loading: true, error: null });
      
      try {
        await calendarApi.cancelAppointment(id);
        
        // Remove from local state
        set((state) => ({
          appointments: state.appointments.filter(a => a.id !== id),
          events: state.events.filter(e => e.id !== id),
          loading: false,
          selectedEvent: null
        }));
        
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to cancel appointment'
        });
      }
    },
    
    moveAppointment: async (dropData) => {
      set({ loading: true, error: null });
      
      try {
        const appointment = await calendarApi.moveAppointment(dropData);
        
        // Update local state
        set((state) => ({
          appointments: state.appointments.map(a => 
            a.id === dropData.eventId ? appointment : a
          ),
          events: state.events.map(e => 
            e.id === dropData.eventId ? appointmentToCalendarEvent(appointment) : e
          ),
          loading: false
        }));
        
      } catch (error) {
        console.error('Failed to move appointment:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to move appointment'
        });
        
        // Revert the optimistic update
        get().fetchCalendarData();
      }
    },
    
    // Time block actions
    createTimeBlock: async (data) => {
      set({ loading: true, error: null });
      
      try {
        const timeBlock = await calendarApi.createTimeBlock(data);
        
        set((state) => ({
          timeBlocks: [...state.timeBlocks, timeBlock],
          events: [...state.events, timeBlockToCalendarEvent(timeBlock)],
          loading: false,
          isTimeBlockModalOpen: false
        }));
        
      } catch (error) {
        console.error('Failed to create time block:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to create time block'
        });
      }
    },
    
    updateTimeBlock: async (id, data) => {
      set({ loading: true, error: null });
      
      try {
        const timeBlock = await calendarApi.updateTimeBlock(id, data);
        
        set((state) => ({
          timeBlocks: state.timeBlocks.map(tb => 
            tb.id === id ? timeBlock : tb
          ),
          events: state.events.map(e => 
            e.id === id ? timeBlockToCalendarEvent(timeBlock) : e
          ),
          loading: false,
          isTimeBlockModalOpen: false
        }));
        
      } catch (error) {
        console.error('Failed to update time block:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to update time block'
        });
      }
    },
    
    deleteTimeBlock: async (id) => {
      set({ loading: true, error: null });
      
      try {
        await calendarApi.deleteTimeBlock(id);
        
        set((state) => ({
          timeBlocks: state.timeBlocks.filter(tb => tb.id !== id),
          events: state.events.filter(e => e.id !== id),
          loading: false
        }));
        
      } catch (error) {
        console.error('Failed to delete time block:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to delete time block'
        });
      }
    },
    
    // Drag and drop actions
    startDrag: (event) => {
      set({
        dragDropContext: {
          draggedEvent: event,
          isDragging: true,
          dropTarget: null
        }
      });
    },
    
    endDrag: () => {
      const { dragDropContext } = get();
      
      if (dragDropContext.draggedEvent && dragDropContext.dropTarget) {
        // Handle the drop
        const dropData: CalendarEventDrop = {
          eventId: dragDropContext.draggedEvent.id,
          newStart: dragDropContext.dropTarget.date,
          newEnd: new Date(dragDropContext.dropTarget.date.getTime() + 
            (dragDropContext.draggedEvent.end.getTime() - dragDropContext.draggedEvent.start.getTime())),
          oldStart: dragDropContext.draggedEvent.start,
          oldEnd: dragDropContext.draggedEvent.end
        };
        
        get().moveAppointment(dropData);
      }
      
      set({
        dragDropContext: {
          draggedEvent: null,
          isDragging: false,
          dropTarget: null
        }
      });
    },
    
    setDropTarget: (target) => {
      set((state) => ({
        dragDropContext: {
          ...state.dragDropContext,
          dropTarget: target
        }
      }));
    },
    
    // Modal actions
    openAppointmentModal: (editing = false) => {
      set({
        isAppointmentModalOpen: true,
        isEditingAppointment: editing
      });
    },
    
    closeAppointmentModal: () => {
      set({
        isAppointmentModalOpen: false,
        isEditingAppointment: false,
        selectedEvent: null
      });
    },
    
    openTimeBlockModal: () => {
      set({ isTimeBlockModalOpen: true });
    },
    
    closeTimeBlockModal: () => {
      set({ isTimeBlockModalOpen: false });
    },
    
    // Utility actions
    navigateDate: (direction) => {
      const { settings } = get();
      let newDate: Date;
      
      switch (settings.view) {
        case 'month':
          newDate = new Date(settings.currentDate);
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate = new Date(settings.currentDate);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate = new Date(settings.currentDate);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        default:
          newDate = settings.currentDate;
      }
      
      get().setCurrentDate(newDate);
    },
    
    goToToday: () => {
      get().setCurrentDate(new Date());
    },
    
    exportCalendar: async (options) => {
      return calendarApi.exportCalendar(options);
    }
  }))
);

// Subscribe to settings changes to persist them
useCalendarStore.subscribe(
  (state) => state.settings,
  (settings) => {
    localStorage.setItem('calendarSettings', JSON.stringify(settings));
  }
);

// Load settings from localStorage on initialization
const savedSettings = localStorage.getItem('calendarSettings');
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    useCalendarStore.setState((state) => ({
      settings: {
        ...state.settings,
        ...parsed,
        currentDate: new Date(parsed.currentDate || Date.now())
      }
    }));
  } catch (error) {
    console.warn('Failed to load saved calendar settings:', error);
  }
}