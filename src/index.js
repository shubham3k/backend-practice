import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js"

console.log(" hii there")

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, () => {
        console.log(`server is running on port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("Mongo db connection failed", error);
})

