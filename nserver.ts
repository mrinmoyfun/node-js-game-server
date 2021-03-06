
import express from 'express';


import { createServer } from 'http';
import { Server } from 'colyseus';


// Import demo room handlers
import { ChatRoom } from "./chatroomts";

const port = Number(process.env.PORT || 5000);
const app = express();



// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app)
});

// Register ChatRoom as "chat"
gameServer.define("chat", ChatRoom);







gameServer.onShutdown(function(){
  console.log(`game server is going down.`);
});

gameServer.listen(port);

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

console.log(`Listening on http://localhost:${ port }`);
