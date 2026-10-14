const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const Patient = require('../models/Patient');

const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already seeded
    }

    console.log('🌱 Database is empty. Seeding initial EMR accounts & schedules...');

    // 1. Create Super Admin
    const admin = await User.create({
      name: 'Dr. Sarah Mitchell (Super Admin)',
      email: 'admin@emr.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
      phone: '+1 555-0100'
    });

    // 2. Create Receptionist
    const receptionist = await User.create({
      name: 'James Wilson (Front Desk)',
      email: 'reception@emr.com',
      password: 'password123',
      role: 'RECEPTIONIST',
      phone: '+1 555-0101'
    });

    // 3. Create Doctors across departments
    const doctor1 = await User.create({
      name: 'Dr. Gregory House',
      email: 'house@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Diagnostics & Internal Medicine',
      phone: '+1 555-0102'
    });

    const doctor2 = await User.create({
      name: 'Dr. Meredith Grey',
      email: 'grey@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'General Surgery',
      phone: '+1 555-0103'
    });

    const doctor3 = await User.create({
      name: 'Dr. Stephen Strange',
      email: 'strange@emr.com',
      password: 'password123',
      role: 'DOCTOR',
      department: 'Neurology',
      phone: '+1 555-0104'
    });

    // 4. Create Schedules for each doctor (Mon-Sat, 9-12 morning, 13-17 evening, lunch 12-13, 15 min slots)
    const doctors = [doctor1, doctor2, doctor3];
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const doc of doctors) {
      const weeklySchedule = workingDays.map(day => ({
        day,
        isActive: true,
        slotDuration: 15,
        sessions: [
          { name: 'Morning Session', startTime: '09:00', endTime: '12:00' },
          { name: 'Afternoon / Evening Session', startTime: '13:00', endTime: '17:00' }
        ],
        breaks: [
          { name: 'Lunch Break', startTime: '12:00', endTime: '13:00' }
        ]
      }));

      await DoctorSchedule.create({
        doctor: doc._id,
        weeklySchedule
      });
    }

    // 5. Create Sample Patients
    await Patient.create([
      {
        patientId: 'PAT-100201',
        name: 'Johnathan Doe',
        phone: '9876543210',
        email: 'john.doe@example.com',
        gender: 'Male',
        age: 38,
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
        age: 52,
        address: '221B Baker Street, London'
      }
    ]);

    console.log('✅ Demo accounts seeded successfully:');
    console.log('   Admin:        admin@emr.com / password123');
    console.log('   Receptionist: reception@emr.com / password123');
    console.log('   Doctor House: house@emr.com / password123');
    console.log('   Doctor Grey:  grey@emr.com / password123');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
};

module.exports = { seedInitialData };
