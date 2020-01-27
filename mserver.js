const colyseus = require("colyseus");
const http = require("http");
const express = require("express");
const port = process.env.PORT || 5000;

import { ChatRoom } from "./chatroom";

const app = express();
app.use(express.json());

const gameServer = new colyseus.Server({
  server: http.createServer(app)
});
// Register ChatRoom as "chat"
gameServer.define("chat", ChatRoom);

gameServer.onShutdown(function(){
  console.log(`game server is going down.`);
});

gameServer.listen(port);
