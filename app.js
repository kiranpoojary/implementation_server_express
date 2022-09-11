const express = require("express");
const app = express();
const http = require("http");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const auth = require("./routes/authroute");
dotenv.config();

const posts = [
  {
    username: "nityahutech",
    title: "Post-1",
  },
  {
    username: "ektahutech",
    title: "Post-1",
  },
  {
    username: "kiranhutech",
    title: "Post-1",
  },
];

app.use(cors());
app.use(bodyParser.json());

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) res.send(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.send(403);
    console.log(user);
    req.user = user;
    next();
  });
}

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.get("/posts", verifyToken, (req, res) => {
  res.json(posts.filter((post) => post.username === req.user.username));
});

app.use("/auth", auth);

app.post("/upload", async (req, res) => {
  if (req.body.file) {
    res.status(200).json({ result: "file found" });
  } else res.status(200).json({ result: "file not found" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT"] },
});

let allOnlineUsers = [];

io.on("connection", (socket) => {
  //on disconnect
  socket.on("disconnect", function () {
    let userdiscn = allOnlineUsers?.filter((u) => u.socketid == socket.id);
    allOnlineUsers = allOnlineUsers?.filter((u) => u.socketid != socket.id);
    socket.broadcast.emit("resetonlineusers", allOnlineUsers, userdiscn);
  });

  socket.on("useroffline", function (userid) {
    let userdiscn = allOnlineUsers?.filter((u) => u.userid == userid);
    allOnlineUsers = allOnlineUsers?.filter((u) => u.userid != userid);
    socket.broadcast.emit("resetonlineusers", allOnlineUsers, userdiscn);
  });

  let usersocketid = socket.id;
  socket.emit("yourID", { usersocketid, allOnlineUsers });

  socket.on("joinsuccess", (onlineusers) => {
    allOnlineUsers = onlineusers;
    socket.broadcast.emit("resetonlineusers", onlineusers);
  });

  //join all rooms
  socket.on("joinrooms", (rooms) => {
    socket.join(rooms);
  });

  //received public message
  socket.on("sendpublicmsg", (msginfo) => {
    io.emit("newpublicmsg", msginfo);
  });

  //received private message
  socket.on("sendpvtmsg", (msginfo) => {
    if (msginfo.tosocket) {
      socket.broadcast
        .to(msginfo.tosocket)
        .emit("newprivatemsg", msginfo.message);
    }
  });

  //received room message
  socket.on("sendroommsg", ({ message, roomid }) => {
    if (message && roomid) {
      io.in(roomid).emit("newroommsg", { message, roomid });
    }
  });
});

server.listen(process.env.SERVER_PORT || 3001, (err) => {
  if (!err) {
    console.log(`server started at ${process.env.SERVER_PORT || 3001}`);
  } else {
    console.log("failed to start server");
  }
});

//sending to sender-client only
// socket.emit('message', "this is a test");

//sending to all clients except sender
// socket.broadcast.emit('message', "this is a test");

//sending to all clients in 'game' room(channel) except sender
// socket.broadcast.to('game').emit('message', 'nice game');

//sending to sender client, only if they are in 'game' room(channel)
// socket.to('game').emit('message', 'enjoy the game');

//sending to individual socketid
// socket.broadcast.to(socketid).emit('message', 'for your eyes only');

//sending to all clients, include sender
// io.emit('message', "this is a test");

//sending to all clients in 'game' room(channel), include sender
// io.in('game').emit('message', 'cool game');

//sending to all clients in namespace 'myNamespace', include sender
// io.of('myNamespace').emit('message', 'gg');

//send to all connected clients
// socket.emit();

//send to all connected clients except the one that sent the message
// socket.broadcast.emit();

//event listener, can be called on client to execute on server
// socket.on();

//for emiting to specific clients
// io.sockets.socket();

//send to all connected clients (same as socket.emit)
// io.sockets.emit();

//initial connection from a client.
// io.sockets.on() ;
