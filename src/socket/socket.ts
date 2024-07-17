import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ChatModel, MessageModel } from "../modules/chat/model";
// import { sendFCMNotification } from "../services/notifications/FCM/push-notifications";
import userModel from "../modules/auth/model";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const userSocketMap: any = {}; // {userId: socketId}

export const getRecipientSocketId = (recipientId: string) => {
    return userSocketMap[recipientId]
}

io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId != 'undefined') userSocketMap[userId as string] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap))

  socket.on("markMessagesAsSeen", async ({chatId, userId}) => {
    try {
        await MessageModel.updateMany({chatId, seen: false}, { $set: { seen: true }})
        await ChatModel.updateOne({_id: chatId}, { $set: { "lastMessage.seen": true }})

        io.to(userSocketMap[userId]).emit('seenMessages', {
            chatId
        })
    } catch (error) {
        console.log('socket message seen error: ',error)
    }
  })

  socket.on('call', async ({ callerId, calleeId, channelName, callerName, callerUsername, callerProfilePic, calleeName, calleeUsername, calleeProfilePic, callStatus }) => {
    try {
      const calleeSocketId = userSocketMap[calleeId];
      if (calleeSocketId) {
        io.to(calleeSocketId).emit('incomingCall', { callerId, channelName, calleeId, callerName, callerUsername, callerProfilePic, calleeName, calleeUsername, calleeProfilePic, callStatus });
        // const calleeUserData = await userModel.findOne({ _id: calleeId });

        // if (calleeUserData) {
        //   sendFCMNotification({ token: calleeUserData.fcmTokens[0]?.token, data: { title: 'Incoming Call', body: 'You have an incoming call from ' + callerId } })
        // }
      }
    } catch (error) {
      console.log('call socket error: ', error)
    }
  });

  socket.on('answer_call', ({ callerId, calleeId, channelName, callStatus }: { callerId: string, calleeId: string, channelName: string, callStatus: string }) => {
    console.log('call answered', callStatus, callerId)
    const callerSocketId = userSocketMap[callerId];
    console.log('callerSocketId:',callerSocketId)
    io.to(callerSocketId).emit('callAccepted', { callerId, calleeId, channelName, callStatus });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete userSocketMap[userId as string]
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  });
});

export { io, server, app };
