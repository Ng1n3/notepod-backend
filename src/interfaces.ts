import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export interface Config {
  stage: string;
  env: string | undefined;
  port: string;
}

export interface Mycontext {
  req: Request,
  res: Response,
  prisma:PrismaClient
}