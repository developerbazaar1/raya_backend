const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate, uploadChatRoomFiles } = require('../../middlewares');
const {
  createChatRoomValidation,
  getChatRoomsValidation,
  getChatRoomValidation,
  updateChatRoomValidation,
  deleteChatRoomValidation,
  getTeamsValidation,
  getTeamDetailsValidation,
  getRoomsValidation,
  getRoomDetailsValidation,
  markRoomMessagesReadValidation
} = require('../../validations/chat.validator');
const {
  createChatRoom,
  getChatRooms,
  getChatRoom,
  updateChatRoom,
  deleteChatRoom,
  getTeams,
  getTeamDetails,
  getRooms,
  getRoomDetails,
  markRoomMessagesRead
} = require('../../controllers/shared/chat.controller');

router.get('/teams', authenticate(), validate(getTeamsValidation), asyncHandler(getTeams));
router.get(
  '/team/:chatId',
  authenticate(),
  validate(getTeamDetailsValidation),
  asyncHandler(getTeamDetails)
);
router.get('/rooms', authenticate(), validate(getRoomsValidation), asyncHandler(getRooms));
router.get(
  '/room/:roomId',
  authenticate(),
  validate(getRoomDetailsValidation),
  asyncHandler(getRoomDetails)
);
router.patch(
  '/rooms/:roomId/read-status',
  authenticate(),
  validate(markRoomMessagesReadValidation),
  asyncHandler(markRoomMessagesRead)
);

router.post(
  '/rooms',
  authenticate(),
  uploadChatRoomFiles,
  validate(createChatRoomValidation),
  asyncHandler(createChatRoom)
);
router.get(
  '/rooms/list',
  authenticate(),
  validate(getChatRoomsValidation),
  asyncHandler(getChatRooms)
);
router.get(
  '/rooms/:chatRoomId',
  authenticate(),
  validate(getChatRoomValidation),
  asyncHandler(getChatRoom)
);
router.patch(
  '/rooms/:chatRoomId',
  authenticate(),
  validate(updateChatRoomValidation),
  asyncHandler(updateChatRoom)
);
router.delete(
  '/rooms/:chatRoomId',
  authenticate(),
  validate(deleteChatRoomValidation),
  asyncHandler(deleteChatRoom)
);

module.exports = router;
