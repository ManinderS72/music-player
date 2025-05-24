import React, { useState } from "react";
import "./usershomepage.css";
import { useEffect } from "react";
 // socket 

 import { io } from "socket.io-client";
 const socket = io("http://localhost:3001"); // Point to your backend


export default function UsersHomepage() {
   
    const [Currentplaying , setCurrentplaying] = useState("");
    const [songs , setSongs] = useState([]);
    console.log("songs");

    useEffect(() => {
        
        socket.on("song-list-updated", (data) => {
          setSongs(data);
        });
      
         // server sending the updated topsong 
        socket.on("topmost-song" ,(topsong)=>{
     
          setCurrentplaying(topsong);
          
       });


        socket.on("vote-rejected" , (msg)=>{
            alert(msg);
        });
        socket.on("song-already-present" , (msg) =>{
            alert(msg);
        })
    
        return () => {
          socket.off("song-list-updated");
          socket.off("now-playing");
        };

      }, []);
    

    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState(""); // New
 
    const extractYoutubeId = (url) => {
        const match = url.match(
          /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        return match ? match[1] : null;
      };

  return (
    <div className="page">
      <header className="header">
        <h1> Vote and Play Music of your Choice</h1>
       
      </header>

      <main className="main-content">
        <section className="now-playing">
          <h2>Now Playing</h2>
          <div className="song-card now">
            <p  className="song-title">{Currentplaying?.title
    ? `${Currentplaying.title} - ${Currentplaying.artist}`
    : "No song is currently playing"}</p>
          </div>
        </section>

      {/* SONG LIST SECTION  */}

        <section className="song-list">
          <h2>Upcoming Songs</h2>
          <ul>
              
    {/* // -- songs is the array of songs present in our list/db currently , now we are gonna iterate usign map and gonna list them on frontend */}

                 {songs.map( (song) => (
                    <li key = {song._id} className="song-card">
                        <span> {song.title }  : {song.votes} votes</span>
                        <button className="vote-btn" onClick={()=>{
                            socket.emit("vote" , song._id);   // calling backend to increase vote by 1 
                        }} > Vote </button>

                    </li>
                 ))}
        
          </ul>
          </section>
          
                
            {/* ADDING NEW SONG IN A LIST  */}

 
      

        <section className="add-song">
          <h2>Add a New Song</h2>
          <div className="add-form">
          <form onSubmit={()=>{
            // form is submitted , first check if input credentials are right 
            if (!title || !artist || !youtubeUrl) return;

             const youtubeId = extractYoutubeId(youtubeUrl);
             if (!youtubeId) {
             alert("Please enter a valid YouTube URL");
              return;
    }
     

    // adding song in db , 
    // asking backend to add song in db 
    socket.emit("add-song" , {title , artist , youtubeId});
    
    // Clear form
    setTitle("");
    setArtist("");
    setYoutubeUrl("");
          }}>

          <input
        type="text"
        placeholder="Song title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="YouTube URL"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        required
      />
      <button type="submit" className="vote-btn" >➕ Add Song</button>
          </form>
          </div>
        </section>

        </main>
          </div>
 );
      

        }

