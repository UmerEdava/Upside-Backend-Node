import mongoose, { Document, Schema } from "mongoose";
import * as constants from '../../utils/constants/index';
import { is } from "date-fns/locale";

interface commentType {
    userId: string,
    text: string,
    likes: string[],
    createdAt: Date,
    isDeleted: boolean
}

export interface postModelTypes extends Document {
    _id: string,
    postedBy: string,
    likes: string[],
    comments: Array<commentType>,
    text?: string,
    img?: string,
}

// export interface postModelTypes {
//     _id: string,
//     postedBy: string,
//     likes: string[],
//     comments: [{
//         userId: string,
//         text: string
//     }],
//     text?: string,
//     img?: string,
// }

const postSchema : Schema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION, required: true },
    text: { type: String, maxLength: 1000 },
    img: { type: String },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, default: [] },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION },
        text: { type: String, maxLength: 500 },
        likes: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, default: [] },
        createdAt: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false }
    }],
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, {
    autoIndex: false,
    timestamps: true 
});

const postModel = mongoose.model<postModelTypes>(constants.COLLECTIONS.POST_COLLECTION, postSchema);

export default postModel;