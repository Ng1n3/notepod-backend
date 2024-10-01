import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import Redis from 'ioredis'

export interface Config {
  stage: string;
  env: string | undefined;
  port: string;
}

export interface MySession extends Session, SessionData{
  userId?: string
}

export interface Mycontext {
  req: Request,
  res: Response,
  prisma:PrismaClient;
  session: MySession
  redis: Redis
}

export interface Icursor {
  cursor?: number;
  isDeleted?:boolean;
}