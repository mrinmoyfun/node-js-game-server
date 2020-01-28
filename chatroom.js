const colyseus = require('colyseus');



exports.MyRoom = class extends colyseus.Room {
    // this room supports only 4 clients connected
    maxClients = 2;
    delayedInterval = colyseus.Delayed;
    mClients = colyseus.Clients;
     

    // When room is initialized
    onCreate(options) {
        console.log("BasicRoom created!", options);
        // start the clock ticking
        this.clock.start();

        // Set an interval and store a reference to it
        // so that we may clear it later
        this.delayedInterval = this.clock.setInterval(() => {
            console.log("Time now " + this.clock.currentTime);
            this.broadcast("Time now " + this.clock.currentTime);
        }, 1000);

        // After 10 seconds clear the timeout;
        // this will *stop and destroy* the timeout completely
        this.clock.setTimeout(() => {
            this.delayedInterval.clear();
        }, 10000);
    }

  

    onJoin (client) {
         
    if (this.clients.length === 2) {
        let data = '';
          const https = require('https');
        const options = {
  hostname: 'pg.medgag.com',
  port: 443,
  path: '/quiz/api/random.php?topic_id=7',
  method: 'GET'
}
   const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    data = JSON.parse(d).questions;
      this.broadcast(data);
  })
})

req.on('error', error => {
   this.broadcast(error);
})

req.end()
        
        this.setState({
        countdown: 0
      })
        // change the state to notify clients the game has been started
        this.broadcast("Full Play Start ");
        this.state.countdown = 10;

  this.countdownInterval = this.clock.setInterval(() => {
    this.state.countdown--;
    this.broadcast("Count " + this.state.countdown );
    if (this.state.countdown === 0) {
      this.countdownInterval.clear();
      this.broadcast("Game Started ");
    }
  }, 1000);

        // additionally, you may lock the room to prevent new clients from joining it
        //this.lock()
    }
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
        this.broadcast(data.message, { except: client });
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
