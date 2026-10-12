/**
 * Comprehensive Master Database Seed Runner for Hunarmand Pakistan
 * Seeds authentic Pakistani categories, admin, customers, 52 skilled workers,
 * service requests, reviews, dispute reports, and chat conversations
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const {
  User,
  WorkerProfile,
  Category,
  ServiceRequest,
  Review,
  Report,
  Conversation,
  Message,
} = require('../models');
const { categories: seedCategories } = require('./seedCategories');
const sampleWorkers = require('./sampleWorkers');
const logger = require('./logger');

const runSeedAll = async () => {
  try {
    logger.info('--- Starting Hunarmand Pakistan Master Database Seed ---');
    const conn = await connectDB();

    if (!conn || mongoose.connection.readyState !== 1) {
      logger.warn('Notice: MongoDB is currently offline (127.0.0.1:27017).');
      logger.info('To seed real database records:');
      logger.info('1. Start your local MongoDB server (mongod or "net start MongoDB"), OR');
      logger.info('2. Set MONGODB_URI in backend/.env to your MongoDB Atlas cloud database.');
      logger.info('The application will use built-in benchmark mock data catalogs until MongoDB is started.');
      process.exit(0);
    }

    // 1. Clear existing database collections
    logger.info('Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      WorkerProfile.deleteMany({}),
      Category.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Review.deleteMany({}),
      Report.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
    ]);
    logger.success('Collections cleared.');

    // 2. Seed Categories
    logger.info('Seeding trade categories...');
    const createdCategories = await Category.insertMany(seedCategories);
    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.slug] = c._id;
    });
    logger.success(`Seeded ${createdCategories.length} categories.`);

    // 3. Seed Super Admin User
    logger.info('Seeding Super Admin account...');
    const adminUser = await User.create({
      name: 'Super Administrator',
      email: 'admin@hunarmand.pk',
      password: 'Admin1234!',
      phone: '0300-1112233',
      role: 'admin',
      city: 'Islamabad',
      area: 'Sector F-7/2',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    });
    logger.success('Seeded Admin: admin@hunarmand.pk');

    // Sajjad Wazir Administrator Account
    await User.create({
      name: 'Sajjad Wazir',
      email: 'sajjadwazir4459@gmail.com',
      password: 'khan4459',
      phone: '0300-4459445',
      role: 'admin',
      city: 'Islamabad',
      area: 'Sector F-8',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      isActive: true,
    });
    logger.success('Seeded User: sajjadwazir4459@gmail.com');

    // 4. Seed Customers
    logger.info('Seeding Pakistani customer accounts...');
    const customer1 = await User.create({
      name: 'Muhammad Bilal Khan',
      email: 'bilal@gmail.com',
      password: 'Password123!',
      phone: '0321-2345678',
      role: 'customer',
      city: 'Karachi',
      area: 'DHA Phase 6',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    });

    const customer2 = await User.create({
      name: 'Zainab Bibi',
      email: 'zainab@gmail.com',
      password: 'Password123!',
      phone: '0333-7654321',
      role: 'customer',
      city: 'Lahore',
      area: 'Gulberg III',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    });

    const customer3 = await User.create({
      name: 'Hamza Tariq',
      email: 'hamza@gmail.com',
      password: 'Password123!',
      phone: '0345-9876543',
      role: 'customer',
      city: 'D.I. Khan',
      area: 'Cantt Bazaar',
      profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    });
    logger.success('Seeded 3 customer accounts.');

    // 5. Seed Skilled Workers & Worker Profiles (52 workers across Pakistan)
    logger.info(`Seeding ${sampleWorkers.length} skilled Pakistani workers catalog...`);

    const cityCnicPrefixes = {
      Karachi: '42101',
      Lahore: '35201',
      Islamabad: '61101',
      Rawalpindi: '37405',
      Peshawar: '17301',
      Multan: '36302',
      Faisalabad: '33100',
      'D.I. Khan': '12101',
    };

    const emailMap = {
      'Ustad Tariq Mehmood': 'tariq@hunarmand.pk',
      'Altaf Hussain': 'altaf@hunarmand.pk',
      'Muhammad Rashid': 'rashid@hunarmand.pk',
      'Malik Shafiq': 'shafiq@hunarmand.pk',
      'Gul Muhammad': 'gul@hunarmand.pk',
    };

    const seededWorkers = [];

    for (let i = 0; i < sampleWorkers.length; i++) {
      const w = sampleWorkers[i];
      const prefix = cityCnicPrefixes[w.city] || '35201';
      const middle = String(1000000 + (i + 1) * 1749).padStart(7, '0').slice(0, 7);
      const suffix = ((i % 5) * 2 + 1);
      const cnic = `${prefix}-${middle}-${suffix}`;

      const workerEmail = emailMap[w.userId.name] || `${w._id.replace(/^worker-/, '')}@hunarmand.pk`;

      const workerUser = await User.create({
        name: w.userId.name,
        email: workerEmail,
        password: 'Password123!',
        phone: w.userId.phone,
        role: 'worker',
        city: w.city || w.userId.city,
        area: w.area || w.userId.area,
        profileImage: w.userId.profileImage,
        isActive: true,
      });

      const workerProfile = await WorkerProfile.create({
        userId: workerUser._id,
        category: catMap[w.category.slug] || createdCategories[0]._id,
        skillTitle: w.skillTitle,
        experience: w.experience,
        startingPrice: w.startingPrice,
        city: w.city,
        area: w.area,
        workingHours: w.workingHours || '9:00 AM - 7:00 PM',
        availability: w.availability || 'available',
        verificationStatus: w.verificationStatus || 'verified',
        cnicNumber: cnic,
        bio: w.bio,
        services: w.services || [],
        averageRating: w.averageRating || 5.0,
        totalReviews: w.totalReviews || 1,
        completedJobsCount: w.completedJobsCount || 1,
      });

      seededWorkers.push({ user: workerUser, profile: workerProfile });
    }
    logger.success(`Seeded ${seededWorkers.length} skilled workers with profiles.`);

    // Match primary workers for relational seed data
    const tariqWorker = seededWorkers.find((sw) => sw.user.name === 'Ustad Tariq Mehmood') || seededWorkers[0];
    const altafWorker = seededWorkers.find((sw) => sw.user.name === 'Altaf Hussain') || seededWorkers[1];
    const rashidWorker = seededWorkers.find((sw) => sw.user.name === 'Muhammad Rashid') || seededWorkers[2];
    const shafiqWorker = seededWorkers.find((sw) => sw.user.name === 'Malik Shafiq') || seededWorkers[4];

    // 6. Seed Service Requests
    logger.info('Seeding service booking requests...');

    // Request 1: Completed (Bilal -> Ustad Tariq)
    const request1 = await ServiceRequest.create({
      customerId: customer1._id,
      workerId: tariqWorker.user._id,
      categoryId: catMap['plumber'],
      serviceType: 'Sanitary & Water Pump Fitting',
      description: 'Bathroom wash basin pipe is leaking constantly and water pressure is very low.',
      location: {
        address: 'House 45, Street 12, Phase 6',
        city: 'Karachi',
        area: 'DHA Phase 6',
      },
      preferredDate: new Date(Date.now() - 86400000 * 3),
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      status: 'completed',
      estimatedPrice: 600,
      finalPrice: 1200,
      completedAt: new Date(Date.now() - 86400000 * 2),
      statusHistory: [
        { status: 'pending', changedBy: customer1._id, note: 'Booking created', timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: 'accepted', changedBy: tariqWorker.user._id, note: 'Accepted by Tariq', timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: 'in_progress', changedBy: tariqWorker.user._id, note: 'Work initiated', timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'completed', changedBy: tariqWorker.user._id, note: 'Job completed with motor overhaul', timestamp: new Date(Date.now() - 86400000 * 2) },
      ],
    });

    // Request 2: Completed (Hamza -> Altaf Hussain in D.I. Khan)
    const request2 = await ServiceRequest.create({
      customerId: customer3._id,
      workerId: altafWorker.user._id,
      categoryId: catMap['plumber'],
      serviceType: 'Instant Geyser Fitting',
      description: 'Installed new gas geyser in kitchen, need copper pipe connection.',
      location: {
        address: 'House 14, Mohallah Cantt',
        city: 'D.I. Khan',
        area: 'Cantt',
      },
      preferredDate: new Date(Date.now() - 86400000 * 5),
      preferredTime: 'Morning (10:00 AM - 1:00 PM)',
      status: 'completed',
      estimatedPrice: 500,
      finalPrice: 1000,
      completedAt: new Date(Date.now() - 86400000 * 4),
    });

    // Request 3: In Progress (Zainab -> Muhammad Rashid in Lahore)
    const request3 = await ServiceRequest.create({
      customerId: customer2._id,
      workerId: rashidWorker.user._id,
      categoryId: catMap['electrician'],
      serviceType: 'Main Distribution Board Wiring',
      description: 'Short circuit occurred in second floor circuit breaker.',
      location: {
        address: 'Bungalow 22, Block B',
        city: 'Lahore',
        area: 'Gulberg III',
      },
      preferredDate: new Date(),
      preferredTime: 'Afternoon (1:00 PM - 4:00 PM)',
      status: 'in_progress',
      estimatedPrice: 800,
    });

    // Request 4: Pending (Bilal -> Malik Shafiq AC Technician)
    const request4 = await ServiceRequest.create({
      customerId: customer1._id,
      workerId: shafiqWorker.user._id,
      categoryId: catMap['ac-technician'],
      serviceType: 'AC Master Chemical Wash',
      description: 'Need seasonal AC service before summer heat begins.',
      location: {
        address: 'Plot 88, Street 4',
        city: 'Lahore',
        area: 'DHA Phase 5',
      },
      preferredDate: new Date(Date.now() + 86400000),
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      status: 'pending',
      estimatedPrice: 1500,
    });

    logger.success('Seeded 4 service requests.');

    // 7. Seed Reviews
    logger.info('Seeding customer ratings and reviews...');
    const review1 = await Review.create({
      customerId: customer1._id,
      workerId: tariqWorker.user._id,
      serviceRequestId: request1._id,
      rating: 5,
      comment: 'Bohot zabardast kaam kiya! Ustad Tariq waqt par aye, motor ka masla hal kiya aur bohot safai se kaam kiya.',
    });

    request1.isReviewed = true;
    request1.reviewId = review1._id;
    await request1.save();

    const review2 = await Review.create({
      customerId: customer3._id,
      workerId: altafWorker.user._id,
      serviceRequestId: request2._id,
      rating: 5,
      comment: 'Altaf bhai ne D.I. Khan mein geyser fitting bohot tasalli se ki. Highly recommended!',
    });

    request2.isReviewed = true;
    request2.reviewId = review2._id;
    await request2.save();

    logger.success('Seeded 2 customer reviews.');

    // 8. Seed Dispute / Report
    logger.info('Seeding customer report ticket...');
    await Report.create({
      reporterId: customer2._id,
      reportedUserId: rashidWorker.user._id,
      serviceRequestId: request3._id,
      reason: 'overcharging',
      description: 'Technician originally quoted Rs. 500 but demanded extra Rs. 1500 on arrival for simple circuit check.',
      status: 'under_review',
      adminNotes: 'Contacting both customer and worker to review quote.',
    });
    logger.success('Seeded 1 dispute report ticket.');

    // 9. Seed Conversation & Messages
    logger.info('Seeding real-time conversation and chat messages...');
    const conversation = await Conversation.create({
      participants: [customer1._id, tariqWorker.user._id],
      serviceRequestId: request1._id,
      lastMessage: 'Ji theek hai, main ghar par mojood honga.',
      lastMessageAt: new Date(),
    });

    await Message.create({
      conversationId: conversation._id,
      senderId: customer1._id,
      receiverId: tariqWorker.user._id,
      text: 'Assalam-o-Alaikum Tariq bhai, kya aap kal subah 10 bajay visit kar sakte hain?',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000 * 5),
    });

    await Message.create({
      conversationId: conversation._id,
      senderId: tariqWorker.user._id,
      receiverId: customer1._id,
      text: 'Walaikum Assalam Bilal sahib! Ji bilkul, main 10 bajay pohanch jaonga.',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000 * 4),
    });

    await Message.create({
      conversationId: conversation._id,
      senderId: customer1._id,
      receiverId: tariqWorker.user._id,
      text: 'Ji theek hai, main ghar par mojood honga.',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000 * 3),
    });

    logger.success('Seeded conversation and 3 chat messages.');

    logger.info('====================================================');
    logger.success('🎉 ALL HUNARMAND PAKISTAN DATA SEEDED SUCCESSFULLY!');
    logger.info('====================================================');
    console.log(`
Default Test Credentials:
------------------------------------------------------
ROLE        | EMAIL                   | PASSWORD
------------------------------------------------------
Admin       | admin@hunarmand.pk      | Admin1234!
Worker (KHI)| tariq@hunarmand.pk      | Password123!
Worker (DIK)| altaf@hunarmand.pk      | Password123!
Customer    | bilal@gmail.com         | Password123!
Customer    | zainab@gmail.com        | Password123!
Customer    | hamza@gmail.com         | Password123!
------------------------------------------------------
    `);

    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeedAll();
}

module.exports = runSeedAll;
