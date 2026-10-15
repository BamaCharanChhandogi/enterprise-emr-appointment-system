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

    // 6 Specialized Physicians
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

    const doctorYang = await User.create({
      name: 'Dr. Cristina Yang',
      email: 'yang@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Cardiology',
      phone: '+1 555-0107'
    });

    const doctorShepherd = await User.create({
      name: 'Dr. Derek Shepherd',
      email: 'shepherd@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Neurosurgery & Spine',
      phone: '+1 555-0108'
    });

    // 2. Doctor Schedules (Diverse edge cases: 15m, 20m, 30m slot durations, multiple shifts & lunch breaks)
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Dr. House: Mon-Sun, 15m slots, 2 sessions (09:00-12:00, 13:00-17:00), 12:00-13:00 lunch break
    await DoctorSchedule.create({
      doctor: doctorHouse._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 15,
        sessions: [
          { name: 'Morning Clinic', startTime: '09:00', endTime: '12:00' },
          { name: 'Afternoon OPD', startTime: '13:00', endTime: '17:00' }
        ],
        breaks: [{ name: 'Lunch Break', startTime: '12:00', endTime: '13:00' }]
      }))
    });

    // Dr. Grey: Mon-Sun, 30m surgical slots, 08:30-11:30 and 13:30-16:30
    await DoctorSchedule.create({
      doctor: doctorGrey._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 30,
        sessions: [
          { name: 'Pre-Op Consultations', startTime: '08:30', endTime: '11:30' },
          { name: 'Post-Op Followups', startTime: '13:30', endTime: '16:30' }
        ],
        breaks: [{ name: 'OR Sterilization & Rest', startTime: '11:30', endTime: '13:30' }]
      }))
    });

    // Dr. Strange: Mon-Sun, 20m neuro slots, 10:00-14:00 and 15:00-18:00
    await DoctorSchedule.create({
      doctor: doctorStrange._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 20,
        sessions: [
          { name: 'Neuro Consults', startTime: '10:00', endTime: '14:00' },
          { name: 'EEG & EMG Review', startTime: '15:00', endTime: '18:00' }
        ],
        breaks: [{ name: 'Clinical Break', startTime: '14:00', endTime: '15:00' }]
      }))
    });

    // Dr. Cuddy: Mon-Sun, 15m endocrine slots, 09:30-12:30 and 14:00-16:30
    await DoctorSchedule.create({
      doctor: doctorCuddy._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 15,
        sessions: [
          { name: 'Diabetic Clinic', startTime: '09:30', endTime: '12:30' },
          { name: 'Thyroid Consults', startTime: '14:00', endTime: '16:30' }
        ],
        breaks: [{ name: 'Lunch', startTime: '12:30', endTime: '14:00' }]
      }))
    });

    // Dr. Yang: Mon-Sun, 20m cardiology slots, 08:30-12:30 and 13:30-16:30
    await DoctorSchedule.create({
      doctor: doctorYang._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 20,
        sessions: [
          { name: 'Cardiac Diagnostics', startTime: '08:30', endTime: '12:30' },
          { name: 'Post-Angio Review', startTime: '13:30', endTime: '16:30' }
        ],
        breaks: [{ name: 'Cath Lab Rest', startTime: '12:30', endTime: '13:30' }]
      }))
    });

    // Dr. Shepherd: Mon-Sun, 30m neurosurgery & spine slots, 09:00-13:00 and 14:00-17:00
    await DoctorSchedule.create({
      doctor: doctorShepherd._id,
      weeklySchedule: allDays.map((day) => ({
        day,
        isActive: true,
        slotDuration: 30,
        sessions: [
          { name: 'Spine & Brain Consults', startTime: '09:00', endTime: '13:00' },
          { name: 'Trauma Evaluation', startTime: '14:00', endTime: '17:00' }
        ],
        breaks: [{ name: 'OR Sterilization', startTime: '13:00', endTime: '14:00' }]
      }))
    });

    // 3. 22 Diverse Patients covering pediatric, geriatric, chronic, surgical, and acute edge cases
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
        address: '124 Conch Street, Pacific Bay'
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
      },
      {
        patientId: 'PAT-100207',
        name: 'Liam Chen',
        phone: '9876543216',
        email: 'liam.parent@example.com',
        gender: 'Male',
        age: 6,
        address: '19 Maple Drive, Bellevue'
      },
      {
        patientId: 'PAT-100208',
        name: 'Margaret Thatcher-Jones',
        phone: '9876543217',
        email: 'margaret.tj@example.com',
        gender: 'Female',
        age: 84,
        address: '10 Downing Court, Cambridge'
      },
      {
        patientId: 'PAT-100209',
        name: 'Devon Washington',
        phone: '9876543218',
        email: 'devon.w@example.com',
        gender: 'Male',
        age: 37,
        address: '500 Madison Ave, Seattle'
      },
      {
        patientId: 'PAT-100210',
        name: 'Aaliyah Khan',
        phone: '9876543219',
        email: 'aaliyah.k@example.com',
        gender: 'Female',
        age: 17,
        address: '77 Willow Creek Road, Austin'
      },
      {
        patientId: 'PAT-100211',
        name: 'Carlos Rodriguez',
        phone: '9876543220',
        email: 'carlos.r@example.com',
        gender: 'Male',
        age: 49,
        address: '102 Sunset Boulevard, Miami'
      },
      {
        patientId: 'PAT-100212',
        name: 'Beatriz Santos',
        phone: '9876543221',
        email: 'beatriz.s@example.com',
        gender: 'Female',
        age: 52,
        address: '33 Harbor View, San Diego'
      },
      {
        patientId: 'PAT-100213',
        name: 'Vikram Sengupta',
        phone: '9876543222',
        email: 'vikram.s@example.com',
        gender: 'Male',
        age: 31,
        address: '88 Tech Hub Way, Denver'
      },
      {
        patientId: 'PAT-100214',
        name: 'Chloe Dubois',
        phone: '9876543223',
        email: 'chloe.d@example.com',
        gender: 'Female',
        age: 26,
        address: '14 Rue Lafayette, Chicago'
      },
      {
        patientId: 'PAT-100215',
        name: 'Samuel O\'Connor',
        phone: '9876543224',
        email: 'samuel.oc@example.com',
        gender: 'Male',
        age: 68,
        address: '92 Highfield Terrace, Philadelphia'
      },
      {
        patientId: 'PAT-100216',
        name: 'Mei-Ling Zhou',
        phone: '9876543225',
        email: 'meiling.z@example.com',
        gender: 'Female',
        age: 45,
        address: '61 Lotus Lane, Portland'
      },
      {
        patientId: 'PAT-100217',
        name: 'Fatima Al-Mansoor',
        phone: '9876543226',
        email: 'fatima.am@example.com',
        gender: 'Female',
        age: 38,
        address: '150 Oasis Springs, Phoenix'
      },
      {
        patientId: 'PAT-100218',
        name: 'Dmitri Volkov',
        phone: '9876543227',
        email: 'dmitri.v@example.com',
        gender: 'Male',
        age: 55,
        address: '24 Nordic Pines, Minneapolis'
      },
      {
        patientId: 'PAT-100219',
        name: 'Zara Larsson',
        phone: '9876543228',
        email: 'zara.l@example.com',
        gender: 'Female',
        age: 23,
        address: '304 Silver Lake, Los Angeles'
      },
      {
        patientId: 'PAT-100220',
        name: 'Patrick Kelly',
        phone: '9876543229',
        email: 'patrick.k@example.com',
        gender: 'Male',
        age: 71,
        address: '17 Shamrock Hill, Dublin'
      },
      {
        patientId: 'PAT-100221',
        name: 'Ananya Sharma',
        phone: '9876543230',
        email: 'ananya.s@example.com',
        gender: 'Female',
        age: 33,
        address: '55 Gateway Boulevard, Dallas'
      },
      {
        patientId: 'PAT-100222',
        name: 'Lucas Moreau',
        phone: '9876543231',
        email: 'lucas.m@example.com',
        gender: 'Other',
        age: 19,
        address: '12 University Square, Berkeley'
      }
    ]);

    // 4. Appointments across all 4 statuses & multiple date windows (28 Total Records)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const getShiftedDate = (dayOffset) => {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      return d.toISOString().split('T')[0];
    };

    const dateYesterday = getShiftedDate(-1);
    const dateThreeDaysAgo = getShiftedDate(-3);
    const dateLastWeek = getShiftedDate(-7);
    const dateTomorrow = getShiftedDate(1);
    const dateNextWeek = getShiftedDate(5);
    const dateNextMonth = getShiftedDate(20);

    await Appointment.create([
      // ==========================================
      // GROUP 1: TODAY'S ARRIVED PATIENTS (WAITING IN LOBBY QUEUE)
      // ==========================================
      {
        appointmentNumber: 'APP-1001',
        patient: patients[2]._id, // Robert Miller (58M)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '09:00',
        slotEndTime: '09:15',
        status: 'Arrived',
        purpose: 'Severe unilateral migraine with visual aura & hypertension spikes',
        notes: 'Checked in at front desk. Vitals: BP 150/95 mmHg, Pulse 84 bpm. Priority intake.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1002',
        patient: patients[5]._id, // Sophia Patel (21F)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '09:15',
        slotEndTime: '09:30',
        status: 'Arrived',
        purpose: 'Acute right knee swelling following college basketball match',
        notes: 'Patient ambulating with crutches. Ice applied at triage station.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1003',
        patient: patients[6]._id, // Liam Chen (6M, Child)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '09:30',
        slotEndTime: '09:45',
        status: 'Arrived',
        purpose: 'Persistent high fever (102°F) and acute otitis media earache',
        notes: 'Accompanied by mother. Pediatric fever syrup administered 2h ago.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1004',
        patient: patients[12]._id, // Vikram Sengupta (31M)
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: todayStr,
        slotStartTime: '10:00',
        slotEndTime: '10:20',
        status: 'Arrived',
        purpose: 'Bilateral wrist numbness and thumb muscle weakness (RSI investigation)',
        notes: 'Arrived on time. Physical therapy referral forms ready.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1005',
        patient: patients[14]._id, // Samuel O'Connor (68M)
        doctor: doctorYang._id,
        department: 'Cardiology',
        date: todayStr,
        slotStartTime: '08:30',
        slotEndTime: '08:50',
        status: 'Arrived',
        purpose: 'Post-CABG 6-month cardiac stent surveillance and INR check',
        notes: 'Fasting lipid panel and ECG completed at Central Lab.',
        createdBy: receptionist1._id
      },

      // ==========================================
      // GROUP 2: TODAY'S SCHEDULED PATIENTS (PENDING FRONT-DESK INTAKE)
      // ==========================================
      {
        appointmentNumber: 'APP-1006',
        patient: patients[8]._id, // Devon Washington (37M)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '13:00',
        slotEndTime: '13:15',
        status: 'Scheduled',
        purpose: 'Executive preventive wellness screen and liver enzyme follow-up',
        notes: 'Non-smoker, asymptomatic. Requested blood panel copy.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1007',
        patient: patients[9]._id, // Aaliyah Khan (17F)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '13:15',
        slotEndTime: '13:30',
        status: 'Scheduled',
        purpose: 'Exercise-induced bronchospasm and inhaler dosage adjustment',
        notes: 'Peak flow meter reading: 380 L/min at home baseline.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1008',
        patient: patients[11]._id, // Beatriz Santos (52F)
        doctor: doctorCuddy._id,
        department: 'Endocrinology & Administration',
        date: todayStr,
        slotStartTime: '14:00',
        slotEndTime: '14:15',
        status: 'Scheduled',
        purpose: 'Post-menopausal DEXA bone density scan review & Vitamin D3 check',
        notes: 'T-score -2.6 at femoral neck. Family history of osteoporosis.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1009',
        patient: patients[13]._id, // Chloe Dubois (26F)
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: todayStr,
        slotStartTime: '13:30',
        slotEndTime: '14:00',
        status: 'Scheduled',
        purpose: 'Recurrent right lower quadrant abdominal cramping evaluation',
        notes: 'Ultrasound Pelvis scheduled 30m prior to consultation.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1010',
        patient: patients[19]._id, // Patrick Kelly (71M)
        doctor: doctorYang._id,
        department: 'Cardiology',
        date: todayStr,
        slotStartTime: '14:00',
        slotEndTime: '14:20',
        status: 'Scheduled',
        purpose: 'COPD Stage 2 with exertional dyspnea and peripheral ankle edema',
        notes: 'Oxygen saturation monitored at 94% on room air last visit.',
        createdBy: receptionist1._id
      },

      // ==========================================
      // GROUP 3: TODAY'S COMPLETED CONSULTATIONS (WITH FULL VITALS & RX)
      // ==========================================
      {
        appointmentNumber: 'APP-1011',
        patient: patients[3]._id, // Eleanor Vance (34F)
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: todayStr,
        slotStartTime: '08:30',
        slotEndTime: '09:00',
        status: 'Completed',
        purpose: 'Post-laparoscopic appendectomy surgical suture inspection',
        notes: 'Incision site clean and dry. No drainage.',
        consultationNotes: '[VITALS: BP: 118/76 | Pulse: 72 bpm | Temp: 98.4°F | SpO2: 99%]\n\nWound healing excellently without erythema or seroma. Surgical sutures removed safely. Prescribed topical silicone scar gel and advised light walking. Cleared for regular activities in 1 week.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1012',
        patient: patients[4]._id, // Marcus Brody (63M)
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: todayStr,
        slotStartTime: '10:20',
        slotEndTime: '10:40',
        status: 'Completed',
        purpose: 'Electromyography (EMG) neuropathy screening for burning foot pain',
        notes: 'Diabetic history of 12 years on oral hypoglycemics.',
        consultationNotes: '[VITALS: BP: 132/84 | Pulse: 76 bpm | Temp: 98.6°F | SpO2: 98%]\n\nBilateral lower extremity nerve conduction velocity indicates mild symmetric sensory polyneuropathy. Prescribed Tab Gabapentin 300mg QHS, tight glycemic control emphasized. Diabetic footwear advised.',
        createdBy: receptionist2._id
      },

      // ==========================================
      // GROUP 4: HISTORICAL CONSULTATIONS (PAST DATES - FILTER & AUDIT TESTING)
      // ==========================================
      {
        appointmentNumber: 'APP-1013',
        patient: patients[10]._id, // Carlos Rodriguez (49M)
        doctor: doctorCuddy._id,
        department: 'Endocrinology & Administration',
        date: dateYesterday,
        slotStartTime: '09:30',
        slotEndTime: '09:45',
        status: 'Completed',
        purpose: 'Uncontrolled Type 2 Diabetes follow-up with elevated HbA1c (8.4%)',
        notes: 'Complained of gastrointestinal distress with immediate-release Metformin.',
        consultationNotes: '[VITALS: BP: 138/88 | Pulse: 78 bpm | Temp: 98.2°F | SpO2: 98%]\n\nSwitched patient to Metformin Extended-Release (ER) 500mg BID with dinner to reduce GI symptoms. Added Empagliflozin 10mg OD. Referral to hospital nutritionist booked.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1014',
        patient: patients[7]._id, // Margaret Thatcher-Jones (84F, Geriatric)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateYesterday,
        slotStartTime: '10:30',
        slotEndTime: '10:45',
        status: 'Completed',
        purpose: 'Geriatric polypharmacy review and sudden postural dizziness episodes',
        notes: 'Current medications: 7 daily prescriptions. Daughter present.',
        consultationNotes: '[VITALS: BP: 126/78 (Sitting), 108/70 (Standing) | Pulse: 68 bpm | Temp: 97.9°F | SpO2: 97%]\n\nConfirmed mild orthostatic hypotension. De-prescribed evening sedative. Tapered hydrochlorothiazide dose to 12.5mg. Recommended hydration and compression stockings.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1015',
        patient: patients[16]._id, // Fatima Al-Mansoor (38F)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateThreeDaysAgo,
        slotStartTime: '11:00',
        slotEndTime: '11:15',
        status: 'Completed',
        purpose: 'Severe contact dermatitis rash on neck and wrists after new cosmetics',
        notes: 'No respiratory compromise or angioedema.',
        consultationNotes: '[VITALS: BP: 120/80 | Pulse: 74 bpm | Temp: 98.4°F | SpO2: 99%]\n\nAllergic contact dermatitis secondary to fragrance mix. Prescribed Hydrocortisone butyrate 0.1% topical cream BID x 5 days and Cetirizine 10mg OD. Patch test scheduled.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1016',
        patient: patients[17]._id, // Dmitri Volkov (55M)
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: dateThreeDaysAgo,
        slotStartTime: '11:00',
        slotEndTime: '11:20',
        status: 'Completed',
        purpose: 'Obstructive Sleep Apnea diagnostic polysomnography follow-up',
        notes: 'Epworth Sleepiness Scale score: 16/24 (Severe daytime somnolence).',
        consultationNotes: '[VITALS: BP: 142/90 | Pulse: 80 bpm | Temp: 98.6°F | SpO2: 95%]\n\nApnea-Hypopnea Index (AHI) calculated at 34 events/hour (Severe OSA). Auto-CPAP titration recommended at 9-13 cmH2O with heated humidifier. Advised against commercial driving until treated.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1017',
        patient: patients[15]._id, // Mei-Ling Zhou (45F)
        doctor: doctorCuddy._id,
        department: 'Endocrinology & Administration',
        date: dateLastWeek,
        slotStartTime: '10:00',
        slotEndTime: '10:15',
        status: 'Completed',
        purpose: 'Asymptomatic thyroid nodule (TI-RADS 3) surveillance',
        notes: 'TSH: 2.1 mIU/L, Free T4: 1.2 ng/dL (Normal).',
        consultationNotes: '[VITALS: BP: 116/74 | Pulse: 70 bpm | Temp: 98.4°F | SpO2: 100%]\n\nRepeat thyroid sonogram demonstrates stable 1.1cm isoechoic nodule in right lobe without microcalcifications. Low risk. No biopsy indicated at present. Repeat ultrasound in 12 months.',
        createdBy: receptionist1._id
      },

      // ==========================================
      // GROUP 5: CANCELLED APPOINTMENTS (SLOT RELEASE & AUDIT LOG TESTING)
      // ==========================================
      {
        appointmentNumber: 'APP-1018',
        patient: patients[0]._id, // Johnathan Doe (42M)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: todayStr,
        slotStartTime: '10:00',
        slotEndTime: '10:15',
        status: 'Cancelled',
        purpose: 'Routine checkup for seasonal allergic rhinitis',
        notes: 'Slot freed up and re-opened in scheduler.',
        cancelledReason: 'Patient rescheduled due to transportation breakdown',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1019',
        patient: patients[18]._id, // Zara Larsson (23F)
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: todayStr,
        slotStartTime: '11:00',
        slotEndTime: '11:20',
        status: 'Cancelled',
        purpose: 'Episodic tension headache and stress-induced muscle tremors',
        notes: 'Front desk called twice; no response.',
        cancelledReason: 'Patient no-show after 20 minute grace period',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1020',
        patient: patients[20]._id, // Ananya Sharma (33F)
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: dateYesterday,
        slotStartTime: '14:00',
        slotEndTime: '14:30',
        status: 'Cancelled',
        purpose: 'Elective cholecystectomy surgical consultation',
        notes: 'Urgent notification sent to patient via SMS.',
        cancelledReason: 'Physician unavailable / emergency OR surgery call',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1021',
        patient: patients[21]._id, // Lucas Moreau (19, Other)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateYesterday,
        slotStartTime: '15:00',
        slotEndTime: '15:15',
        status: 'Cancelled',
        purpose: 'College athlete pre-season health clearance physical',
        notes: 'Duplicate registration detected.',
        cancelledReason: 'Patient requested cancellation - booked alternate campus clinic',
        createdBy: receptionist1._id
      },

      // ==========================================
      // GROUP 6: FUTURE APPOINTMENTS (TOMORROW, NEXT WEEK & NEXT MONTH)
      // ==========================================
      {
        appointmentNumber: 'APP-1022',
        patient: patients[0]._id, // Johnathan Doe (42M)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateTomorrow,
        slotStartTime: '09:00',
        slotEndTime: '09:15',
        status: 'Scheduled',
        purpose: 'Rescheduled consultation: Unexplained joint pain & fever spikes',
        notes: 'Allergic to Penicillin. Rebooked from today.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1023',
        patient: patients[1]._id, // Jane Smith (29F)
        doctor: doctorHouse._id,
        department: 'Diagnostics & Internal Medicine',
        date: dateTomorrow,
        slotStartTime: '09:15',
        slotEndTime: '09:30',
        status: 'Scheduled',
        purpose: 'Prenatal first trimester comprehensive blood panel review',
        notes: 'Fasting glucose and thyroid profile reports attached.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1024',
        patient: patients[8]._id, // Devon Washington (37M)
        doctor: doctorGrey._id,
        department: 'General Surgery',
        date: dateTomorrow,
        slotStartTime: '08:30',
        slotEndTime: '09:00',
        status: 'Scheduled',
        purpose: 'Right inguinal hernia physical exam and laparoscopic repair counseling',
        notes: 'Symptom duration 3 months, exacerbated with heavy lifting.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1025',
        patient: patients[13]._id, // Chloe Dubois (26F)
        doctor: doctorStrange._id,
        department: 'Neurology',
        date: dateTomorrow,
        slotStartTime: '10:00',
        slotEndTime: '10:20',
        status: 'Scheduled',
        purpose: 'Vestibular migraine evaluation with positional vertigo',
        notes: 'Audiogram reported normal middle ear pressures.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1026',
        patient: patients[14]._id, // Samuel O'Connor (68M)
        doctor: doctorYang._id,
        department: 'Cardiology',
        date: dateNextWeek,
        slotStartTime: '09:00',
        slotEndTime: '09:20',
        status: 'Scheduled',
        purpose: '30-Day post-stent cardiac rehabilitation treadmill stress test',
        notes: 'Patient advised to bring running shoes and hold beta-blocker morning of test.',
        createdBy: receptionist1._id
      },
      {
        appointmentNumber: 'APP-1027',
        patient: patients[7]._id, // Margaret Thatcher-Jones (84F)
        doctor: doctorCuddy._id,
        department: 'Endocrinology & Administration',
        date: dateNextWeek,
        slotStartTime: '10:00',
        slotEndTime: '10:15',
        status: 'Scheduled',
        purpose: 'Severe bilateral knee osteoarthritis intra-articular injection follow-up',
        notes: 'Wheelchair access requested at front portico.',
        createdBy: receptionist2._id
      },
      {
        appointmentNumber: 'APP-1028',
        patient: patients[19]._id, // Patrick Kelly (71M)
        doctor: doctorShepherd._id,
        department: 'Neurosurgery & Spine',
        date: dateNextMonth,
        slotStartTime: '09:30',
        slotEndTime: '10:00',
        status: 'Scheduled',
        purpose: 'Lumbar spinal stenosis with neurogenic claudication MRI review',
        notes: 'MRI Lumbar Spine films to be brought from Diagnostic Imaging.',
        createdBy: receptionist1._id
      }
    ]);

    // 5. Audit Log Trail (Tracking actions across users and entities for compliance)
    await AuditLog.create([
      {
        user: admin._id,
        userName: admin.name,
        role: admin.role,
        action: 'LOGIN',
        entity: 'User',
        entityId: admin._id.toString(),
        details: { email: admin.email, ip: '127.0.0.1' },
        timestamp: new Date(Date.now() - 3600000 * 6)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: 'APP-1001',
        details: { patient: 'Robert Miller', doctor: 'Dr. Gregory House', slot: '09:00', status: 'Scheduled' },
        timestamp: new Date(Date.now() - 3600000 * 5)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'PATIENT_ARRIVED',
        entity: 'Appointment',
        entityId: 'APP-1001',
        details: { patient: 'Robert Miller', checkedInAt: '08:52', token: 'APP-1001' },
        timestamp: new Date(Date.now() - 3600000 * 3)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'PATIENT_ARRIVED',
        entity: 'Appointment',
        entityId: 'APP-1002',
        details: { patient: 'Sophia Patel', checkedInAt: '09:05', token: 'APP-1002' },
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        user: doctorGrey._id,
        userName: doctorGrey.name,
        role: doctorGrey.role,
        action: 'APPOINTMENT_UPDATED',
        entity: 'Appointment',
        entityId: 'APP-1011',
        details: { patient: 'Eleanor Vance', status: 'Completed', notesRecorded: true },
        timestamp: new Date(Date.now() - 3600000 * 1)
      },
      {
        user: receptionist1._id,
        userName: receptionist1.name,
        role: receptionist1.role,
        action: 'APPOINTMENT_CANCELLED',
        entity: 'Appointment',
        entityId: 'APP-1018',
        details: { patient: 'Johnathan Doe', reason: 'Patient rescheduled due to transportation breakdown' },
        timestamp: new Date(Date.now() - 1800000)
      }
    ]);

    console.log('✅ Comprehensive Enterprise dataset populated in Atlas (28 appointments, 22 patients, 6 physicians, 4 statuses)!');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
};

module.exports = { seedInitialData };
