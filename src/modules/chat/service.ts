import * as constants from '../../utils/constants/index';
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
        delete post.__v;
        return DB.normalizeObject(post);
    },
    // getPostById: async (id: string) => {
    //     return await postModel.findOne({ _id: id }).populate('postedBy');
    // },
    // getPost: async ({query, opts}: {query: any, opts: any}) => {
    //     return await DB.getOneByQuery(constants.COLLECTIONS.POST_COLLECTION, query, opts || {});
    // },
    // getAllPosts: async ({query, opts}: any) => {
    //     return await DB.getByQuery(constants.COLLECTIONS.POST_COLLECTION, query, opts || {});
    // },
    // updatePostByDoc: async ({query, updateDoc, opts}: {query: any, updateDoc: any, opts: any}) => {
    //     return await DB.updateOne(constants.COLLECTIONS.POST_COLLECTION, query, {$set: updateDoc}, opts);
    // },
    // updatePostByQuery: async ({query, updateQuery, opts}: {query: any, updateQuery: any, opts: any}) => {
    //     return await DB.updateOne(constants.COLLECTIONS.POST_COLLECTION, query, updateQuery, opts);
    // },
    // deletePost: async (id: string) => {
    //     return await DB.deleteById(constants.COLLECTIONS.POST_COLLECTION, id);
    // },
}