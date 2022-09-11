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
let refreshTokens = [];

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome to auth routes");
});

app.post("/login", (req, res) => {
  const user = { username: req.body.username };
  const accessToken = generateAccessToken(user);
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  refreshTokens.push(refreshToken);
  res.status(200).json({ accessToken, refreshToken });
});

// generateAccessToken
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "50s" });
}

// generate new access token with refresh token
app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    const accessToken = generateAccessToken({ username: user.username });
    res.json({ accessToken: accessToken });
  });
});

//logout
app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

const server = http.createServer(app);

server.listen(process.env.AUTHSERVER_PORT || 4001, (err) => {
  if (!err) {
    console.log(`server started at ${process.env.AUTHSERVER_PORT || 3001}`);
  } else {
    console.log("failed to start server");
  }
});
