const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required')
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Doctor name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    department: z.string().min(2, 'Department is required'),
    phone: z.string().optional()
  })
});

const createReceptionistSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Receptionist name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional()
  })
});

const scheduleSchema = z.object({
  body: z.object({
    weeklySchedule: z.array(z.object({
      day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
      isActive: z.boolean().default(true),
      slotDuration: z.number().int().min(5).max(120).default(15),
      sessions: z.array(z.object({
        name: z.string().optional(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM')
      })).min(1, 'At least one session is required'),
      breaks: z.array(z.object({
        name: z.string().optional(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM')
      })).default([])
    }))
  })
});

const createAppointmentSchema = z.object({
  body: z.object({
    patientType: z.enum(['EXISTING', 'NEW']),
    patientId: z.string().optional(), // Required if EXISTING
    newPatientData: z.object({
      name: z.string().min(2, 'Patient name is required'),
      phone: z.string().min(7, 'Phone number is required'),
      email: z.string().email().optional().or(z.literal('')),
      gender: z.enum(['Male', 'Female', 'Other']).optional(),
      age: z.number().min(0).max(130).optional(),
      address: z.string().optional()
    }).optional(),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    department: z.string().min(1, 'Department is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    slotStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
    slotEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
    purpose: z.string().optional(),
    notes: z.string().optional()
  })
});

const updateAppointmentSchema = z.object({
  body: z.object({
    purpose: z.string().optional(),
    notes: z.string().optional(),
    consultationNotes: z.string().optional()
  })
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  createDoctorSchema,
  createReceptionistSchema,
  scheduleSchema,
  createAppointmentSchema,
  updateAppointmentSchema
};
