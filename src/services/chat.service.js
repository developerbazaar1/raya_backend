const mongoose = require('mongoose');
const ChatRoom = require('../models/shared/chatRoom.model');
const ChatRoomMember = require('../models/shared/chatRoomMember.model');
const ChatMessage = require('../models/shared/chatMessage.model');
const ChatAttachment = require('../models/shared/chatAttachment.model');
const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');
const { uploadFileToSpaces } = require('../helper/fileUpload.helper');

const parseMemberIds = (memberIds) => {
  if (!memberIds) return [];
  if (Array.isArray(memberIds)) return memberIds;
  if (typeof memberIds !== 'string') return [];

  const trimmed = memberIds.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

exports.createChatRoomService = async (payload, userId) => {
  const { roomName, roomType = 'group' } = payload;
  const memberIds = parseMemberIds(payload.memberIds);
  const memberSet = new Set([userId.toString(), ...memberIds.map((id) => id.toString())]);
  const chatRoomImageFile = payload.files?.chatRoomImage?.[0];
  const imageMetadata = await uploadFileToSpaces(chatRoomImageFile, `chat/${userId}/rooms/images`);
  const room = new ChatRoom({
    businessOwnerId: userId,
    createdByUserId: userId,
    roomName,
    ...(imageMetadata ? { chatRoomImage: imageMetadata } : {}),
    roomType
  });

  await room.save();

  const membersPayload = [...memberSet].map((memberId) => ({
    roomId: room._id,
    userId: memberId
  }));

  await ChatRoomMember.insertMany(membersPayload);

  return {
    _id: room._id,
    roomName: room.roomName || '',
    chatRoomImage: room.chatRoomImage?.url || '',
    roomType: room.roomType,
    membersCount: membersPayload.length
  };
};

exports.getChatRoomsService = async (userId, skip = 0, limit = 10) => {
  const memberships = await ChatRoomMember.find({ userId }).select('roomId').lean();
  const roomIds = memberships.map((member) => member.roomId);

  const rooms = await ChatRoom.find({ _id: { $in: roomIds } })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return rooms.map((room) => ({
    _id: room._id,
    roomName: room.roomName || '',
    chatRoomImage: room.chatRoomImage?.url || '',
    roomType: room.roomType,
    lastMessage: room.lastMessage || null,
    updatedAt: room.updatedAt
  }));
};

exports.getChatRoomService = async (chatRoomId, userId) => {
  const membership = await ChatRoomMember.findOne({
    roomId: chatRoomId,
    userId
  }).lean();

  if (!membership) {
    throw new AppError('You are not a member of this chat room', 403);
  }

  const room = await ChatRoom.findById(chatRoomId).lean();
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  const members = await ChatRoomMember.find({ roomId: chatRoomId }).select('userId unreadCount joinedAt').lean();

  return {
    _id: room._id,
    roomName: room.roomName || '',
    chatRoomImage: room.chatRoomImage?.url || '',
    roomType: room.roomType,
    lastMessage: room.lastMessage || "",
    members
  };
};

exports.updateChatRoomService = async (chatRoomId, payload, userId) => {
  const room = await ChatRoom.findById(chatRoomId);
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  if (room.createdByUserId.toString() !== userId.toString()) {
    throw new AppError('Only the room creator can update this chat room', 403);
  }

  const { roomName, roomType } = payload;
  if (roomName !== undefined) room.roomName = roomName;
  if (roomType !== undefined) room.roomType = roomType;

  await room.save();

  return {
    _id: room._id,
    roomName: room.roomName || '',
    chatRoomImage: room.chatRoomImage?.url || '',
    roomType: room.roomType
  };
};

exports.deleteChatRoomService = async (chatRoomId, userId) => {
  const room = await ChatRoom.findById(chatRoomId);
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  if (room.createdByUserId.toString() !== userId.toString()) {
    throw new AppError('Only the room creator can delete this chat room', 403);
  }

  const messages = await ChatMessage.find({ roomId: chatRoomId }).select('_id').lean();
  const messageIds = messages.map((message) => message._id);

  if (messageIds.length > 0) {
    await ChatAttachment.deleteMany({ messageId: { $in: messageIds } });
  }

  await Promise.all([
    ChatMessage.deleteMany({ roomId: chatRoomId }),
    ChatRoomMember.deleteMany({ roomId: chatRoomId }),
    ChatRoom.deleteOne({ _id: chatRoomId })
  ]);

  return {
    _id: chatRoomId
  };
};

const buildMessageWithAttachment = async (messages) => {
  if (!messages.length) return [];

  const messageIds = messages.map((msg) => msg._id);
  const attachments = await ChatAttachment.find({ messageId: { $in: messageIds } }).lean();
  const attachmentMap = attachments.reduce((acc, item) => {
    const key = item.messageId.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item.attachment?.url || '');
    return acc;
  }, {});

  return messages.map((msg) => ({
    id: msg._id,
    roomId: msg.roomId,
    senderUserId: msg.senderUserId,
    senderId: msg.senderUserId,
    message: msg.message || '',
    messageType: msg.messageType || 'text',
    status: msg.status || 'sent',
    createdAt: msg.createdAt,
    attachment: attachmentMap[msg._id.toString()] || []
  }));
};

