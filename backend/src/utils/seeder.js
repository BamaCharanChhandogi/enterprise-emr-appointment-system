const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');

const seedInitialData = async () => {
  try {
    console.log('🌱 Checking / Seeding comprehensive EMR clinical dataset...');

    // Clean existing mock collections for a pure, deterministic setup
    await Promise.all([
      User.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Core Users (Admin, Receptionists, Doctors across multiple specialties)
    const admin = await User.create({
      name: 'Dr. Sarah Mitchell (Super Admin)',
      email: 'admin@emr.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
      phone: '+1 555-0100'
    });

    const receptionist1 = await User.create({
      name: 'James Wilson (Front Desk Lead)',
      email: 'reception@emr.com',
      password: 'password123',
      role: 'RECEPTIONIST',
      phone: '+1 555-0101'
    });

    const receptionist2 = await User.create({
      name: 'Allison Cameron (Admissions)',
      email: 'cameron@emr.com',
      password: 'password123',
      role: 'RECEPTIONIST',
      phone: '+1 555-0105'
    });

    const doctorHouse = await User.create({
      name: 'Dr. Gregory House',
      email: 'house@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Diagnostics & Internal Medicine',
      phone: '+1 555-0102'
    });

    const doctorGrey = await User.create({
      name: 'Dr. Meredith Grey',
      email: 'grey@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'General Surgery',
      phone: '+1 555-0103'
    });

    const doctorStrange = await User.create({
      name: 'Dr. Stephen Strange',
      email: 'strange@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Neurology',
      phone: '+1 555-0104'
    });

    const doctorCuddy = await User.create({
      name: 'Dr. Lisa Cuddy',
      email: 'cuddy@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Endocrinology & Administration',
      phone: '+1 555-0106'
    });

    // 2. Doctor Schedules (Diverse edge cases: 10m, 15m, 30m slot durations, multiple shifts & lunch breaks)
    const standardDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Dr. House: Mon-Sat, 15m slots, 2 sessions, 12:00-13:00 lunch break
    await DoctorSchedule.create({
      doctor: doctorHouse._id,
      weeklySchedule: standardDays.map(day => ({
        day,
        isActive: true,
        slotDuration: 15,
        sessions: [
          { name: 'Morning Session', startTime: '09:00', endTime: '12:00' },
          { name: 'Afternoon Clinic', startTime: '13:00', endTime: '17:00' }
        ],
        breaks: [
          { name: 'Lunch Break', startTime: '12:00', endTime: '13:00' }
        ]
      }))
    });

    // Dr. Grey: Mon-Fri, 30m slots (surgical consults), 08:30-11:30 and 13:30-16:30
    await DoctorSchedule.create({
      doctor: doctorGrey._id,
      weeklySchedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        day,
        isActive: true,
        slotDuration: 30,
        sessions: [
          { name: 'Pre-Op Consultations', startTime: '08:30', endTime: '11:30' },
          { name: 'Post-Op Followups', startTime: '13:30', endTime: '16:30' }
        ],
        breaks: [
          { name: 'OR Sterilization & Rest', startTime: '11:30', endTime: '13:30' }
        ]
      }))
    });

    // Dr. Strange: Mon, Wed, Fri only, 20m slots, 10:00-14:00 continuous shift
    await DoctorSchedule.create({
      doctor: doctorStrange._id,
      weeklySchedule: ['Monday', 'Wednesday', 'Friday'].map(day => ({
        day,
        isActive: true,
        slotDuration: 20,
        sessions: [
          { name: 'Neuro Consults', startTime: '10:00', endTime: '14:00' }
        ],
        breaks: []
      }))
    });

    // 3. Patients (Various age groups, genders, and realistic contact details)
    const patients = await Patient.create([
      {
        patientId: 'PAT-100201',
        name: 'Johnathan Doe',
        phone: '9876543210',
        email: 'john.doe@example.com',
        gender: 'Male',
        age: 42,
        address: '742 Evergreen Terrace, Springfield'
      },
      {
        patientId: 'PAT-100202',
        name: 'Jane Smith',
        phone: '9876543211',
        email: 'jane.smith@example.com',
        gender: 'Female',
        age: 29,
        address: '124 Conch Street, Bikini Bottom'
      },
      {
        patientId: 'PAT-100203',
        name: 'Robert Miller',
        phone: '9876543212',
        email: 'robert.m@example.com',
        gender: 'Male',
        age: 58,
        address: '221B Baker Street, London'
      },
      {
        patientId: 'PAT-100204',
        name: 'Eleanor Vance',
        phone: '9876543213',
        email: 'eleanor.v@example.com',
        gender: 'Female',
        age: 34,
        address: '84 Beacon Street, Boston'
      },
      {
        patientId: 'PAT-100205',
        name: 'Marcus Brody',
        phone: '9876543214',
        email: 'marcus.brody@example.com',
        gender: 'Male',
        age: 63,
        address: '15 Crescent Way, New York'
      },
      {
        patientId: 'PAT-100206',
        name: 'Sophia Patel',
        phone: '9876543215',
        email: 'sophia.patel@example.com',
        gender: 'Female',
        age: 21,
        address: '42 Park Avenue, San Jose'
      }
    ]);

    // 4. Appointments across ALL 4 Workflow Statuses: Scheduled, Arrived, Completed, Cancelled
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Helper for future dates
    const getFutureDate = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const dateTomorrow = getFutureDate(1);
    const dateNextWeek = getFutureDate(5);

    await Appointment.create([
      // Status 1: Scheduled (Upcoming for Dr. House tomorrow)
      {
        appointmentNumber: 'APP-20261016-1011',
        patient: patients[0]._id,
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateTomorrow,
        slotStartTime: '09:00',
        slotEndTime: '09:15',
        status: 'Scheduled',
        purpose: 'Persistent unexplainable joint pain and fever',
        notes: 'Patient allergic to penicillin. Referred from clinic.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-20261016-1012',
        patient: patients[1]._id,
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateTomorrow,
        slotStartTime: '09:15',
        slotEndTime: '09:30',
        status: 'Scheduled',
        purpose: 'Follow-up blood panel review',
        notes: 'Fasting labs done yesterday.',
        createdBy: receptionist1._id
      },

      // Status 2: Arrived (Waiting in clinic lobby today!)
      {
        appointmentNumber: 'APP-20261015-2011',
        patient: patients[2]._id,
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '14:00',
        slotEndTime: '14:15',
        status: 'Arrived',
        purpose: 'Severe migraine aura and hypertension check',
        notes: 'Patient checked in at front desk; vitals BP 145/95, Pulse 82.',
        createdBy: receptionist1._id
      },

      // Status 3: Completed (Fully consulted with doctor consultation notes!)
      {
        appointmentNumber: 'APP-20261015-3011',
        patient: patients[3]._id,
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: todayStr,
        slotStartTime: '08:30',
        slotEndTime: '09:00',
        status: 'Completed',
        purpose: 'Post-appendectomy suture inspection',
        notes: 'Incision site clean and dry.',
        consultationNotes: 'Wound healing excellently without erythema. Sutures removed. Prescribed topical antiseptic cream. Cleared for light cardiovascular exercise next week.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-20261015-3012',
        patient: patients[4]._id,
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: todayStr,
        slotStartTime: '10:00',
        slotEndTime: '10:20',
        status: 'Completed',
        purpose: 'Electromyography (EMG) neuropathy screening',
        notes: 'Complaining of peripheral tingling in fingers.',
        consultationNotes: 'Bilateral median nerve conduction velocity within normal limits. Mild ulnar nerve entrapment at elbow noted. Ergonomic wrist splint recommended.',
        createdBy: receptionist2._id
      },

      // Status 4: Cancelled (Edge case testing: verifies that slot is freed up for rebooking)
      {
        appointmentNumber: 'APP-20261016-4011',
        patient: patients[5]._id,
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateTomorrow,
        slotStartTime: '10:00',
        slotEndTime: '10:15',
        status: 'Cancelled',
        purpose: 'General checkup',
        notes: 'Cancelled due to patient out-of-town travel.',
        cancelledReason: 'Patient rescheduled for next month via phone',
        createdBy: receptionist1._id
      },

      // Future appointment for Dr. Grey
      {
        appointmentNumber: 'APP-20261020-5011',
        patient: patients[1]._id,
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: dateNextWeek,
        slotStartTime: '14:00',
        slotEndTime: '14:30',
        status: 'Scheduled',
        purpose: 'Laparoscopic consultation',
        notes: 'Ultrasound report attached in physical file.',
        createdBy: receptionist2._id
      }
    ]);

    // 5. Audit Log Trail (Demonstrates compliance tracking across actions and users)
    await AuditLog.create([
      {
        user: admin._id,
        userName: admin.name,
        role: admin.role,
        action: 'LOGIN',
        entity: 'User',
        entityId: admin._id.toString(),
        details: { email: admin.email, ip: '127.0.0.1' },
        timestamp: new Date(Date.now() - 3600000 * 5)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: 'APP-20261016-1011',
        details: { patientName: 'Johnathan Doe', doctor: 'Dr. Gregory House', date: dateTomorrow, slot: '09:00' },
        timestamp: new Date(Date.now() - 3600000 * 4)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'PATIENT_ARRIVED',
        entity: 'Appointment',
        entityId: 'APP-20261015-2011',
        details: { status: 'Arrived', patient: 'Robert Miller', checkedInAt: '13:55' },
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        user: doctorGrey._id,
        userName: doctorGrey.name,
        role: doctorGrey.role,
        action: 'APPOINTMENT_UPDATED',
        entity: 'Appointment',
        entityId: 'APP-20261015-3011',
        details: { status: 'Completed', notesAdded: true },
        timestamp: new Date(Date.now() - 3600000 * 1)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'APPOINTMENT_CANCELLED',
        entity: 'Appointment',
        entityId: 'APP-20261016-4011',
        details: { reason: 'Patient rescheduled for next month via phone' },
        timestamp: new Date(Date.now() - 1800000)
      }
    ]);

    console.log('✅ Comprehensive Enterprise dataset populated in Atlas!');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
};

module.exports = { seedInitialData };
