const {
  createChatRoomService,
  getChatRoomsService,
  getChatRoomService,
  updateChatRoomService,
  deleteChatRoomService,
  getTeamsService,
  getTeamDetailsService,
  getRoomsService,
  getRoomDetailsService,
  updateMessageReadStatusService,
  markRoomMessagesReadService
} = require('../../services/chat.service');
const { getIO } = require('../../sockets');

exports.createChatRoom = async (req, res) => {
  const data = await createChatRoomService(
    {
      ...req.body,
      files: req.files || {}
    },
    req.user.userId
  );
  res.status(201).json({
    success: 'success',
    message: 'Chat room created successfully',
    data
  });
};

exports.getChatRooms = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNo = parseInt(page, 10);
  const limitNo = parseInt(limit, 10);
  const skip = (pageNo - 1) * limitNo;

  const data = await getChatRoomsService(req.user.userId, skip, limitNo);
  res.status(200).json({
    success: 'success',
    message: 'Chat rooms fetched successfully',
    data
  });
};

exports.getChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;
  const data = await getChatRoomService(chatRoomId, req.user.userId);
  res.status(200).json({
    success: 'success',
    message: 'Chat room fetched successfully',
    data
  });
};

exports.updateChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;
  const data = await updateChatRoomService(chatRoomId, req.body, req.user.userId);
  res.status(200).json({
    success: 'success',
    message: 'Chat room updated successfully',
    data
  });
};

exports.deleteChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;
  const data = await deleteChatRoomService(chatRoomId, req.user.userId);
  res.status(200).json({
    success: 'success',
    message: 'Chat room deleted successfully',
    data
  });
};

exports.getTeams = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageNo = parseInt(page, 10);
  const limitNo = parseInt(limit, 10);
  const skip = (pageNo - 1) * limitNo;

  const data = await getTeamsService(req.user.userId, search, skip, limitNo);
  res.status(200).json({
    success: 'success',
    message: 'Teams fetched successfully',
    data
  });
};

exports.getTeamDetails = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { chatId } = req.params;
  const pageNo = parseInt(page, 10);
  const limitNo = parseInt(limit, 10);
  const skip = (pageNo - 1) * limitNo;

  const data = await getTeamDetailsService(req.user.userId, chatId, skip, limitNo);
  res.status(200).json({
    success: 'success',
    message: 'Team details fetched successfully',
    data
  });
};

exports.getRooms = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageNo = parseInt(page, 10);
  const limitNo = parseInt(limit, 10);
  const skip = (pageNo - 1) * limitNo;

  const data = await getRoomsService(req.user.userId, search, skip, limitNo);
  res.status(200).json({
    success: 'success',
    message: 'Rooms fetched successfully',
    data
  });
};

exports.getRoomDetails = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { roomId } = req.params;
  const pageNo = parseInt(page, 10);
  const limitNo = parseInt(limit, 10);
  const skip = (pageNo - 1) * limitNo;

  const data = await getRoomDetailsService(req.user.userId, roomId, skip, limitNo);
  res.status(200).json({
    success: 'success',
    message: 'Room details fetched successfully',
    data
  });
};

// update message read status
exports.updateMessageReadStatus = async (req, res) => {
  const { messageId } = req.params;
  const data = await updateMessageReadStatusService({
    messageId,
    userId: req.user.userId
  });
  const io = getIO();
  if (io) {
    io.to(`chat:${data.roomId}`).emit('message_read_status_updated', data);
  }

  res.status(200).json({
    success: 'success',
    message: 'Message read status updated successfully',
    data
  });
};

exports.markRoomMessagesRead = async (req, res) => {
  const { roomId } = req.params;
  const data = await markRoomMessagesReadService({
    roomId,
    userId: req.user.userId
  });

  const io = getIO();
  if (io) {
    io.to(`chat:${data.roomId}`).emit('room_read_status_updated', data);
  }

  res.status(200).json({
    success: 'success',
    message: 'Room messages marked as read successfully',
    data
  });
};
