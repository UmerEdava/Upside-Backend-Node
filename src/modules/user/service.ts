import * as constants from '../../utils/constants/index';
import UserModel, { userModelTypes } from "../auth/model";
import * as types from '../../utils/types/types';
import { DBService } from '../../utils/dbService/dbService';
import { Filter, FindOptions } from 'mongodb';
import { QueryOptions } from 'mongoose';

const DB = new DBService();

export default {
    getUser: async ({query}: {query: any}) => {
        return await DB.getOneByQuery(constants.COLLECTIONS.USER_COLLECTION, query, {});
    },
    getUserById: async (id: string, opts?: any) => {
        return await DB.getById(constants.COLLECTIONS.USER_COLLECTION, id, opts || {});
    },
    updateUser: async ({query, updateDoc}: {query: any, updateDoc: any}) => {
        return await DB.updateOne(constants.COLLECTIONS.USER_COLLECTION, query, {$set: updateDoc}, null);
    },
    getUsersByQuery: async ({query, opts}: {query: Filter<userModelTypes>, opts?: any}) => {
        return await DB.getByQuery(constants.COLLECTIONS.USER_COLLECTION, query, {
            ...(opts.projections ? { ...opts.projections, __v: 0, password: 0, createdAt: 0, updatedAt: 0 } : { __v: 0, password: 0, createdAt: 0, updatedAt: 0 }),
        })
    },
    getUsersByAggregate: async ({query}: {query: any}) => {
        return await DB.aggregate(constants.COLLECTIONS.USER_COLLECTION, query)
    },
}