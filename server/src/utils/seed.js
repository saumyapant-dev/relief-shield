/**
 * Database Seeder
 * 
 * Pre-populates the database with:
 * - 5 test users (one per role: victim, volunteer, ngo, donor, admin) with bcrypt-hashed passwords.
 * - 5 realistic emergency requests featuring GeoJSON Point locations (2dsphere ready) and varied urgencies.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');

const seedData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/relief_shield';

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[Seeder] Connected to MongoDB');
    }

    // Check if users already exist
    const count = await User.countDocuments();
    if (count > 0 && process.argv[2] !== '--force') {
      console.log(`[Seeder] Database already contains ${count} users. Skipping seed. (Use --force to reset)`);
      return;
    }

    console.log('[Seeder] Clearing old records...');
    await User.deleteMany({});
    await EmergencyRequest.deleteMany({});

    console.log('[Seeder] Hashing passwords with bcrypt...');
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 1. Create Test Users
    console.log('[Seeder] Creating test users for each role...');
    const users = await User.create([
      {
        name: 'Sarah Connor (Victim)',
        email: 'victim@example.com',
        passwordHash,
        role: 'victim',
        verificationStatus: 'verified',
      },
      {
        name: 'Dr. Marcus Brody (Volunteer)',
        email: 'volunteer@example.com',
        passwordHash,
        role: 'volunteer',
        skills: ['Medical', 'First Aid', 'Triage', 'Search & Rescue'],
        serviceRadius: 20,
        verificationStatus: 'verified',
      },
      {
        name: 'Global Relief Alliance (NGO)',
        email: 'ngo@example.com',
        passwordHash,
        role: 'ngo',
        verificationStatus: 'verified',
      },
      {
        name: 'Elena Fisher (Donor)',
        email: 'donor@example.com',
        passwordHash,
        role: 'donor',
        verificationStatus: 'verified',
      },
      {
        name: 'Chief Relief Coordinator (Admin)',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
        verificationStatus: 'verified',
      },
    ]);

    const victimUser = users.find((u) => u.role === 'victim');
    const volunteerUser = users.find((u) => u.role === 'volunteer');

    // 2. Create Sample Emergency Requests
    console.log('[Seeder] Creating sample emergency requests with 2dsphere GeoJSON points...');
    await EmergencyRequest.create([
      {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}-MED01`,
        userId: victimUser._id,
        type: 'Medical',
        description: 'Elderly patient with heart condition requires oxygen cylinders and medical evacuation after flash flood cut off road access.',
        urgency: 'Critical',
        location: {
          type: 'Point',
          // Coordinates: [longitude, latitude]
          coordinates: [-73.9851, 40.7488], // Empire State area
        },
        photoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        status: 'pending',
        assignedVolunteer: null,
        timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}-WAT02`,
        userId: victimUser._id,
        type: 'Water',
        description: 'Drinking water reservoir contaminated by storm surge. 45 stranded residents need clean potable water and purification packs.',
        urgency: 'High',
        location: {
          type: 'Point',
          coordinates: [-73.9712, 40.7648], // Central Park South
        },
        photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        status: 'pending',
        assignedVolunteer: null,
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}-RESC03`,
        userId: victimUser._id,
        type: 'Rescue',
        description: 'Family of four and their dog stranded on residential second-floor porch. Water level rising 1 foot every 30 minutes.',
        urgency: 'Critical',
        location: {
          type: 'Point',
          coordinates: [-73.9902, 40.7306], // Greenwich Village area
        },
        photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        status: 'claimed',
        assignedVolunteer: volunteerUser._id,
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
      {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}-FOOD04`,
        userId: victimUser._id,
        type: 'Food',
        description: 'Emergency community center sheltering 60 children and parents. Urgent need for non-perishable canned food and baby formula.',
        urgency: 'High',
        location: {
          type: 'Point',
          coordinates: [-73.9580, 40.7760], // Upper East Side
        },
        photoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
        status: 'in_progress',
        assignedVolunteer: volunteerUser._id,
        timestamp: new Date(Date.now() - 3600000 * 8),
      },
      {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}-SHEL05`,
        userId: victimUser._id,
        type: 'Shelter',
        description: 'Roof severely damaged by fallen pine tree. Severe rain leaking into living area. Temporary tarps and dry blankets requested.',
        urgency: 'Medium',
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128], // Downtown Manhattan
        },
        photoUrl: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=800&q=80',
        status: 'pending',
        assignedVolunteer: null,
        timestamp: new Date(Date.now() - 3600000 * 12),
      },
    ]);

    console.log('[Seeder] Successfully seeded test users and emergency requests!');
    console.log('[Seeder] Credentials: email: <role>@example.com (victim, volunteer, ngo, donor, admin) | password: password123');
  } catch (err) {
    console.error('[Seeder Error]:', err.message);
  }
};

// Allow running directly via CLI: node src/utils/seed.js
if (require.main === module) {
  seedData().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = seedData;
