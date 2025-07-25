import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()


// app.use is used when middleware is present 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// routes import 
import userRouter from './routes/user.routes.js'


// routes decleration 
// since things are seperated we use app.use to use middleware

app.use("/api/users", userRouter)

export { app }