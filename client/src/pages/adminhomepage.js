import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import YouTube from "react-youtube";
import './adminhomepage.css';

 const socket = io("http://localhost:3001"); // Point to your backend
 export default function Adminhomepage(){
 const[nowPlaying , setNowplaying] = useState(null);
 const [songs , setSongs] = useState([]);

 useEffect( ()=> {
  
   socket.on("song-list-updated", (data) => {
      setSongs(data);
    });
   socket.emit("top-song");
   socket.on("play-next-song" ,  ()=>{
       socket.emit("top-song")
      

   });
      
   
   socket.on("topmost-song" ,(topsong)=> {
     
      setNowplaying(topsong);
      
   })
   socket.on("now-playing" , (song)=>{
    
      setNowplaying(song);
      socket.emit("currentsong" , song )
      
   })

   socket.on("deleted-all" , ()=>{
      setNowplaying(null);
      
   })
   
}

    ,[]);
    
   return (
    <>
     
 
      <div className="admin-container">
  {nowPlaying && (
    <div className="now-playing">
      <strong>Now Playing:</strong> {nowPlaying.title} - {nowPlaying.artist}
      <div className="youtube-player">
        <YouTube
          key={nowPlaying.youtubeId}
          videoId={nowPlaying.youtubeId}
          opts={{ width: "100%", height: "315", playerVars: { autoplay: 1 } }}
          onEnd={() => {
            socket.emit("next-song");
          }}
        />
      </div>
      <button onClick={() => socket.emit("delete-all")}>
        DELETE ALL SONGS
      </button>

      <section className="song-list">
        <h2>Upcoming Songs</h2>
        <ul>
          {songs.map((song) => (
            <li key={song._id} className="song-card">
              <span>
                {song.title} : {song.votes} votes
              </span>
              <button
                className="vote-btn"
                onClick={() => socket.emit("delete-song", song._id)}
              >
                DELETE
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )}
</div>
 </>

   );
}