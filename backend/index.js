const app = require("./app")
const http = require("http")
const {initSocket} = require("./sockets/socket");

const server = http.createServer(app);

initSocket(server);

const port = process.env.PORT || 8000

server.listen(port,(req,res)=>{
    console.log("Server Started")
})
