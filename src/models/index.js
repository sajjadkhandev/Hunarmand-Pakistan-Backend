/**
 * Master Models Exporter
 * Bundles all Mongoose models for easy, clean imports across controllers
 */

const User = require('./User');
const WorkerProfile = require('./WorkerProfile');
const Category = require('./Category');
const ServiceRequest = require('./ServiceRequest');
const Review = require('./Review');
const Report = require('./Report');
const Conversation = require('./Conversation');
const Message = require('./Message');

module.exports = {
  User,
  WorkerProfile,
  Category,
  ServiceRequest,
  Review,
  Report,
  Conversation,
  Message,
};
