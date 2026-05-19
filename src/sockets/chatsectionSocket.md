# Chat API and WebSocket Guide

Base API path:

```txt
/api/v1/chat
```

Socket URL:

```txt
http://localhost:8080
```

Socket auth requires JWT in one of these places:

```js
io('http://localhost:8080', {
  auth: { token: 'JWT_TOKEN' }
});
```

or:

```txt
Authorization: Bearer JWT_TOKEN
```

## Chat Types

Use the same collections for both chat types.

```txt
team  = 1-1 chat
group = group chat
```

Main models:

```txt
ChatRoom
ChatRoomMember
ChatMessage
ChatAttachment
```

Unread count is stored per user in `ChatRoomMember.unreadCount`.

## Create Chat Room

```http
POST /api/v1/chat/rooms
```

Use `form-data`.

Create 1-1/team chat:

```txt
roomType: team
memberIds: ["OTHER_USER_ID"]
```

Create group chat:

```txt
roomName: My Group
roomType: group
memberIds: ["USER_ID_1","USER_ID_2"]
chatRoomImage: optional file
```

`memberIds` key must be exactly `memberIds`, not `memberIds[]`.

The logged-in user is added automatically.

## Team APIs

Get 1-1 chat list:

```http
GET /api/v1/chat/teams?page=1&limit=10&search=
```

Returns team chats with:

```txt
id, userProfile, lastMessage, unreadMessageCount, name, chatRoomImage
```

Sorting:

```txt
Higher unreadMessageCount first, then latest updated chat.
```

Get 1-1 chat details/messages:

```http
GET /api/v1/chat/team/:chatId?page=1&limit=20
```

Returns latest `limit` messages in normal chat order: older to newer.

Message fields:

```json
{
  "id": "MESSAGE_ID",
  "roomId": "ROOM_ID",
  "senderId": "USER_ID",
  "senderUserId": "USER_ID",
  "isSelf": true,
  "message": "hello",
  "messageType": "text",
  "status": "sent",
  "attachment": [],
  "createdAt": "..."
}
```

Use `isSelf` for frontend left/right bubble:

```js
const side = message.isSelf ? 'right' : 'left';
```

## Group Room APIs

Get group room list:

```http
GET /api/v1/chat/rooms?page=1&limit=10&search=
```

Returns group rooms with:

```txt
id, groupImage, name, totalMembers, unreadMessageCount
```

Sorting:

```txt
Higher unreadMessageCount first, then latest updated room.
```

Get group room details/messages:

```http
GET /api/v1/chat/room/:roomId?page=1&limit=20
```

Returns latest `limit` messages in normal chat order: older to newer.

Response contains:

```txt
groupImage, name, totalMembersCount, messageList, members
```

## Read/Unread APIs

Mark all messages in a room as read:

```http
PATCH /api/v1/chat/rooms/:roomId/read-status
```

No body required.

Behavior:

```txt
Sets current user's ChatRoomMember.unreadCount to 0.
For team chat, also marks received messages as read.
For group chat, only unreadCount is tracked.
```

Socket event emitted:

```txt
room_read_status_updated
```

Example payload:

```json
{
  "roomId": "ROOM_ID",
  "roomType": "group",
  "userId": "USER_ID",
  "unreadCount": 0,
  "clearedUnreadCount": 4
}
```

## WebSocket Events

### join_room

Join before sending or receiving room messages.

```js
socket.emit('join_room', { roomId }, (res) => {
  console.log(res);
});
```

Success:

```json
{
  "ok": true,
  "data": { "roomId": "ROOM_ID" }
}
```

### leave_room

```js
socket.emit('leave_room', { roomId });
```

### send_message

```js
socket.emit(
  'send_message',
  {
    roomId: 'ROOM_ID',
    message: 'Hello',
    messageType: 'text'
  },
  (ack) => {
    console.log('sent ack', ack);
  }
);
```

Attachments:

```js
socket.emit('send_message', {
  roomId: 'ROOM_ID',
  messageType: 'file',
  attachments: [
    {
      fileUrl: 'https://...',
      fileName: 'report.pdf',
      fileType: 'application/pdf',
      fileSize: 12345
    }
  ]
});
```

Sender receives:

```txt
message_sent
```

Other joined room members receive:

```txt
message_received
```

Listen:

```js
socket.on('message_sent', (message) => {
  console.log('my message sent', message);
});

socket.on('message_received', (message) => {
  console.log('new incoming message', message);
});
```

Message payload:

```json
{
  "roomId": "ROOM_ID",
  "id": "MESSAGE_ID",
  "senderId": "USER_ID",
  "senderUserId": "USER_ID",
  "message": "Hello",
  "messageType": "text",
  "status": "sent",
  "attachment": [],
  "createdAt": "..."
}
```

### Read Update Events

Listen for room read update:

```js
socket.on('room_read_status_updated', (data) => {
  console.log(data);
});
```

Note:

```txt
Group chat does not track per-user message read receipts.
Use unreadMessageCount/unreadCount for group unread state.
```

## Frontend Usage

Basic flow:

```js
const socket = io('http://localhost:8080', {
  auth: { token }
});

socket.on('connected', (data) => {
  console.log(data);
});

socket.emit('join_room', { roomId });

socket.on('message_received', (message) => {
  addMessage(message);
});

socket.emit('send_message', { roomId, message: 'Hello', messageType: 'text' }, (ack) => {
  if (ack.ok) addMessage(ack.data);
});
```

Bubble side:

```js
const side = message.isSelf ? 'right' : 'left';
```

For socket messages, if `isSelf` is not present:

```js
const isSelf = message.senderId === loggedInUserId;
```
