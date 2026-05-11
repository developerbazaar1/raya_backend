Structure (src/sockets/)
socketAuth.middleware.js – Runs on every connection. Accepts JWT from:
handshake.auth.token (preferred for Socket.IO v4)
handshake.query.token
Authorization: Bearer <token> Verifies with verifyAuthToken, loads User, rejects deleted/missing users. Attaches socket.user (userId, email, role).
chat.socket.js – Chat events after auth: join_room, leave_room, send_message.
index.js – Creates socket.io Server, CORS, io.use(socketAuthMiddleware), registers chat handlers, emits connected on success.
Server wiring
index.js now calls initSocket(server) right after app.listen(...), so WebSockets share the same HTTP server as Express.

Message flow
send_message payload: { roomId, message?, messageType?, attachments?: [{ fileUrl, fileName?, fileType?, fileSize? }] }

Uses sendChatMessageService in src/services/chat.service.js (membership check, save ChatMessage, optional ChatAttachment, update ChatRoom.lastMessage, bump others’ unreadCount).
Broadcasts message_received to room namespace chat:<roomId> (only sockets that called join_room for that room get it).
Optional ack callback: (res) => { res.ok, res.data | res.message }.
On failure: ack error + message_error on the socket.
join_room / leave_room – Require membership before join; uses same chat:<roomId> channel.

Security
Unauthenticated or invalid JWT → connection error (Authentication required / Unauthorized).
Authenticated but not in room → cannot join_room; send_message still blocked in service (403-style error surfaced to client).
CORS
If CLIENT_ORIGIN is set (comma-separated origins), Socket.IO uses that list.
If unset, origin: true (same idea as a wide-open Express CORS setup). Tighten in production with CLIENT_ORIGIN.
Client sketch