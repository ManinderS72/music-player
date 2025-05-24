const express = require("express")
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
require('dotenv').config();
app.use(cors());
app.use(express.json());

const voters = new Map(); // contains list of all users that have voted particular song // song_id vs set of IP'S of all users (voters)

// bringing in mongoose and connecting with mongodb and defining schema 
const mongoose = require("mongoose");
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

// creating schema 
const SongSchema  = new mongoose.Schema({
    title : String , 
    artist : String , 
    youtubeId : String , 
    votes : {type : Number , default : 0} , 
    isPlaying : {type : Boolean  , default : false}
});

const Song = new mongoose.model("Song" , SongSchema);


// adding socket io 

const { Server } = require("socket.io"); // Server is the class that we kinda import

const io = new Server(server, { 
  cors: {
    origin: "*",
  },
});


// now creatign all the socket io listener logics 

 io.on("connection" , (socket)=>{
    // new client is connected

    console.log("new user connected");
    
       // send all songs to client that are currently in list 
    const sendSongs = async () => {
        const songs = await Song.find().sort({ votes: -1 });
        io.emit("song-list-updated", songs);
      };
      // Send list on connect
      sendSongs();


    // when user  clicked vote button , 

    socket.on("vote" , async(id) => {


         // check if this user alredy have voted this song or not , 

         // if song is not present in voter list (it means no one have voted yet) , so we are including this song in map 
        if(!voters.has(id)){
            voters.set(id , new Set());
        }

           // gettting voterlist from map who have voted for this song (with id : id ) 

          const voterslist = voters.get(id);

        // now check in this voterlist if this user is incldued or not 
        const ip = socket.handshake.address;
        if(voterslist.has(ip)){
            socket.emit("vote-rejected" , "You have already have voted for this song");
            return;
        }

        await Song.findByIdAndUpdate(id , {$inc : {votes : 1}});

        // updating map 
        voterslist.add(ip); 
        voters.set(id, voterslist);

        // also now as i vote has been casted , there should be somethign to evaluate which song have the highest votes , and it should get played 
        
        let topSong = await Song.findOne().sort({ votes: -1 });
        if (topSong && !topSong.isPlaying) {
          const current = await Song.findOne({ isPlaying: true });
           if(current){
            current.isPlaying = false;
            current.votes = 0;
           }
         
          topSong.isPlaying = true;
          await topSong.save();
          // now inform admin and users that top song have been updated 
          io.emit("topmost-song" , topSong);
        }
       
       
         
        // now update the song list , and show it to all clients
        sendSongs();

    });






    
    // when user added a new song , pasted youtube url and entered title and artist name 

    socket.on("add-song" , async({title , artist , youtubeId}) => {

          // first check if this youtubeId is already present in our db/list or not 
          const existing = await Song.findOne({youtubeId});
          if(existing){
            socket.emit("song-already-present" , "song is already there in list , you cannot add again");
            return;
          }
        // add this song in db 
        await Song.create({title , artist , youtubeId});
        // now  send the updated list to all connected clients
        sendSongs();
     });




     // when admin ask to play next song 

     socket.on("next-song", async () => {
       
        const current = await Song.findOne({ isPlaying: true });
      
         // make the votes of current song = 0 and then call the top most song and then play it
          current.votes = 0;
          current.isPlaying = false;
          await current.save();
          voters.delete(current._id.toString());
          console.log(current);
          
          console.log(current.votes);
          io.emit("play-next-song");
          
     

        sendSongs();
      });


      // get topmost song 
      socket.on("top-song", async () => {

        let topSong = await Song.findOne().sort({ votes: -1 });
        if (topSong && !topSong.isPlaying) {
          topSong.isPlaying = true;
          await topSong.save();
        }
        topSong.isPlaying = true;
        io.emit("topmost-song", topSong);
      });
      

    // delte all songs 
    socket.on("delete-all" , async ()=>{
        await Song.deleteMany({});
        io.emit("topmost-song" , null);
       sendSongs();
    })

    // delete particular song 
    socket.on("delete-song" , async(id) =>{
      await Song.findByIdAndDelete(id);
      voters.delete(id);
       sendSongs();
    })
})




// admin login logic 

const jwt = require("jsonwebtoken");

const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};


app.post("/admin/login", (req, res) => {
    console.log("request received !");
  const { username, password } = req.body;
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});


server.listen(3001 , ()=>{
    console.log("server is running ! ");
})




