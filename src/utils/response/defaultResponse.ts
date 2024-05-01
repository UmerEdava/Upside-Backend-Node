import { Response } from "express";
import validationMessages from "../validationMessages/validationMessages";

type defaultRes = {
  res: Response;
  status: boolean;
  statusCode?: number;
  message?: string;
  statusMessage?: string;
  dataObject?: object | any;
};

function defaultResponse({
  res,
  status,
  statusCode = 200,
  message = "",
  dataObject = {},
}: defaultRes) {
  return res.status(statusCode).json({
    status,
    message: message,
    data: dataObject,
  });
}

export = defaultResponse;
