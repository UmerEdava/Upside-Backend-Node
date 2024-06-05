import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import config from "./src/config/config";
import { Database } from "./src/config/db";
import { log } from "./src/config/logger";
import { server, app } from "./src/socket/socket";

import express from "express";
import cors from "cors";

import { ApiError } from "./src/middlewares/errorHandler/ApiError";
import { errorConverter } from "./src/middlewares/errorHandler/error-converter";
import { errorHandler } from "./src/middlewares/errorHandler/error-handler";
import router from "./src/routes/Router";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dupzhhmj1",
  api_key: "542264373916361",
  api_secret: "qzZdV3UmunC8d8mOG9USVE9HIgI",
});

const DB = new Database();

// Checking the env variables (if you have local mongodb setup, then comment MONGO_URI validation)
if (!process.env.JWT_KEY) {
  throw new Error("JWT_KEY must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI must be defined");
}

const exitHandler = (error: any) => {
  log.info(error);
  console.log("error");
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
    "csv-viewer: Connection to database closed due to nodejs process termination"
  );
  // eslint-disable-next-line no-process-exit
  process.exit(0);
});

const startServer = async () => {
  try {
    await DB.connect();

    app.disable("x-powered-by"); // For security
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: "5mb" }));
    app.use(express.urlencoded({ extended: true, limit: "5mb" }));
    app.use(cookieParser());

    app.use("/api", router);

    // send back a 404 error for any unknown api request
    app.use((req, res, next) => {
      log.info(`Path not Exist: ${req.path}`);
      console.log(`Path not Exist: ${req.path}`);
      next(new ApiError(404, "Not found"));
    });

    app.use(errorConverter);
    app.use(errorHandler);
  } catch (error) {
    console.log(">>error", error);
    log.error(">>error", error);
    process.exit(1);
  }

  server.listen(config.PORT, () => {
    log.info(`Upside server is started on port: ${config.PORT}`);
    console.log(`Upside server is started on port: ${config.PORT}`);
  });
};

startServer();
