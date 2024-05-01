import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";

import { ApiError } from "../../middlewares/errorHandler/ApiError";
import { JWT } from "../../utils/jwt/jwt";
import { log } from "../../config/logger";
import { Bcrypt } from "../../utils/bcrypt/Bcrypt";
import { postModelTypes } from "./model";

import * as types from "../../utils/types/types";
import UserService from '../user/service';
import Service from './service'
import { userModelTypes } from "../auth/model";

export default {
    createPostController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { text, img } = req.body;

            if (!text && !img) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide text or image'));
            }

            const newPost = await Service.createPost({
                postedBy: req.userId as string,
                text,
                img
            },{})

            return res.json({
                status: true,
                message: 'Post added successfully',
                data: newPost
            })
        }
        catch (err) {
            console.log("🚀 ~ createPostController: ~ err:", err)
            log.debug("Error while creating post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    updatePostController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id, text, img } = req.body;

            const postDetails = await Service.getPostById(_id) as postModelTypes

            if (!postDetails) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Post not found.'));
            }

            postDetails.text = text || postDetails.text
            postDetails.img = img || postDetails.img

            const updatedUser = await Service.updatePost({
                query: { _id },
                updateDoc: postDetails,
                opts: { new: true }
            })


            return res.json({
                status: true,
                message: 'Post edited successfully',
                data: postDetails
            })
        }
        catch (err) {
            log.debug("Error while editing post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    deletePostController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const postDetails = await Service.getPostById(id) as postModelTypes

            if (!postDetails) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Post not found.'));
            }

            const deletedPost = await Service.updatePost({
                query: { _id: id },
                updateDoc: { isDeleted: true },
                opts: { new: true }
            })

            return res.json({
                status: true,
                message: 'Post deleted successfully',
                data: {}
            })
        }
        catch (err) {
            log.debug("Error while deleting post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    getCurrentUserPostsController: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const posts = await Service.getAllPosts({ query: { postedBy: req.userId } }) as postModelTypes[]

            return res.json({
                status: true,
                message: 'Posts fetched successfully',
                data: {
                    posts
                }
            })
        }
        catch (err) {
            log.debug("Error while fetching posts");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    getAllPostsController: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { userId } = req.params

            const posts = await Service.getAllPosts({ query: { postedBy: userId, isDeleted: false } }) as postModelTypes[]

            return res.json({
                status: true,
                message: 'Posts fetched successfully',
                data: {
                    posts
                }
            })
        }
        catch (err) {
            log.debug("Error while fetching posts");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    getPostController: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { id } = req.params

            const post = await Service.getPost({query: {
                _id: id,
                isDeleted: false
            }}) as postModelTypes

            if (!post) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Post not found.'));
            }

            return res.json({
                status: true,
                message: 'Post fetched successfully',
                data: {
                    post
                }
            })
        }
        catch (err) {
            log.debug("Error while fetching post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    likeUnlikePostController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId, userId } = req.body;

            const postDetails = await Service.getPostById(postId) as postModelTypes

            if (!postDetails) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Post not found.'));
            }

            const isLiked = postDetails.likes.some((like: any) => like+'' === userId+'');

            if (isLiked) {
                // unlike
                const updatedPost = await Service.updatePost({
                    query: { _id: postId },
                    updateDoc: { $pull: { likes: userId } },
                    opts: { new: true }
                })

                return res.json({
                    status: true,
                    message: 'Unliked successfully',
                    data: updatedPost
                })
            }
            else {
                // like
                const updatedPost = await Service.updatePost({
                    query: { _id: postId },
                    updateDoc: { $push: { likes: userId } },
                    opts: { new: true }
                })

                return res.json({
                    status: true,
                    message: 'Liked successfully',
                    data: updatedPost
                })
            }

        }
        catch (err) {
            log.debug("Error while editing post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    commentPostController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId, userId, text } = req.body;

            const postDetails = await Service.getPostById(postId) as postModelTypes

            if (!postDetails) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Post not found.'));
            }

            const newComment = {
                userId,
                text
            }

            const updatedPost = await Service.updatePost({
                query: { _id: postId },
                updateDoc: {
                    $push: { comments: newComment }
                },
                opts: { new: true }
            })


            return res.json({
                status: true,
                message: 'Comment added successfully',
                data: updatedPost
            })
        }
        catch (err) {
            log.debug("Error while editing post");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    getFeedPostsController: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const followingList = req.user?.following || []

            const feedPosts = await Service.getAllPosts({ query: { postedBy: { $in: followingList }, isDeleted: false } }) as postModelTypes[]

            return res.json({
                status: true,
                message: 'Feed posts fetched successfully',
                data: {
                    feedPosts
                }
            })
        }
        catch (err) {
            log.debug("Error while fetching feed posts");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
}