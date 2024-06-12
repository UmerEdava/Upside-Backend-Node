const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
import { celebrate } from 'celebrate';

export default {
    sendMessage: celebrate({
        body: Joi.object({
            recipientId: Joi.objectId().required(),
            message: Joi.string().max(1000).allow(''),
            img: Joi.string().allow('')
        })
    }),
    updatePost: celebrate({
        body: Joi.object({
            _id: Joi.objectId().required(),
            text: Joi.string().max(1000),
            img: Joi.string()
        })
    }),
    deletePost: celebrate({
        params: {
            id: Joi.objectId().required()
        }
    }),
    getAllOtherUserPosts: celebrate({
        params: {
            idOrUsername: Joi.string().required()
        }
    }),
    getPost: celebrate({
        params: {
            id: Joi.objectId().required()
        }
    }),
    likePost: celebrate({
        body: Joi.object({
            postId: Joi.objectId().required(),
        })
    }),
    commentPost: celebrate({
        body: Joi.object({
            postId: Joi.objectId().required(),
            text: Joi.string().max(500).required(),
        })
    }),
    deleteComment: celebrate({
        query: {
            postId: Joi.objectId().required(),
            commentId: Joi.objectId().required(),
        }
    }),
    likeComment: celebrate({
        body: Joi.object({
            postId: Joi.objectId().required(),
            commentId: Joi.objectId().required(),
        })
    }),
    searchChats: celebrate({
        params: {
            username: Joi.string().required()
        }
    }),
    getAgoraToken: celebrate({
        query: {
            uid: Joi.string().required(),
            channelName: Joi.string().required()
        }
    })
}