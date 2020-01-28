const colyseus = require('colyseus');


exports.MyRoom = class extends colyseus.Room {
    // this room supports only 4 clients connected
    maxClients = 2;

    onCreate (options) {
        console.log("BasicRoom created!", options);
    }

    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
    }
    async onLeave (client, consented) {
  // flag client as inactive for other users
 // this.state.players[client.sessionId].connected = false;

  try {
    if (consented) {
        throw new Error("consented leave");
        this.broadcast(`${ client.sessionId } left.`);
    }

    // allow disconnected client to reconnect into this room until 20 seconds
    await this.allowReconnection(client, 50);

    // client returned! let's re-activate it.
    //this.state.players[client.sessionId].connected = true;

  } catch (e) {

    // 20 seconds expired. let's remove the client.
    //delete this.state.players[client.sessionId];
  }
}


    onMessage (client, data) {
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(data.message );
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
