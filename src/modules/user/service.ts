import * as constants from '../../utils/constants/index';
import UserModel from "../auth/model";
import * as types from '../../utils/types/types';
import { DBService } from '../../utils/dbService/dbService';

const DB = new DBService();

export default {
    getUser: async ({query}: any) => {
        return await DB.getOneByQuery(constants.COLLECTIONS.USER_COLLECTION, query, {});
    },
    getUserById: async (id: string) => {
        return await DB.getById(constants.COLLECTIONS.USER_COLLECTION, id, {});
    },
    updateUser: async ({query, updateDoc}: any) => {
        return await DB.updateOne(constants.COLLECTIONS.USER_COLLECTION, query, {$set: updateDoc}, null);
    }
}