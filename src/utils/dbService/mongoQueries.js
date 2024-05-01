const {
    errHandler,
    getMongoDbConnection
} = require('../../../core/helpers');
const {
    ObjectId
} = require('mongodb');
const condition = [{
    $match: {
        chrStatus: 'N'
    },
}, ]
async function getListDB({
    strCollection,
    arrQuery = condition
}) {
    try {
        let objConnection = await getMongoDbConnection()
        return objConnection.collection(strCollection).aggregate(arrQuery).toArray()
    } catch (error) {
        console.log("error",error);
        throw new errHandler(error)
    }
}

async function getOneDB({
    strCollection,
    objQuery = {
        chrStatus: 'N'
    },
    objProject = null
}) {
    try {
        let objConnection = await getMongoDbConnection();
        if(objProject)
        return objConnection.collection(strCollection).findOne(objQuery,{ projection:objProject })
        return objConnection.collection(strCollection).findOne(objQuery)
    } catch (error) {
        throw new errHandler(error)
    }
}

async function insertManyDB({
    strCollection,
    arrInsertDocuments,
    options = null
}) {
    try {
        let objConnection = await getMongoDbConnection();

        // Keep track of successfully inserted document IDs
        const successfullyInsertedIds = [];

        for (const document of arrInsertDocuments) {
            try {
                let objInsert = {};

                if (options) {
                    objInsert = await objConnection.collection(strCollection).insertOne(document, options);
                } else {
                    objInsert = await objConnection.collection(strCollection).insertOne(document);
                }

                // Push the successfully inserted document ID into the array
                successfullyInsertedIds.push(objInsert.insertedId);
            } catch (error) {
                if (error.code === 11000) {
                    console.warn(`Duplicate key error. Skipping this query for document with _id: ${document._id}.`);
                } else {
                    throw new errHandler(error);
                }
            }
        }

        console.log("Successfully inserted IDs:", successfullyInsertedIds);

        return {
            successfullyInsertedIds,
            "strMessage": "Success"
        };
    } catch (error) {
        throw new errHandler(error);
    }
}


async function insertOneDB({
    objDocument,
    strCollection
}) {
    try {
        let objConnection = await getMongoDbConnection()
        return objConnection.collection(strCollection).insertOne({
            chrStatus: 'N',
            ...objDocument,
        })
    } catch (error) {
        throw new errHandler(error)
    }
}

async function insertOneTransaction({
    objDocument,
    strCollection
}) {
    try {

        let objConnection = await getMongoDbConnection()
        return objConnection.collection(strCollection).insertOne(objDocument)
    } catch (error) {
        throw new errHandler(error)
    }
}


async function updateOneKeyDB({
    _id,
    objMatch,
    strCollection,
    objDocument,
    options = null
}) {
    let objConnection = await getMongoDbConnection()
    try {
        if(options){
            console.log("SSDFSDds",objDocument,objMatch);
        await objConnection.collection(strCollection).updateOne(_id ? {
            ...objMatch || {},
            _id: new ObjectId(_id),
        } : objMatch, { $set:objDocument},options)
        }
        await objConnection.collection(strCollection).updateOne(_id ? {
            ...objMatch || {},
            _id: new ObjectId(_id),
        } : objMatch, { $set:objDocument})
        return {
            "strMessage": "UPDATE_SUCCESS"
        }
    } catch (error) {
        throw new errHandler(error)
    }
}


async function updateManyDB({
    strCollection,
    objMatch,
    objDocument,
    options = null
}) {
    try {
        let objConnection = await getMongoDbConnection();

        if (options) {
            await objConnection.collection(strCollection).updateMany(objMatch, { $set: objDocument }, options);
        } else {
            await objConnection.collection(strCollection).updateMany(objMatch, { $set: objDocument });
        }

        return {
            "strMessage": "UPDATE_SUCCESS"
        }
    } catch (error) {
        throw new errHandler(error);
    }
}



async function updateFindOneKeyDB({
    _id,
    objMatch,
    strCollection,
    objDocument
}) {
    let objConnection = await getMongoDbConnection()
    try {
        let objResult = await objConnection.collection(strCollection).findOneAndUpdate(_id ? {
            ...objMatch || {},
            _id: new ObjectId(_id),
        } : objMatch, { $set:objDocument})
        return objResult;
    } catch (error) {
        throw new errHandler(error)
    }
}

async function deleteOneDB({
    strCollection,
    _id,
    timReceived,
    strUserId
}) {
    let objConnection = await getMongoDbConnection()
    try {
        await objConnection.collection(strCollection).updateOne({
            _id: new ObjectId(_id)
        }, {
            $set: {
                "chrStatus": "D",
                strModifiedTime: timReceived,
                strModifiedUser: strUserId
            }
        })
        return {}
    } catch (error) {
        throw new errHandler(error)
    }
}


async function deleteHardOneDB({
    strCollection,
    objMatch
}) {
    let objConnection = await getMongoDbConnection()
    try {
        return objConnection.collection(strCollection).deleteOne(objMatch)
        //return {}
    } catch (error) {
        throw new errHandler(error)
    }
}
async function deleteDB({
    strCollection,
    arrDeleteId,
    strModifiedTime,
    strModifiedUser
}) {
    let objConnection = await getMongoDbConnection()
    try {
        let arrOldItem = await objConnection.collection(strCollection).find({
            "_id": {
                $in: arrDeleteId
            }
        }).toArray()
        if (arrOldItem.length != arrDeleteId.length) {
            throw new errHandler("ITEM_MISMACTH")
        }
        await objConnection.collection(strCollection).updateMany({
            "_id": {
                $in: arrDeleteId
            }
        }, {
            $set: {
                "chrStatus": "D",
                strModifiedTime,
                strModifiedUser
            }
        })
        return {}
    } catch (error) {
        throw new errHandler(error)
    }
}


async function getCountDB({
    strCollection,
    objQuery
}) {
    try {
        let objConnection = await getMongoDbConnection();
        const count = await objConnection.collection(strCollection).countDocuments(objQuery);
        return count;
    } catch (error) {
        throw new errHandler(error);
    }
}



module.exports = {
    getListDB,
    getOneDB,
    insertManyDB,
    insertOneDB,
    insertOneTransaction,
    updateOneKeyDB,
    deleteDB,
    deleteOneDB,
    getCountDB,
    updateFindOneKeyDB,
    deleteHardOneDB,
    updateManyDB
}