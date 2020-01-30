const colyseus = require('colyseus');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;

class Player extends Schema {
}
schema.defineTypes(Player, {
  x: "number",
  y: "number"
});

class MyState extends Schema {
    constructor () {
        super();

        this.players = new MapSchema();
    }
  
}
schema.defineTypes(MyState, {
  players: { map: Player }
});

function createPlayer (id) {
        this.players[ id ] = new Player();
    }



exports.MyRoom = class extends colyseus.Room {
    // this room supports only 4 clients connected
    maxClients = 2;
    delayedInterval = colyseus.Delayed;
    mClients = colyseus.Clients;
     

    // When room is initialized
    onCreate(options) {
         this.setState({
        countdown: 0,
        start: false,
        qid: 0,
        q: {},
        players: {}     
      })
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
        //this.state.players[client.sessionId].connected = true;
      this.state.createPlayer(client.sessionId);
        
    if (this.clients.length === 2) {
        var car1 = {opponentId: JSON.stringify(this.clients[0].sessionId) , success:"500"};
        var car2 = {opponentId: JSON.stringify(this.clients[1].sessionId) , success:"500"};
        this.broadcast(car1, { except: this.clients[0] });
        this.broadcast(car2, { except: this.clients[1] });
        //var fk = JSON. stringify(this.clients);
        //this.broadcast(fk);
        let data = '';
        let ff= '';
          const https = require('https');
        const options = {
  hostname: 'pg.medgag.com',
  path: '/quiz/api/random.php?topic_id=7',
  method: 'GET'
}
   const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)
 
        res.on('data', d => {
        data += d;
      })
      res.on('end', () => {
        //console.log(JSON.parse(data).questions[1]);
         ff = JSON.parse(data);
          var decoded_data = data.toString('utf8');
            console.log(decoded_data);
      this.broadcast(ff);
      })
req.on('error', error => {
   this.broadcast(error);
})
       })
req.end()
        
       
        // change the state to notify clients the game has been started
        this.broadcast("Full Play Start ");
        this.state.countdown = 10;

  this.countdownInterval = this.clock.setInterval(() => {
    this.state.countdown--;
    this.broadcast("Count " + this.state.countdown );
    if (this.state.countdown === 0) {
      //this.countdownInterval.clear();
         if(this.state.qid === 6) {
            this.countdownInterval.clear();
             this.broadcast("Game End ");
             this.disconnect();
        }
        var ques = {q: ff.questions[this.state.qid] , qid:this.state.qid, empty: true};
        this.broadcast(ques);
       // this.state.q = ff.questions[this.state.qid];
        this.state.qid++;
        this.state.countdown = 25;
      this.state.start = true;
      this.broadcast("Game Started ");
    }
  }, 1000);
        
        

        // additionally, you may lock the room to prevent new clients from joining it
        //this.lock()
    }
}



    async onLeave (client, consented) {
  // flag client as inactive for other users
  //this.state.players[client.sessionId].connected = false;

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