/**
 * Persist a chat message, optional attachments, room lastMessage, and increment unread for other members.
 * Used by REST (if added) and real-time socket layer.
 */
exports.sendChatMessageService = async ({
  roomId,
  senderUserId,
  message = '',
  messageType = 'text',
  attachments = []
}) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new AppError('Invalid room id', 400);
  }

  const membership = await ChatRoomMember.findOne({ roomId, userId: senderUserId }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this chat room', 403);
  }

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  const allowedTypes = ['text', 'image', 'file'];
  const type = allowedTypes.includes(messageType) ? messageType : 'text';
  const text = String(message).trim();

  const chatMessage = new ChatMessage({
    roomId,
    senderUserId,
    message: text,
    messageType: type,
    status: 'sent'
  });
  await chatMessage.save();

  if (Array.isArray(attachments) && attachments.length > 0) {
    const docs = attachments
      .filter((a) => a && (a.url || a.fileUrl))
      .map((a) => ({
        messageId: chatMessage._id,
        attachment: {
          url: a.url || a.fileUrl,
          key: a.key || '',
          fileName: a.fileName || '',
          mimeType: a.mimeType || a.fileType || '',
          sizeBytes: typeof a.sizeBytes === 'number' ? a.sizeBytes : typeof a.fileSize === 'number' ? a.fileSize : 0
        }
      }));
    if (docs.length) {
      await ChatAttachment.insertMany(docs);
    }
  }

  const now = new Date();
  room.lastMessage = {
    text: text,
    senderId: senderUserId,
    createdAt: now
  };
  await room.save();

  await ChatRoomMember.updateMany({ roomId, userId: { $ne: senderUserId } }, { $inc: { unreadCount: 1 } });

  const lean = await ChatMessage.findById(chatMessage._id).lean();
  const [formatted] = await buildMessageWithAttachment([lean]);
  return formatted;
};

exports.updateMessageReadStatusService = async ({ messageId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new AppError('Invalid message id', 400);
  }

  const message = await ChatMessage.findById(messageId).lean();
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  const membership = await ChatRoomMember.findOne({ roomId: message.roomId, userId }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this chat room', 403);
  }

  if (message.senderUserId.toString() !== userId.toString()) {
    await ChatRoomMember.updateOne(
      {
        roomId: message.roomId,
        userId,
        unreadCount: { $gt: 0 }
      },
      { $inc: { unreadCount: -1 } }
    );
  }

  const room = await ChatRoom.findById(message.roomId).select('roomType').lean();
  if (room?.roomType === 'team' && message.senderUserId.toString() !== userId.toString()) {
    await ChatMessage.updateOne({ _id: message._id }, { $set: { status: 'read' } });
  }

  return {
    messageId,
    roomId: message.roomId,
    userId,
    senderId: message.senderUserId,
    messageStatus: room?.roomType === 'team' && message.senderUserId.toString() !== userId.toString() ? 'read' : message.status
  };
};

