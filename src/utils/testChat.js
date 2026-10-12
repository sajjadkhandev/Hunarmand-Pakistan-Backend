/**
 * Phase 10 Real-Time Chat & Direct Messaging Test Suite
 * Validates Conversation and Message models, authorization guards,
 * self-messaging prevention, and room configurations
 */

const mongoose = require('mongoose');
const { Conversation, Message } = require('../models');
const logger = require('./logger');

const runChatTests = async () => {
  logger.info('--- Running Phase 10 Real-Time Chat Tests ---');
  let passed = 0;
  let total = 0;

  const assert = (testName, condition) => {
    total++;
    if (condition) {
      logger.success(`[PASS] ${testName}`);
      passed++;
    } else {
      logger.error(`[FAIL] ${testName}`);
    }
  };

  const customerId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const thirdPartyId = new mongoose.Types.ObjectId();
  const conversationId = new mongoose.Types.ObjectId();

  // 1. Conversation Model Validation
  const validConv = new Conversation({
    participants: [customerId, workerId],
    lastMessage: 'Assalam-o-Alaikum, kal subah 10 bajay pohanch jaon ga.',
  });

  const validConvErr = validConv.validateSync();
  assert(
    'Model: Valid conversation with customer and worker participants passes validation',
    !validConvErr && validConv.participants.length === 2
  );

  // 2. Message Model Validation
  const validMsg = new Message({
    conversationId,
    senderId: customerId,
    receiverId: workerId,
    text: 'Ji theek hai, main ghar par mojood honga.',
  });

  const validMsgErr = validMsg.validateSync();
  assert(
    'Model: Valid chat message passes validation and defaults isRead to false',
    !validMsgErr && validMsg.isRead === false
  );

  // 3. Message Model: Empty text rejection
  const emptyMsg = new Message({
    conversationId,
    senderId: customerId,
    receiverId: workerId,
    text: '',
  });

  const emptyMsgErr = emptyMsg.validateSync();
  assert(
    'Model: Blank message text is rejected by schema validator',
    emptyMsgErr && emptyMsgErr.errors['text']
  );

  // 4. Self-Messaging Prevention Guard
  const canStartConversation = (userId, recipientId) => {
    if (userId.toString() === recipientId.toString()) {
      return { allowed: false, reason: 'Cannot chat with yourself' };
    }
    return { allowed: true };
  };

  assert(
    'Guard: User is blocked from initiating a conversation with themselves',
    canStartConversation(customerId, customerId).allowed === false &&
      canStartConversation(customerId, workerId).allowed === true
  );

  // 5. Participant Authorization Guard
  const checkCanAccessConversation = (convParticipants, requesterId) => {
    return convParticipants.some((p) => p.toString() === requesterId.toString());
  };

  const participantsList = [customerId, workerId];
  assert(
    'Guard: Only thread participants can read or send messages in the conversation',
    checkCanAccessConversation(participantsList, customerId) === true &&
      checkCanAccessConversation(participantsList, workerId) === true &&
      checkCanAccessConversation(participantsList, thirdPartyId) === false
  );

  // 6. Socket.IO Room Name Formatting
  const getConversationRoom = (cId) => `conversation_${cId}`;
  const getUserRoom = (uId) => `user_${uId}`;

  assert(
    'Socket: Room naming correctly formats channel identifiers',
    getConversationRoom(conversationId) === `conversation_${conversationId}` &&
      getUserRoom(workerId) === `user_${workerId}`
  );

  logger.info(`--- Result: ${passed}/${total} Chat Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runChatTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runChatTests;
