const colyseus = require('colyseus');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;

class Player extends Schema {
}
schema.defineTypes(Player, {
  x: "number",
  y: "number",
  score: "number",
  username: "string",
  avatar: "string"
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





exports.MyRoom = class extends colyseus.Room {
    // this room supports only 2 clients connected
    maxClients = 2;
    delayedInterval = colyseus.Delayed;
    mClients = colyseus.Clients;

    // Authentication
    async onAuth (client, options) {
    const userData = options;
    return userData;
    }

    // When room is initialized
    onCreate(options) {
         this.setState({
        countdown: 0,
        timer: 0,
        start: false,
        robo: false,
        qid: 0,
        q: {},
        players: {},
        correct: 0
      })
        console.log("BasicRoom created!", options);

        // start the clock ticking
        this.clock.start();
        let data = '';
      let ff= '';
        // Ready questions
          const https = require('https');
        const optionspg = {
  hostname: 'pg.medgag.com',
  path: '/quiz/api/random.php?topic_id=7',
  method: 'GET'
}
   const req = https.request(optionspg, res => {
  console.log(`statusCode: ${res.statusCode}`)

        res.on('data', d => {
        data += d;
      })
      res.on('end', () => {
        //console.log(JSON.parse(data).questions[1]);
         ff = JSON.parse(data);
          var decoded_data = data.toString('utf8');
            console.log(decoded_data);
      //this.broadcast(ff);
      })
req.on('error', error => {
   //this.broadcast(error);
})
       })
req.end();


        // change the state to notify clients the game has been started


        // Set an interval and store a reference to it
        // so that we may clear it later
        this.delayedInterval = this.clock.setInterval(() => {
          this.broadcast("Running");
          // ROBO PLAYER
          var roboId = this.clients[0].sessionId + "robo";
          this.state.timer++;
          if(this.state.timer === 15 && this.clients.length === 1){
            this.setPrivate(true);
            this.state.countdown = 10;
            this.state.robo = true;
             this.state.players[roboId] = new Player();
      this.state.players[roboId].score =  0;
      this.state.players[roboId].username =  "Robo";
      this.state.players[roboId].avatar =  "https://base.diagknows.org/wp-content/uploads/2021/03/drshital-removebg-preview-150x150.jpg";
    this.broadcast("Count " + this.state.countdown );
             var car1 = {opponentId: roboId , oppUsername:this.state.players[roboId].username, oppAvatar:this.state.players[roboId].avatar};
        this.broadcast(car1);
          }
          if(this.state.robo){
            this.state.countdown--;
            if (this.state.countdown === 0) {

      //this.countdownInterval.clear();

        var ques = {q: ff.questions[this.state.qid] , qid:this.state.qid, empty: true};
        this.state.correct = Number(ff.questions[this.state.qid].correctans);
     // if ( this.state.players[this.clients[0].sessionId] ) {
       // this.state.players[this.clients[0].sessionId].y = 0;
     // }
     
        //this.state.players[this.clients[1].sessionId].y = 0;
        this.broadcast(ques);
       // this.state.q = ff.questions[this.state.qid];
        this.state.qid++;
        this.state.countdown = 25;
      this.state.start = true;
      this.broadcast("Game Started ");
      if(this.state.qid === 6) {
            this.delayedInterval.clear();
           //Result

             this.broadcast("Game End ");
             //this.disconnect();
        }


          }
        }






          // ROBO PLAYER
          if (this.clients.length === 2) {
             this.state.countdown--;
    this.broadcast("Count " + this.state.countdown );
             var car1 = {opponentId: this.clients[0].sessionId , success:"500"};
        var car2 = {opponentId: this.clients[1].sessionId , success:"500"};
        this.broadcast(car1, { except: this.clients[0] });
        this.broadcast(car2, { except: this.clients[1] });
    if (this.state.countdown > 5) {
      if ( this.state.players[this.clients[0].sessionId] && this.state.players[this.clients[1].sessionId])  {
          if ( this.state.players[this.clients[0].sessionId].y > 0 && this.state.players[this.clients[1].sessionId].y > 0)  {
           this.state.countdown = 5;

      }
      }
    }
     if (this.state.countdown === 1) {
      if(this.state.qid === 5) {
         var result = {result: 'winner'};
       if( this.state.players[this.clients[0].sessionId].score > this.state.players[this.clients[1].sessionId].score ) {
          var winner = {result: 'winner'};
          var looser = {result: 'looser'};
          this.broadcast(winner, { except: this.clients[1] });
          this.broadcast(looser, { except: this.clients[0] });
        } else if (this.state.players[this.clients[1].sessionId].score > this.state.players[this.clients[0].sessionId].score) {
            var winner = {result: 'winner'};
          var looser = {result: 'looser'};
          this.broadcast(winner, { except: this.clients[1] });
          this.broadcast(looser, { except: this.clients[0] });
         } else {
           var draw = {result: 'draw'};
          this.broadcast(draw, { except: this.clients[1] });
          this.broadcast(draw, { except: this.clients[0] });
         }
         this.delayedInterval.clear();
           //Result

             this.broadcast("Game End ");
             this.state.start = false;
             //this.disconnect();
       }
     }

    if (this.state.countdown === 0) {

      //this.countdownInterval.clear();

        var ques = {q: ff.questions[this.state.qid] , qid:this.state.qid, empty: true};
        this.state.correct = Number(ff.questions[this.state.qid].correctans);
      if ( this.state.players[this.clients[0].sessionId] ) {
        this.state.players[this.clients[0].sessionId].y = 0;
      }
      if ( this.state.players[this.clients[1].sessionId] ) {
        this.state.players[this.clients[1].sessionId].y = 0;
      }
        //this.state.players[this.clients[1].sessionId].y = 0;
        this.broadcast(ques);
       // this.state.q = ff.questions[this.state.qid];
        this.state.qid++;
        this.state.countdown = 25;
      this.state.start = true;
      this.broadcast("Game Started ");
      if(this.state.qid === 6) {
            this.delayedInterval.clear();
           //Result

             this.broadcast("Game End ");
             //this.disconnect();
        }

    }
          }
        }, 1000);



        // After 10 seconds clear the timeout;
        // this will *stop and destroy* the timeout completely
        this.clock.setTimeout(() => {
            //this.delayedInterval.clear();
            //this.clock.stop();
        }, 10000);
    }



    onJoin (client, options, auth) {
        //this.state.players[client.sessionId].connected = true;
      this.state.players[client.sessionId] = new Player();
      this.state.players[client.sessionId].score =  0;
      this.state.players[client.sessionId].username =  auth.username;
      this.state.players[client.sessionId].avatar =  auth.avatar;

      if(auth.private === true) {
        this.setPrivate(true);
      }


    if (this.clients.length === 2) {
        var car1 = {opponentId: this.clients[0].sessionId , oppUsername:this.state.players[this.clients[0].sessionId].username, oppAvatar:this.state.players[this.clients[0].sessionId].avatar};
        var car2 = {opponentId: this.clients[1].sessionId , oppUsername:this.state.players[this.clients[1].sessionId].username, oppAvatar:this.state.players[this.clients[1].sessionId].avatar};
        this.broadcast(car1, { except: this.clients[0] });
        this.broadcast(car2, { except: this.clients[1] });
        //var fk = JSON. stringify(this.clients);
        //this.broadcast(fk);
         this.broadcast("Full Play Start ");
        this.state.countdown = 10;
    }


  this.countdownInterval = this.clock.setInterval(() => {

  }, 1000);



        // additionally, you may lock the room to prevent new clients from joining it
        //this.lock()

}



    async onLeave (client, consented) {
  // flag client as inactive for other users
  //this.state.players[client.sessionId].connected = false;

  try {
    if (consented) {
        throw new Error("consented leave");
        this.broadcast(`${ client.sessionId } left.`);
      this.countdownInterval.clear();
      //delete this.state.players[client.sessionId];
    }
    var draw = {result: 'waiting'};
     this.broadcast(draw, { except: client });
    //this.broadcast("Waiting", { except: client});
    this.clock.stop();
    //this.countdownInterval.clear();
    // allow disconnected client to reconnect into this room until 20 seconds
    //await this.allowReconnection(client, 20);
    const reconnectedClient = await this.allowReconnection(client, 20);
    this.send(reconnectedClient, reconnectedClient.sessionId + ' rejoined');
     var draw = {result: 'returned'};
     this.broadcast(draw);
     this.clock.start();
    // client returned! let's re-activate it.
    //this.state.players[client.sessionId].connected = true;

  } catch (e) {

    // 20 seconds expired. let's remove the client.
    this.clock.start();
    this.countdownInterval.clear();
     var draw = {result: 'disconnected'};
     this.broadcast(draw, { except: client });
     this.disconnect();

    //this.broadcast("Disconnected", { except: client});
    //delete this.state.players[client.sessionId];
  }
}


    onMessage (client, data) {
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.state.players[client.sessionId].y =  data.option;
        if (data.option && this.state.qid > 0 ) {
          if ( data.option === this.state.correct ) {
            this.state.players[client.sessionId].score =  this.state.players[client.sessionId].score + 20;
            this.broadcast("RIGHT", { except: client });
          } else {
            this.state.players[client.sessionId].score =  this.state.players[client.sessionId].score - 10;
            this.broadcast("WRONG", { except: client });
          }
        }

        //this.broadcast(data.message, { except: client });
    }

    onDispose () {
        var draw = {result: 'disposed'};
     this.broadcast(draw, { except: client });
        console.log("Dispose BasicRoom");
    }

}
