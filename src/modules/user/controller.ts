import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import {v2 as cloudinary} from 'cloudinary';

import { ApiError } from "../../middlewares/errorHandler/ApiError";
import { JWT } from "../../utils/jwt/jwt";
import { log } from "../../config/logger";
import { Bcrypt } from "../../utils/bcrypt/Bcrypt";
import { userModelTypes } from "../auth/model";

import * as types from "../../utils/types/types";
import Service from '../auth/service';
import UserService from './service'
import { isMongoId } from "../../utils/common_functions/common_functions";

export default {
    followUnfollowController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (id === req.user?._id) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'You can not follow yourself.'));
            }

            const toUser = await Service.checkUserExist({      
                 _id: id 
            }) as userModelTypes

            const currentUser = await Service.checkUserExist({      
                _id: req.user?._id 
           }) as userModelTypes

            if (!toUser || !currentUser) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'User not found.'));
            };

            let resMsg = '';

            const isFollowing = currentUser.following.some((followingId: any) => followingId+'' === toUser._id+'');

            if (isFollowing) {
                resMsg = 'Unfollowed successfully';
                currentUser.following = currentUser.following.filter((followingId: any) => followingId+'' !== toUser._id+'');
                toUser.followers = toUser.followers.filter((followerId: any) => followerId+'' !== currentUser._id+'');
            } else {
                resMsg = 'Followed successfully';
                currentUser.following.push(toUser._id);
                toUser.followers.push(currentUser._id);
            }

            // Update users
            await UserService.updateUser({
                query: { _id: currentUser._id },
                updateDoc: { following: currentUser.following }
            })

            await UserService.updateUser({
                query: { _id: toUser._id },
                updateDoc: { followers: toUser.followers }
            })


            return res.json({
                status: true,
                message: resMsg,
                data: {}
            })
        }
        catch (err) {
            log.debug("Error while login");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },

    updateUserController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, username, email, bio } = req.body;
            let { profilePic } = req.body;

            const userId = req.user?._id
            const user = req.user

            if (!user) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'User not found.'));
            };
            
            if (profilePic) {

                if (user.profilePic) {
                    cloudinary.uploader.destroy(user.profilePic?.split('/').pop()?.split('.')[0] as string)
                }

                const uploadedResponse = await cloudinary.uploader.upload(profilePic)

                profilePic = uploadedResponse.secure_url;
            }

            user.name = name || user.name
            user.username = username || user.username
            user.email = email || user.email
            user.profilePic = profilePic || user.profilePic
            user.bio = bio || user.bio


            const updatedUser = await UserService.updateUser({
                query: { _id: userId },
                updateDoc: user
            })

            delete user.password

            return res.json({
                status: true,
                message: 'Profile updated successfully',
                data: user
            })
        }
        catch (err) {
            log.debug("Error while login");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },

    getUserByIdOrUsernameController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const query = []

            // check whether id is a mongoId 
            if (isMongoId(id)) {
                query.push({ _id: id, isDeleted: false })            
            } else {
                query.push({ username: id, isDeleted: false })
            }

            const user = await Service.checkUserExist({
                $or: query
            }) as userModelTypes

            if (!user) {
                return next(new ApiError(httpStatus.NOT_FOUND, 'User not found.'));
            };

            delete user.password

            return res.json({
                status: true,
                message: 'User details fetched successfully.',
                data: user
            })
        }
        catch (err) {
            log.debug("Error while login");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },

    getUsersByUsernameController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;

            const query = []

            query.push({ username, isDeleted: false })

            const user = await UserService.getUsersByQuery({query: {
                $or: query
            }})

            if (!user) {
                return next(new ApiError(httpStatus.NOT_FOUND, 'User not found.'));
            };

            return res.json({
                status: true,
                message: 'Users fetched successfully.',
                data: user
            })
        }
        catch (err) {
            log.debug("Error while login");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    }
}