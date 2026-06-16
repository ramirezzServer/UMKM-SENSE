import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as calendarApi from './api';
import type { EventPayload } from './types';

export const CALENDAR_KEYS = {
  month: (month: string) => ['calendar', month] as const,
};

export function useCalendar(month: string) {
  return useQuery({
    queryKey: CALENDAR_KEYS.month(month),
    queryFn: () => calendarApi.getCalendar(month),
    staleTime: 60_000,
  });
}

export function useCreateEvent(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventPayload) => calendarApi.createEvent(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CALENDAR_KEYS.month(month) });
    },
  });
}

export function useUpdateEvent(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventPayload }) =>
      calendarApi.updateEvent(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CALENDAR_KEYS.month(month) });
    },
  });
}

export function useDeleteEvent(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => calendarApi.deleteEvent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CALENDAR_KEYS.month(month) });
    },
  });
}
