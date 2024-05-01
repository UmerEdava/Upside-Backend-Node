import mongoose from "mongoose";
import * as constants from '../../utils/constants/index';

export interface postModelTypes {
    _id: string,
    postedBy: string,
    likes: string[],
    comments: [{
        userId: string,
        text: string
    }],
    text?: string,
    img?: string,
}

const postSchema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION, required: true },
    text: { type: String, maxLength: 1000 },
    img: { type: String },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, default: [] },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: constants.COLLECTIONS.USER_COLLECTION },
        text: { type: String, maxLength: 500 },
    }],
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, {
    autoIndex: false,
    timestamps: true 
});

const postModel = mongoose.model(constants.COLLECTIONS.POST_COLLECTION, postSchema);

export default postModel;