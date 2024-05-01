import express from "express";
import cors from 'cors';

import { ApiError } from "./middlewares/errorHandler/ApiError";
import { errorConverter} from "./middlewares/errorHandler/error-converter";
import { errorHandler } from "./middlewares/errorHandler/error-handler";
import { log } from "./config/logger";
import router from "./routes/Router";
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'dupzhhmj1', 
  api_key: '542264373916361', 
  api_secret: 'qzZdV3UmunC8d8mOG9USVE9HIgI' 
});

const app = express();

app.disable("x-powered-by"); // For security
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

app.use('/api', router);


// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    log.info(`Path not Exist: ${req.path}`);
    console.log(`Path not Exist: ${req.path}`);
    next(new ApiError(404, "Not found"));
});

app.use(errorConverter);
app.use(errorHandler);



export default app;
