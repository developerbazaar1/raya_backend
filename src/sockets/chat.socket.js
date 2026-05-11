const mongoose = require('mongoose');
const ChatRoomMember = require('../models/shared/chatRoomMember.model');
const { sendChatMessageService } = require('../services/chat.service');
const logger = require('../utils/logger');

const roomChannel = (roomId) => `chat:${roomId}`;

const ack = (callback, err, data) => {
  if (typeof callback !== 'function') {
    return;
  }
  if (err) {
    callback({ ok: false, message: err.message || 'error' });
    return;
  }
  callback({ ok: true, data });
};

const registerChatSocketHandlers = (io, socket) => {
  socket.on('join_room', async (payload, callback) => {
    try {
      console.log("Join a room")
      const roomId = payload?.roomId;
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        ack(callback, new Error('Invalid room id'));
        return;
      }

      const member = await ChatRoomMember.findOne({
        roomId,
        userId: socket.user.userId
      }).lean();

      if (!member) {
        ack(callback, new Error('Not a member of this room'));
        return;
      }

      await socket.join(roomChannel(roomId));
      ack(callback, null, { roomId });
    } catch (err) {
      logger.error('Socket join_room failed', err);
      ack(callback, err instanceof Error ? err : new Error('join_room failed'));
    }
  });

  socket.on('leave_room', (payload, callback) => {
    try {
      const roomId = payload?.roomId;
      if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
        socket.leave(roomChannel(roomId));
      }
      ack(callback, null, {});
    } catch (err) {
      ack(callback, err instanceof Error ? err : new Error('leave_room failed'));
    }
  });

  socket.on('send_message', async (payload, callback) => {
    try {
      const { roomId, message, messageType, attachments } = payload || {};
      console.log("Chat-Payload", payload)
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        ack(callback, new Error('Invalid room id'));
        return;
      }

      const formatted = await sendChatMessageService({
        roomId,
        senderUserId: socket.user.userId,
        message,
        messageType,
        attachments
      });

      const broadcastPayload = {
        roomId,
        ...formatted
      };

      io.to(roomChannel(roomId)).emit('message_received', broadcastPayload);
      ack(callback, null, broadcastPayload);
    } catch (err) {
      logger.error('Socket send_message failed', err);
      const message = err?.message || 'Failed to send message';
      ack(callback, new Error(message));
      socket.emit('message_error', { message });
    }
  });
};

module.exports = {
  registerChatSocketHandlers
};
