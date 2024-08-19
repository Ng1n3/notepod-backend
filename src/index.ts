import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';

import config from './config';
import { getMyPrismaClient } from './db';
import { getSchema } from './graphql/Schema';
import { Mycontext } from './interfaces';

dotenv.config();
const app: Application = express();
const PORT: string = process.env.PORT!;

const main = async () => {
  const schema = getSchema();
  const prisma = await getMyPrismaClient();

  const server = new ApolloServer<Mycontext>({
    schema,
  });

  await server.start();
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({
        req,
        res,
      }: {
        req: Request;
        res: Response;
      }): Promise<Mycontext> => ({ req, res, prisma }),
    })
  );

  app.listen(PORT, () => {
    console.log(
      `Server is listening on http://localhost:${config.port}/graphql`
    );
  });
};

main().catch((err) => {
  console.error(err)
})
