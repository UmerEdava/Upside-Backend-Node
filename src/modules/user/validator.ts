const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
import { celebrate } from 'celebrate';

export default {
    followUser: celebrate({
        params: {
            id: Joi.objectId().required(),
        }
    }),
    getUserById: celebrate({
        params: {
            id: Joi.string().required(),
        }
    }),
    updateUser: celebrate({
        body: Joi.object({
            name: Joi.string().min(3).max(22).allow(null),
            username: Joi.string().min(2).max(30).allow(null),
            email: Joi.string().email(),
            profilePic: Joi.string().allow(''),
            bio: Joi.string(),
        })
    }),
    getUsersByUsername: celebrate({
        params: {
            username: Joi.string().required(),
        }
    }),
}