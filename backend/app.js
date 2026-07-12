require("dotenv").config();
const express = require("express")

const app = express()

app.get("/",(req,res)=>{
    return res.end("Hello from Server")
})

module.exports = app