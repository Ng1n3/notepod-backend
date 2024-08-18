import express, { Application } from 'express'
import dotenv from 'dotenv'

dotenv.config()
const app: Application = express()
app.use(express.json())
const PORT: string = process.env.PORT!

const main = () => {
  app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}/graphql`)
  })
}

main();