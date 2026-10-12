/**
 * Category Seeder Utility
 * Seeds initial Pakistani service categories into MongoDB
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const logger = require('./logger');

const categories = [
  {
    name: 'Plumber',
    slug: 'plumber',
    icon: '🔧',
    description: 'Pipe fittings, sanitary installation, water tank cleaning, leakage solutions, water motor repairs.',
    sortOrder: 1,
  },
  {
    name: 'Electrician',
    slug: 'electrician',
    icon: '⚡',
    description: 'UPS wiring, circuit breaker fixing, generator hookups, household wiring, fan and light installations.',
    sortOrder: 2,
  },
  {
    name: 'AC Technician',
    slug: 'ac-technician',
    icon: '❄️',
    description: 'Inverter AC installation, copper piping, gas charging, jet wash master servicing, PCB repair.',
    sortOrder: 3,
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    icon: '🪚',
    description: 'Door repairs, lock replacement, custom wardrobes, wooden kitchen cabinets, furniture restoration.',
    sortOrder: 4,
  },
  {
    name: 'Solar Technician',
    slug: 'solar-technician',
    icon: '☀️',
    description: 'Solar panel structure mounting, hybrid on-grid inverter configuration, net metering wiring.',
    sortOrder: 5,
  },
  {
    name: 'Painter',
    slug: 'painter',
    icon: '🎨',
    description: 'Interior and exterior paint, wall putty, weather-sheet coating, polish, damp and moisture protection.',
    sortOrder: 6,
  },
  {
    name: 'Mechanic',
    slug: 'mechanic',
    icon: '🔩',
    description: 'Motorcycle and automobile tuning, oil changes, brake overhaul, electrical engine diagnosis.',
    sortOrder: 7,
  },
  {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    icon: '📱',
    description: 'Automatic washing machines, microwave ovens, refrigerators, deep freezers, water dispensers.',
    sortOrder: 8,
  },
  {
    name: 'Mason & Construction',
    slug: 'mason-construction',
    icon: '🏗️',
    description: 'Tile and marble installation, brick plastering, boundary wall construction, concrete touchups.',
    sortOrder: 9,
  },
  {
    name: 'Cleaner',
    slug: 'cleaner',
    icon: '🧹',
    description: 'Deep house cleaning, sofa shampooing, carpet wash, post-construction site cleaning.',
    sortOrder: 10,
  },
];

const seedCategories = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hunarmand_pakistan';

  try {
    logger.info('Connecting to MongoDB for category seeding...');
    await mongoose.connect(uri);

    logger.info('Checking existing categories...');
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true }
      );
    }

    logger.success(`Seeded ${categories.length} Pakistani service categories successfully!`);
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding categories: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, categories };
