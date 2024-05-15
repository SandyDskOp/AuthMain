//an5EAwbq0WeUnqlK
const mongoose = require("mongoose")
const express = require("express")
const app = express()
require('dotenv').config()

//routers
const UserRouter = require("./router/userRouter")

app.use(express.json())
app.use("/user",UserRouter)

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    app.listen(process.env.PORT)
    console.log("DB Connected")
})
.catch((err)=>{
    console.log(err)
}) 