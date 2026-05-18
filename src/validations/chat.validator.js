const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

exports.createChatRoomValidation = [
  body('roomName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Room name must be at most 255 characters'),
  body('roomType')
    .optional()
    .isIn(['group', 'team'])
    .withMessage('Room type must be either group or team'),
  body('memberIds')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every((id) => mongoose.Types.ObjectId.isValid(id));
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return true;

        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.every((id) => mongoose.Types.ObjectId.isValid(id));
          }
        } catch {
          const parts = trimmed
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
          if (parts.length) {
            return parts.every((id) => mongoose.Types.ObjectId.isValid(id));
          }
        }
      }

      return false;
    })
    .withMessage('memberIds must be an array of valid object IDs')
];

exports.getChatRoomsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

exports.getChatRoomValidation = [
  param('chatRoomId')
    .notEmpty()
    .withMessage('Chat room ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Chat room ID must be a valid object ID')
];

exports.updateChatRoomValidation = [
  param('chatRoomId')
    .notEmpty()
    .withMessage('Chat room ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Chat room ID must be a valid object ID'),
  body('roomName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Room name must be at most 255 characters'),
  body('roomType')
    .optional()
    .isIn(['group', 'team'])
    .withMessage('Room type must be either group or team')
];

exports.deleteChatRoomValidation = [
  param('chatRoomId')
    .notEmpty()
    .withMessage('Chat room ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Chat room ID must be a valid object ID')
];

exports.getTeamsValidation = [
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

exports.getTeamDetailsValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('Chat ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Chat ID must be a valid object ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

exports.getRoomsValidation = [
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

exports.getRoomDetailsValidation = [
  param('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Room ID must be a valid object ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

exports.updateMessageReadStatusValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Message ID must be a valid object ID')
];

exports.markRoomMessagesReadValidation = [
  param('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Room ID must be a valid object ID')
];
