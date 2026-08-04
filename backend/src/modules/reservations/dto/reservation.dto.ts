// backend/src/modules/reservations/dto/reservation.dto.ts
import { z } from 'zod';

export const createReservationSchema = z.object({
  catalog_item_id: z.string().min(1),
});

export const listReservationsQuery = z.object({
  catalog_item_id: z.string().optional(),
  status: z.enum(['WAITING', 'READY', 'COLLECTED', 'EXPIRED', 'CANCELLED']).optional(),
});

export type CreateReservationDto = z.infer<typeof createReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsQuery>;
