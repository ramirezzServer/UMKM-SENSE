export type EventType = 'promo' | 'libur' | 'lainnya';

export interface CalendarEvent {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  type: EventType;
  created_at: string;
  updated_at: string;
}

export interface CalendarHoliday {
  date: string;
  name: string;
}

export interface CalendarData {
  month: string;
  events: CalendarEvent[];
  holidays: CalendarHoliday[];
}

export interface EventPayload {
  name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  type: EventType;
}
