import { Bcrypt } from "../../utils/bcrypt/Bcrypt";
import mongoose from "mongoose";
import * as constants from '../../utils/constants/index';

export enum DeviceTypeEnum {
	IOS = 'IOS',
	ANDROID = 'ANDROID',
	WEB = 'WEB',
}

export interface IUserFcmToken {
	deviceId?: string;
	token: string;
	device: DeviceTypeEnum;
	addedOn: Date;
}

interface IUser {
    _id: string,
    name: string,
    username: string,
    email: string,
    password?: string,
    country_code: string,
    mobile_number: string,
    profilePic: string,
    followers: string[],
    following: string[],
    bio: string,
    isDeactivated: boolean,
    fcmTokens: IUserFcmToken[]
  }
  
  interface UserModel extends mongoose.Model<UserDoc> {
    build(attrs: IUser): UserDoc;
  }
  
  interface UserDoc extends mongoose.Document {
    _id: string,
    name: string,
    username: string,
    email: string,
    password?: string,
    country_code: string,
    mobile_number: string,
    profilePic: string,
    followers: string[],
    following: string[],
    bio: string,
    isDeactivated: boolean,
    fcmTokens: IUserFcmToken[]
  }

export interface userModelTypes {
    _id: string,
    name: string,
    username: string,
    email: string,
    password?: string,
    country_code: string,
    mobile_number: string,
    profilePic: string,
    followers: string[],
    following: string[],
    bio: string,
    isDeactivated: boolean,
    fcmTokens: IUserFcmToken[]
}

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, index: true, trim: true },
    email: { type: String, required: false, index: true, unique: true },
    password: { type: String, minLength: 8, required: true },
    country_code: { type: String, required: false, default: "+91" },
    mobile_number: { type: String, required: false, index: true },
    profilePic: { type: String, default: '' },
    followers: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, default: [] },
    following: { type: [mongoose.Schema.Types.ObjectId], ref: constants.COLLECTIONS.USER_COLLECTION, default: [] },
    bio: { type: String, default: '' },
    isDeactivated: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    fcmTokens: [{
        deviceId: String,
        token: String,
        device: {
            type: String,
            enum: [DeviceTypeEnum.IOS, DeviceTypeEnum.ANDROID, DeviceTypeEnum.WEB],
        },
        addedOn: Date
    }]
}, {
    autoIndex: false,
    timestamps: true 
});

userSchema.pre('save', async function (next) {
    const user = this;
    if (this.isModified("password") || this.isNew) {
        try {
            user.password = await Bcrypt.toHash(user.password);
            next();
        } catch (err: any) {
            next(err);
        }
    } else {
        return next();
    }
})

userSchema.statics.build = (attrs: IUser) => {
    return new userModel(attrs);
};
  
const userModel = mongoose.model<UserDoc, UserModel>(constants.COLLECTIONS.USER_COLLECTION, userSchema);

export default userModel;