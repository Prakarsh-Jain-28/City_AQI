const app = require("./app")

const port = process.env.PORT || 8000

app.listen(port,(req,res)=>{
    console.log("Server Started")
})