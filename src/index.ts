import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import RedisStore from 'connect-redis';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import { Redis } from 'ioredis';

import config from './config';
import { getMyPrismaClient } from './db';
import { getSchema } from './graphql/Schema';
import { Mycontext } from './interfaces';
// import { isProd } from './util';
import morgan from 'morgan';

dotenv.config();
const app: Application = express();
const RedisClient = new Redis();
const PORT: string = process.env.PORT!;
app.use(express.json());
app.use(morgan('dev'));

app.use(
  session({
    store: new RedisStore({ client: RedisClient }),
    secret: process.env.SESSION_SECRET!,
    name: 'notepod-api',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      // secure: isProd(),
      secure: false,
      sameSite: 'lax',
    },
  })
);

const main = async () => {
  const schema = getSchema();
  const prisma = await getMyPrismaClient();

  const server = new ApolloServer<Mycontext>({
    schema,
  });

  await server.start();
  app.use(
    '/graphql',
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({
        req,
        res,
      }: {
        req: Request;
        res: Response;
      }): Promise<Mycontext> => ({
        req,
        res,
        prisma,
        session: req.session,
        redis: RedisClient,
      }),
    })
  );

  app.listen(PORT, () => {
    console.log(
      `Server is listening on http://localhost:${config.port}/graphql`
    );
  });
};

main().catch((err) => {
  console.error(err);
});
