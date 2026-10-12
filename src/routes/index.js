/**
 * Master Router
 * Aggregates all modular route handlers under /api
 */

const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const workerRoutes = require('./workerRoutes');
const requestRoutes = require('./requestRoutes');
const reviewRoutes = require('./reviewRoutes');
const adminRoutes = require('./adminRoutes');
const reportRoutes = require('./reportRoutes');
const chatRoutes = require('./chatRoutes');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/workers', workerRoutes);
router.use('/requests', requestRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);

// Root API welcome endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Hunarmand Pakistan REST API',
    tagline: 'Har Hunar, Har Shehar, Aap Ke Qareeb.',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      categories: {
        list: 'GET /api/categories',
        bySlug: 'GET /api/categories/:slug',
      },
      workers: {
        list: 'GET /api/workers',
        byId: 'GET /api/workers/:id',
        myProfile: 'GET /api/workers/profile/me',
        updateProfile: 'POST /api/workers/profile',
        updateAvailability: 'PATCH /api/workers/availability',
      },
      requests: {
        create: 'POST /api/requests',
        my: 'GET /api/requests/my',
        byId: 'GET /api/requests/:id',
        updateStatus: 'PATCH /api/requests/:id/status',
      },
      reviews: {
        create: 'POST /api/reviews',
        byWorker: 'GET /api/reviews/worker/:workerId',
        my: 'GET /api/reviews/my',
        delete: 'DELETE /api/reviews/:id',
      },
      admin: {
        stats: 'GET /api/admin/stats',
        users: 'GET /api/admin/users',
        toggleStatus: 'PATCH /api/admin/users/:id/status',
        workers: 'GET /api/admin/workers',
        verifyWorker: 'PATCH /api/admin/workers/:id/verify',
        requests: 'GET /api/admin/requests',
        reports: 'GET /api/admin/reports',
      },
      reports: {
        create: 'POST /api/reports',
        my: 'GET /api/reports/my',
      },
      chat: {
        getOrCreateConversation: 'POST /api/chat/conversations',
        myConversations: 'GET /api/chat/conversations',
        getMessages: 'GET /api/chat/conversations/:id/messages',
        sendMessage: 'POST /api/chat/messages',
        markAsRead: 'PATCH /api/chat/conversations/:id/read',
      },
    },
  });
});

module.exports = router;
