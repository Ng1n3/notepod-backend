import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import RedisStore from 'connect-redis';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import session from 'express-session';
import { Redis } from 'ioredis';

import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import { getMyPrismaClient } from './db';
import { getSchema } from './graphql/Schema';
import { Mycontext } from './interfaces';
import { isProd } from './util';

dotenv.config();

const app: Application = express();
const RedisClient = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
const PORT: string = process.env.PORT!;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15minutes
  max: 100, // limit each ip to 100 requests per windowMs
});

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/graphql', limiter);

let redisStore = new RedisStore({
  client: RedisClient,
  prefix: 'notepod:session',
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET!,
    name: 'notepod-api',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      secure: isProd(),
      sameSite: 'lax',
    },
  }) as any
);

const main = async () => {
  const schema = getSchema();
  const prisma = await getMyPrismaClient();

  const server = new ApolloServer<Mycontext>({
    schema,
  });

  await server.start();
  app.get('/healthcheck', async (_, res) => {
    try {
      const prisma = await getMyPrismaClient();
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: 'Health',
        uptime: process.uptime(),
        message: 'OK',
        timeStamp: new Date(),
      });
    } catch (error) {}
  });
  app.use(
    '/graphql',
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<Mycontext> => ({
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

RedisClient.on('error', (error) => {
  console.error('Redis connection error:', error);
});

RedisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
});

main().catch((err) => {
  console.error(err);
});
