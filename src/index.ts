import express, { Application } from 'express'
import dotenv from 'dotenv'
import config from './config'

dotenv.config()
const app: Application = express()
app.use(express.json())
const PORT: string = process.env.PORT!

const main = () => {
  app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${config.port}/graphql`)
  })
}

main();