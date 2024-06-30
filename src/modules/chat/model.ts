import mongoose, { Document, Schema } from "mongoose";
import * as constants from '../../utils/constants/index';
import { userModelTypes } from "../auth/model";
import * as types from "../../utils/types/types";

export enum MESSAGE_STATUS_TYPES {
    PENDING = "pending",
    SENT ="sent",
}

interface lastMessageType {
    text: string,
    sender: string
}

export interface chatModelTypes extends Document {
    _id: string,
    participants: string[],
    lastMessage?: lastMessageType,
}

export interface messageModelTypes extends Document {
    _id: string,
    chatId: string,
    sender: string,
    seen: string,
    text?: string,
    img?: string
}

const chatSchema : Schema = new mongoose.Schema({
    participants: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, required: true },
    lastMessage: { 
        text: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION, required: true
        },
        seen: { type: Boolean, default: false }
    },
    isDeleted: { type: Boolean, default: false }
}, {
    autoIndex: false,
    timestamps: true 
});

const messageSchema : Schema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.CHAT_COLLECTION, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION, required: true },
    text: { type: String, maxLength: 1000 },
    img: { type: String },
    status: { type: String, enum: [MESSAGE_STATUS_TYPES.PENDING, MESSAGE_STATUS_TYPES.SENT], default: MESSAGE_STATUS_TYPES.PENDING },
    seen: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, {
    autoIndex: false,
    timestamps: true 
});

const ChatModel = mongoose.model<chatModelTypes>(constants.COLLECTIONS.CHAT_COLLECTION, chatSchema);
const MessageModel = mongoose.model<messageModelTypes>(constants.COLLECTIONS.MESSAGE_COLLECTION, messageSchema);


export {ChatModel, MessageModel};