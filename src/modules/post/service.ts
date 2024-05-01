import * as constants from '../../utils/constants/index';
import UserModel from "./model";
import * as types from '../../utils/types/types';
import { DBService } from '../../utils/dbService/dbService';
const DB = new DBService();

export default {
    createPost: async (postData: types.CREATE_POST, opts: any) => {
        const post = await DB.insertOne(constants.COLLECTIONS.POST_COLLECTION, {
            postedBy: postData.postedBy,
            text: postData.text,
            img: postData.img
        }, opts);
        delete post.createdAt;
        delete post.updatedAt;
        delete post.__v;
        return DB.normalizeObject(post);
    },
    getPostById: async (id: string) => {
        return await DB.getById(constants.COLLECTIONS.POST_COLLECTION, id, {});
    },
    getPost: async ({query}: {query: any}) => {
        return await DB.getOneByQuery(constants.COLLECTIONS.POST_COLLECTION, query, {});
    },
    getAllPosts: async ({query}: any) => {
        return await DB.getByQuery(constants.COLLECTIONS.POST_COLLECTION, query, {});
    },
    updatePost: async ({query, updateDoc, opts}: {query: any, updateDoc: any, opts: any}) => {
        return await DB.updateOne(constants.COLLECTIONS.POST_COLLECTION, query, {$set: updateDoc}, opts);
    },
    deletePost: async (id: string) => {
        return await DB.deleteById(constants.COLLECTIONS.POST_COLLECTION, id);
    },
}