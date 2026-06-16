import api from '@/lib/api';
import type { CalendarData, CalendarEvent, EventPayload } from './types';

export async function getCalendar(month: string): Promise<CalendarData> {
  const { data } = await api.get<{ data: CalendarData }>('/api/calendar', {
    params: { month },
  });
  return data.data;
}

export async function createEvent(payload: EventPayload): Promise<CalendarEvent> {
  const { data } = await api.post<{ data: CalendarEvent }>('/api/events', payload);
  return data.data;
}

export async function updateEvent(id: number, payload: EventPayload): Promise<CalendarEvent> {
  const { data } = await api.put<{ data: CalendarEvent }>(`/api/events/${id}`, payload);
  return data.data;
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/api/events/${id}`);
}
