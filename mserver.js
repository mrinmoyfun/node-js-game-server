const colyseus = require("colyseus");
const http = require("http");
const express = require("express");
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());

const gameServer = new colyseus.Server({
  server: http.createServer(app)
});

gameServer.listen(port);
