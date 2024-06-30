import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { v2 as cloudinary } from "cloudinary";

import { ApiError } from "../../middlewares/errorHandler/ApiError";
import { log } from "../../config/logger";
import { ChatModel, chatModelTypes, MESSAGE_STATUS_TYPES, MessageModel, messageModelTypes } from "./model";

import * as types from "../../utils/types/types";
import Service from "./service";
import UserService from '../user/service'
import { send } from "process";
import { getRecipientSocketId, io } from "../../socket/socket";

export default {
  sendMessageController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { recipientId, message } = req.body;
      let { img } = req.body;

      const senderId = req.user?._id

      if (senderId == recipientId) {
        return next(
          new ApiError(httpStatus.BAD_REQUEST, "You can't send message to yourself")
        );
      }

      // Check whether a chat is already exists between these users
      let chat = await ChatModel.findOne({
        participants: { $all: [senderId, recipientId] },
      })

      if (!chat) {
        // Create a new chat with these users
        chat = new ChatModel({
          participants: [senderId, recipientId],
          lastMessage: {
            text: message,
            sender: senderId
          }
        })

        await chat.save()
      }

      // Upload Image
      if (img) {
          const uploadedResponse = await cloudinary.uploader.upload(img);
          img = uploadedResponse.secure_url;
      }

      const newMessage = new MessageModel({
        chatId: chat._id,
        sender: senderId,
        text: message,
        img: img || '',
        status: MESSAGE_STATUS_TYPES.SENT
      })

      await Promise.all([
        newMessage.save(),
        chat.updateOne({
          lastMessage: {
            text: message,
            sender: senderId
          }
        })
      ])

      const recipientSocketId = getRecipientSocketId(recipientId)

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", newMessage)
      }

      return res.json({
        status: true,
        message: "Message sent successfully",
        data: newMessage,
      });
    } catch (err) {
      log.debug("Error while sending message");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getChatMessagesController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { chatId } = req.params;
      const userId = req.user?._id

      // Find chat
      let chat = await ChatModel.findOne({
        _id: chatId,
        participants: {$in: [userId]},
        isDeleted: false
      })

      if (!chat) {
        return next(
          new ApiError(httpStatus.BAD_REQUEST, "Invalid chat Id.")
        );
      }

      const messages = await MessageModel.find({
        chatId
      }).sort({createdAt: 1})

      return res.json({
        status: true,
        message: "Messages fetched successfully",
        data: {messages},
      });
    } catch (err) {
      log.debug("Error while fetching messages");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getUserChatsController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?._id

      // Fetch all chats of current user
      let chats = []
      let chatsResult = await ChatModel.find({
        participants: userId,
        isDeleted: false
      }).populate({
        path: "participants",
        select: ["_id", "name", "username", "profilePic", "mobile_number"]
      }).sort({updatedAt: -1}).lean()

      chats = chatsResult as any

      // Find all unseen messages
      const unseenMessages = await MessageModel.find({
        chatId: { $in: chats.map((chat: any) => chat._id) },
        sender: { $ne: userId },
        seen: false
      })

      // Remove current user from participants
      chats.forEach((chat: any) => {
        chat.participants = chat.participants.filter((participant: any) => participant?._id+'' != userId+'')   
        
        // find unseen messages for each chat
        chat.unSeenCount = unseenMessages.filter((unseenMessage: any) => unseenMessage.chatId+'' == chat._id+'').length

      })

      return res.json({
        status: true,
        message: "Chats fetched successfully",
        data: {
          chats
        },
      });
    } catch (err) {
      log.debug("Error while fetching chats");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getChatsAndUsersByUsernameController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { username } = req.params
      const userId = req.user?._id

      // Fetch all users with username
      const searchedUsers = await UserService.getUsersByQuery({query: {
          _id: { $ne: userId },
          username: { $regex: username, $options: 'i' },
          isDeleted: false
      }})

      const userIds = searchedUsers.map((user: any) => user._id)
      console.log("🚀 ~ userIds:", userIds)

      // Fetch all chats of current user
      let chatsWithSearchedUsers = await ChatModel.find({
        $and: [
          { participants: userId },
          { participants: { $in: userIds } },
          { isDeleted: false }
        ]
      }).populate({
        path: "participants",
        select: ["_id", "name", "username", "profilePic", "mobile_number"]
      }).sort({updatedAt: -1}).lean()
      console.log("🚀 ~ chats:", chatsWithSearchedUsers)

      const notChattedUsers = searchedUsers.filter((user: any) => {
        return chatsWithSearchedUsers.every((chat: any) => {
          return !chat.participants.some((participant: any) => participant._id+'' === user._id+'')
        })
      })
      console.log("🚀 ~ notChattedUsers:", notChattedUsers)

      // add "lastMessage", "participants", "notChatted" fields to notChattedUsers
      notChattedUsers.forEach((user: any) => {
        user.lastMessage = {
          text: "",
          sender: ""
        }
        user.participants = [{
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePic: user.profilePic
        }]
        user.notChatted = true
      })
      console.log("🚀 ~ notChattedUsers.forEach ~ notChattedUsers:", notChattedUsers)

      // Remove current user from participants
      chatsWithSearchedUsers.forEach((chat) => {
        chat.participants = chat.participants.filter((participant: any) => participant?._id+'' != userId+'')        
      })

      return res.json({
        status: true,
        message: "Chats fetched successfully",
        data: {
          chats: [...chatsWithSearchedUsers, ...notChattedUsers]
        },
      });
    } catch (err) {
      log.debug("Error while fetching chats");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },

  getAgoraTokenController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { uid, channelName } = req.query
      const token = await Service.getAgoraToken(uid as string, channelName as string)
      return res.json({
        status: true,
        message: "Token fetched successfully",
        data: {
          token
        },
      });
    } catch (err) {
      log.debug("Error while fetching token");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  }
  
  
  
  // updatePostController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { _id, text } = req.body;
  //     let { img } = req.body;

  //     const postDetails = (await Service.getPostById(_id)) as postModelTypes;

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     postDetails.text = text || postDetails.text;

  //     if (img) {
  //       const uploadedResponse = await cloudinary.uploader.upload(img);
  //       img = uploadedResponse.secure_url;
  //     } else {
  //       img = postDetails.img;
  //     }

  //     const updatedUser = await Service.updatePostByDoc({
  //       query: { _id },
  //       updateDoc: postDetails,
  //       opts: { new: true },
  //     });

  //     return res.json({
  //       status: true,
  //       message: "Post edited successfully",
  //       data: postDetails,
  //     });
  //   } catch (err) {
  //     log.debug("Error while editing post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // deletePostController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { id } = req.params;

  //     const postDetails = (await Service.getPostById(id)) as postModelTypes;

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     const deletedPost = await Service.updatePostByDoc({
  //       query: { _id: id },
  //       updateDoc: { isDeleted: true },
  //       opts: { new: true },
  //     });

  //     return res.json({
  //       status: true,
  //       message: "Post deleted successfully",
  //       data: {},
  //     });
  //   } catch (err) {
  //     log.debug("Error while deleting post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // getCurrentUserPostsController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const posts = (await Service.getAllPosts({
  //       query: { postedBy: req.userId },
  //     })) as postModelTypes[];

  //     return res.json({
  //       status: true,
  //       message: "Posts fetched successfully",
  //       data: {
  //         posts,
  //       },
  //     });
  //   } catch (err) {
  //     log.debug("Error while fetching posts");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // getAllPostsController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { idOrUsername } = req.params;

  //     const mongoId = isMongoId(idOrUsername);

  //     let userId = idOrUsername;
  //     if (!mongoId) {
  //       const user = (await UserService.getUser({
  //         query: { username: idOrUsername },
  //       })) as userModelTypes;
  //       if (!user) {
  //         return next(new ApiError(httpStatus.BAD_REQUEST, "User not found"));
  //       }
  //       userId = user._id;
  //     }

  //     const posts = (await Service.getAllPosts({
  //       query: { $and: [{ postedBy: userId }, { isDeleted: false }] },
  //       opts: {
  //         populateQuery: {
  //           path: "postedBy",
  //           select: ["_id", "name", "username", "profilePic"],
  //         },
  //         sortOption: { createdAt: -1 },
  //       },
  //     })) as postModelTypes[];

  //     return res.json({
  //       status: true,
  //       message: "Posts fetched successfully",
  //       data: {
  //         posts,
  //       },
  //     });
  //   } catch (err) {
  //     log.debug("Error while fetching posts");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // getPostController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { id } = req.params;

  //     const post = (await Service.getPost({
  //       query: {
  //         _id: id,
  //         isDeleted: false,
  //       },
  //       opts: {
  //         populateQuery: [
  //           {
  //             path: "postedBy",
  //             select: ["_id", "name", "username", "profilePic"],
  //           },
  //           {
  //             path: "comments",
  //             select: ["_id", "text", "userId"],
  //             populate: {
  //               path: "userId",
  //               select: ["_id", "name", "username", "profilePic"],
  //             },
  //           },
  //         ],
  //       },
  //     })) as postModelTypes;

  //     if (!post) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     // Add latest on top sorting in comments
  //     post.comments = post.comments.sort((a: any, b: any) => {
  //       return (
  //         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //       );
  //     });
  //     console.log("🚀 ~ post.comments=post.comments.sort ~ post.comments:", post.comments)

  //     // Filter out deleted comments
  //     post.comments = post.comments.filter(
  //       (comment: any) => comment.isDeleted === false || !comment.isDeleted 
  //     );

  //     return res.json({
  //       status: true,
  //       message: "Post fetched successfully",
  //       data: {
  //         post,
  //       },
  //     });
  //   } catch (err) {
  //     log.debug("Error while fetching post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // likeUnlikePostController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { postId } = req.body;
  //     const userId = req.userId;

  //     const postDetails = (await Service.getPostById(postId)) as postModelTypes;

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     const isLiked = postDetails.likes.some(
  //       (like: any) => like + "" === userId + ""
  //     );

  //     if (isLiked) {
  //       // unlike
  //       postDetails.likes = postDetails.likes.filter(
  //         (like: any) => like + "" !== userId + ""
  //       );
  //       const updatedPost = await Service.updatePostByDoc({
  //         query: { _id: postId },
  //         updateDoc: { likes: postDetails.likes },
  //         opts: { new: true },
  //       });

  //       return res.json({
  //         status: true,
  //         message: "Unliked successfully",
  //         data: updatedPost,
  //       });
  //     } else {
  //       // like
  //       console.log("🚀 ~ likeUnlikePostController: ~ userId:", userId);
  //       postDetails.likes.push(userId as string);
  //       const updatedPost = await Service.updatePostByDoc({
  //         query: { _id: postId },
  //         updateDoc: { likes: postDetails.likes },
  //         opts: { new: true },
  //       });
  //       console.log(
  //         "🚀 ~ likeUnlikePostController: ~ updatedPost:",
  //         updatedPost
  //       );

  //       return res.json({
  //         status: true,
  //         message: "Liked successfully",
  //         data: updatedPost,
  //       });
  //     }
  //   } catch (err) {
  //     log.debug("Error while editing post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // commentPostController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { postId, text } = req.body;

  //     const userId = req.userId;

  //     const postDetails = (await Service.getPostById(postId)) as postModelTypes;

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     const newComment = {
  //       userId,
  //       text,
  //     };

  //     const comments = [...postDetails.comments, newComment];

  //     const updatedPost = await Service.updatePostByDoc({
  //       query: { _id: postId },
  //       updateDoc: {
  //         comments,
  //       },
  //       opts: { new: true },
  //     });

  //     return res.json({
  //       status: true,
  //       message: "Comment added successfully",
  //       data: updatedPost,
  //     });
  //   } catch (err) {
  //     log.debug("Error while editing post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // getFeedPostsController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const followingList = req.user?.following || [];

  //     const feedPosts = (await Service.getAllPosts({
  //       query: { postedBy: { $in: followingList }, isDeleted: false },
  //       opts: {
  //         populateQuery: {
  //           path: "postedBy",
  //           select: ["_id", "name", "username", "profilePic"],
  //         },
  //       },
  //     })) as postModelTypes[];

  //     return res.json({
  //       status: true,
  //       message: "Feed posts fetched successfully",
  //       data: {
  //         feedPosts,
  //       },
  //     });
  //   } catch (err) {
  //     log.debug("Error while fetching feed posts");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
  // deleteCommentController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     console.log("in delete comment controller");
  //     const { postId, commentId } = req.query;

  //     const userId = req.userId;

  //     const postDetails = (await Service.getPostById(
  //       postId as string
  //     )) as postModelTypes;
  //     console.log("🚀 ~ postDetails:", postDetails);

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     // Find comment
  //     const comment = postDetails.comments.find(
  //       (comment: any) => comment._id + "" === commentId + ""
  //     );
  //     console.log("🚀 ~ comment:", comment);

  //     if (!comment) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Comment not found."));
  //     }

  //     if (comment.userId + "" !== userId + "") {
  //       return next(
  //         new ApiError(
  //           httpStatus.UNAUTHORIZED,
  //           "You are not authorized to delete this comment"
  //         )
  //       );
  //     }

  //     // delete comment (update the comment as isDeleted true)
  //     const updatedPost = await Service.updatePostByQuery({
  //       query: { _id: postId, "comments._id": commentId },
  //       updateQuery: {
  //         $set: {
  //           "comments.$.isDeleted": true,
  //         },
  //       },
  //       opts: { new: true },
  //     });
  //     console.log("🚀 ~ updatedPost:", updatedPost);

  //     return res.json({
  //       status: true,
  //       message: "Comment added successfully",
  //       data: updatedPost,
  //     });
  //   } catch (err) {
  //     log.debug("Error while editing post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },

  // likeUnlikeCommentController: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const { postId, commentId } = req.body;
  //     const userId = req.userId;
  //     console.log("🚀 ~ userId:", userId);

  //     const postDetails = (await Service.getPost({
  //       query: {
  //         _id: postId,
  //         isDeleted: false,
  //         "comments._id": commentId,
  //         "comments.userId": userId,
  //         "comments.isDeleted": false,
  //       },
  //       opts: {},
  //     })) as postModelTypes;
  //     console.log("🚀 ~ postDetails:", postDetails);

  //     if (!postDetails) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
  //     }

  //     // find comment

  //     const comment = postDetails.comments.find(
  //       (comment: any) => comment._id + "" === commentId + ""
  //     );

  //     if (!comment) {
  //       return next(new ApiError(httpStatus.BAD_REQUEST, "Comment not found."));
  //     }

  //     const isLiked = comment.likes.some(
  //       (like: any) => like + "" === userId + ""
  //     );

  //     if (isLiked) {
  //       // unlike
  //       comment.likes = comment.likes.filter(
  //         (like: any) => like + "" !== userId + ""
  //       );
  //       const updatedPost = await Service.updatePostByQuery({
  //         query: { _id: postId, "comments._id": commentId },
  //         updateQuery: {
  //           $set: {
  //             "comments.$.likes": comment.likes,
  //           },
  //         },
  //         opts: { new: true },
  //       });

  //       return res.json({
  //         status: true,
  //         message: "Unliked successfully",
  //         data: updatedPost,
  //       });
  //     } else {
  //       // like
  //       console.log("🚀 ~ likeUnlikePostController: ~ userId:", userId);
  //       comment.likes.push(userId as string);
  //       const updatedPost = await Service.updatePostByQuery({
  //         query: { _id: postId, "comments._id": commentId },
  //         updateQuery: {
  //           $set: {
  //             "comments.$.likes": comment.likes,
  //           },
  //         },
  //         opts: { new: true },
  //       });
  //       console.log(
  //         "🚀 ~ likeUnlikePostController: ~ updatedPost:",
  //         updatedPost
  //       );

  //       return res.json({
  //         status: true,
  //         message: "Liked successfully",
  //         data: updatedPost,
  //       });
  //     }
  //   } catch (err) {
  //     log.debug("Error while editing post");
  //     log.error(err);
  //     return next(
  //       new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
  //     );
  //   }
  // },
};
