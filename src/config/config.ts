export default Object.freeze({
    "APP_NAME": process.env.APP_NAME || 'UPSIDE_SERVER',
    "PORT": process.env.APP_PORT || 3333,
    "MONGO_URI": process.env.MONGO_URI || `mongodb://localhost:27017/${process.env.APP_NAME || 'UPSIDE_SERVER'}`,
    // "MONGO_URI": process.env.MONGO_URI,
    "MONGO_DB_PORT": Number(process.env.MONGO_DB_PORT) || 27017,
    "HOST": process.env.NODE_ENV === "development" ? "localhost" : ""
});