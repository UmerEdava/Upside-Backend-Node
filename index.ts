
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import config from "./src/config/config";
import { Database } from './src/config/db';
import { log } from './src/config/logger';
import { server } from './src/socket/socket';

const DB = new Database();

// Checking the env variables (if you have local mongodb setup, then comment MONGO_URI validation)
if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
}
if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
}

const exitHandler = (error: any) => {
    log.info(error);
    console.log('error')
    process.exit(1);
};

const unexpectedErrorHandler = (err: any) => {
    exitHandler(err);
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGINT", () => {
    DB.disconnect();
    log.info(
        'csv-viewer: Connection to database closed due to nodejs process termination'
    );
    // eslint-disable-next-line no-process-exit
    process.exit(0);
});

const startServer = async () => {

    try {
        await DB.connect();
    } catch (error) {
        console.log('>>error',error)
        log.error('>>error',error)
        process.exit(1)
    }

    server.listen(config.PORT, () => {
        log.info(`Upside server is started on port: ${config.PORT}`)
        console.log(`Upside server is started on port: ${config.PORT}`)
    })
};


startServer();