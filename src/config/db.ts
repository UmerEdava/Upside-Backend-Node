import mongoose, {ConnectOptions} from 'mongoose';
import config from "./config";
import { log } from './logger';

export class Database {
    private mongoose = mongoose;

    async connect() {
        try {
            const mongoUri = config.MONGO_URI
            const host = config.HOST
            const port = config.PORT
            const opts = {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
            const name = 'upside-server'
            const replSet = ''
        
            let db: any;
            mongoose.set("strictQuery", false);
            if (mongoUri) {
                log.info('connecting to database');
                db = await this.mongoose.connect(mongoUri, opts as ConnectOptions);
            } else {
                db = await this.mongoose.connect(
                    `mongodb://${host}:${port}/${name}`,
                    opts as ConnectOptions
                )
            }
            log.info(`Connected to database - ${db.connections[0]?.host}/${db.connections[0]?.name} successfully'`);
            console.log(`Connected to database - ${db.connections[0]?.host}/${db.connections[0]?.name} successfully`);
            
        }
        catch (err) {
            log.info('failed to connect with database');
            log.error(err);
            throw new Error('failed to connect to database');
        }
    }

    async disconnect() {
        return await mongoose.disconnect();
    }
}