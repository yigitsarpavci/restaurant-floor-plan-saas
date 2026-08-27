import { z } from 'zod';

export const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address'),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:mm
  endTime: z.string().optional(), // ISO String or HH:mm
  guestCount: z.number().min(1),
  tableIds: z.array(z.string()).min(1),
  tenantId: z.string(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