exports.markRoomMessagesReadService = async ({ roomId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new AppError('Invalid room id', 400);
  }

  const membership = await ChatRoomMember.findOne({ roomId, userId }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this chat room', 403);
  }

  const room = await ChatRoom.findById(roomId).select('_id roomType').lean();
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  const unreadCount = membership.unreadCount || 0;
  if (room.roomType === 'team' && unreadCount > 0) {
    await ChatMessage.updateMany(
      {
        roomId,
        senderUserId: { $ne: userId },
        status: { $ne: 'read' }
      },
      { $set: { status: 'read' } }
    );
  }

  await ChatRoomMember.updateOne({ roomId, userId }, { $set: { unreadCount: 0 } });

  return {
    roomId,
    roomType: room.roomType,
    userId,
    unreadCount: 0,
    clearedUnreadCount: unreadCount
  };
};

exports.getTeamsService = async (userId, search = '', skip = 0, limit = 10) => {
  const myMemberships = await ChatRoomMember.find({ userId }).select('roomId unreadCount').lean();
  const roomIds = myMemberships.map((member) => member.roomId);
  if (!roomIds.length) return [];

  const myUnreadMap = myMemberships.reduce((acc, item) => {
    acc[item.roomId.toString()] = item.unreadCount || 0;
    return acc;
  }, {});

  const teamRooms = await ChatRoom.find({
    _id: { $in: roomIds },
    roomType: 'team'
  }).lean();

  const teamRoomIds = teamRooms.map((room) => room._id);
  if (!teamRoomIds.length) return [];

  const teamMembers = await ChatRoomMember.find({ roomId: { $in: teamRoomIds } }).select('roomId userId').lean();
  const otherUserIdsSet = new Set();
  for (const member of teamMembers) {
    if (member.userId.toString() !== userId.toString()) otherUserIdsSet.add(member.userId.toString());
  }

  const otherUsers = await User.find({ _id: { $in: [...otherUserIdsSet] }, isDeleted: false })
    .select('name userProfile')
    .lean();
  const otherUserMap = otherUsers.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  const teamList = teamRooms
    .map((room) => {
      const members = teamMembers.filter((m) => m.roomId.toString() === room._id.toString());
      const otherMember = members.find((m) => m.userId.toString() !== userId.toString());
      const otherUser = otherMember ? otherUserMap[otherMember.userId.toString()] : null;
      return {
        id: room._id,
        userProfile: otherUser?.userProfile?.url || '',
        lastMessage: room.lastMessage || null,
        unreadMessageCount: myUnreadMap[room._id.toString()] || 0,
        name: otherUser?.name || room.roomName || 'Unknown User',
        chatRoomImage: room.chatRoomImage?.url || '',
        updatedAt: room.updatedAt
      };
    })
    .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if ((b.unreadMessageCount || 0) !== (a.unreadMessageCount || 0)) {
        return (b.unreadMessageCount || 0) - (a.unreadMessageCount || 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return teamList.slice(skip, skip + limit).map(({ updatedAt: _updatedAt, ...rest }) => rest);
};

exports.getTeamDetailsService = async (userId, chatId, skip = 0, limit = 20) => {
  const membership = await ChatRoomMember.findOne({ roomId: chatId, userId }).lean();
  if (!membership) throw new AppError('You are not a member of this chat', 403);

  const room = await ChatRoom.findOne({ _id: chatId, roomType: 'team' }).lean();
  if (!room) throw new AppError('Team chat not found', 404);

  const members = await ChatRoomMember.find({ roomId: chatId }).select('userId joinedAt').lean();
  const otherMember = members.find((member) => member.userId.toString() !== userId.toString());
  const user = otherMember
    ? await User.findById(otherMember.userId).select('name email role userProfile dateOfJoining').lean()
    : null;

  const rawMessages = await ChatMessage.find({ roomId: chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const messagesWithAttachments = await buildMessageWithAttachment(rawMessages.reverse());

  return {
    user: {
      profileImage: user?.userProfile?.url || '',
      role: user?.role || '',
      isOnline: false,
      email: user?.email || '',
      phoneNumber: '',
      location: '',
      joined: user?.dateOfJoining || null
    },
    messages: messagesWithAttachments.map((msg) => ({
      id: msg.id,
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderUserId: msg.senderUserId,
      isSelf: msg.senderUserId.toString() === userId.toString(),
      profileImage: '',
      message: msg.message,
      messageType: msg.messageType,
      status: msg.status,
      attachment: msg.attachment,
      createdAt: msg.createdAt
    }))
  };
};

exports.getRoomsService = async (userId, search = '', skip = 0, limit = 10) => {
  const myMemberships = await ChatRoomMember.find({ userId }).select('roomId unreadCount').lean();
  const roomIds = myMemberships.map((member) => member.roomId);
  if (!roomIds.length) return [];

  const myUnreadMap = myMemberships.reduce((acc, item) => {
    acc[item.roomId.toString()] = item.unreadCount || 0;
    return acc;
  }, {});

  const rooms = await ChatRoom.find({
    _id: { $in: roomIds },
    roomType: 'group',
    ...(search ? { roomName: { $regex: search, $options: 'i' } } : {})
  }).lean();

  const roomIdsForCount = rooms.map((room) => room._id);
  const memberCounts = await ChatRoomMember.aggregate([
    { $match: { roomId: { $in: roomIdsForCount } } },
    { $group: { _id: '$roomId', totalMembers: { $sum: 1 } } }
  ]);
  const countMap = memberCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.totalMembers || 0;
    return acc;
  }, {});

  const roomList = rooms
    .map((room) => ({
      id: room._id,
      groupImage: room.chatRoomImage?.url || '',
      name: room.roomName || '',
      totalMembers: countMap[room._id.toString()] || 0,
      unreadMessageCount: myUnreadMap[room._id.toString()] || 0,
      updatedAt: room.updatedAt
    }))
    .sort((a, b) => {
      if ((b.unreadMessageCount || 0) !== (a.unreadMessageCount || 0)) {
        return (b.unreadMessageCount || 0) - (a.unreadMessageCount || 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return roomList.slice(skip, skip + limit).map(({ updatedAt: _updatedAt, ...rest }) => rest);
};

exports.getRoomDetailsService = async (userId, roomId, skip = 0, limit = 20) => {
  const membership = await ChatRoomMember.findOne({ roomId, userId }).lean();
  if (!membership) throw new AppError('You are not a member of this room', 403);

  const room = await ChatRoom.findOne({ _id: roomId, roomType: 'group' }).lean();
  if (!room) throw new AppError('Room not found', 404);

  const memberDocs = await ChatRoomMember.find({ roomId }).select('userId').lean();
  const memberUserIds = memberDocs.map((member) => member.userId);
  const users = await User.find({ _id: { $in: memberUserIds }, isDeleted: false })
    .select('name userProfile')
    .lean();
  const usersMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  const rawMessages = await ChatMessage.find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const messagesWithAttachments = await buildMessageWithAttachment(rawMessages.reverse());

  return {
    groupImage: room.chatRoomImage?.url || '',
    name: room.roomName || '',
    totalMembersCount: memberDocs.length,
    messageList: messagesWithAttachments.map((msg) => ({
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.senderUserId,
      senderId: msg.senderId,
      isSelf: msg.senderUserId.toString() === userId.toString(),
      name: usersMap[msg.senderUserId.toString()]?.name || '',
      message: msg.message,
      messageType: msg.messageType,
      status: msg.status,
      attachment: msg.attachment,
      profileImage: usersMap[msg.senderUserId.toString()]?.userProfile?.url || '',
      createdAt: msg.createdAt
    })),
    members: memberDocs.map((member) => ({
      id: member.userId,
      name: usersMap[member.userId.toString()]?.name || '',
      profileImage: usersMap[member.userId.toString()]?.userProfile?.url || '',
      isAdmin: room.createdByUserId.toString() === member.userId.toString()
    }))
  };
};
