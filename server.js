"use strict";

require("dotenv").config();

const compression = require("compression");
const path = require("path");

// setup express
const express = require("express");
const app = express();

// Compress all HTTP responses GZip
app.use(compression());

// setup http server
const http = require("http");
const server = http.createServer(app);

// setup socket.io server
const { Server } = require("socket.io");
const io = new Server().listen(server);

// const ngrok = require("ngrok");

const cookieParser = require("cookie-parser");
const randomWords = require("random-words");

// setup Google OAuth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "1098686719230-8f15jlef2joiv3shbnpbovro4j2qathv.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

let API_KEY_SECRET = process.env.API_KEY_SECRET || "MS_teams_default_secret";
// set dynamic PORT
let PORT = process.env.PORT || 3000;
let localHost = "http://localhost:" + PORT;

// channels collect
let channels = {};

// sockets collect
let sockets = {};

// perrs collect by channels
let peers = {};

let turnEnabled = process.env.TURN_ENABLED;
let turnUrls = process.env.TURN_URLS;
let turnUsername = process.env.TURN_USERNAME;
let turnCredential = process.env.TURN_PASSWORD;

// using static files from the www folder
app.use(express.static(path.join(__dirname, "www")));

// Parse API request body to json
app.use(express.json());

// ejs config
app.set("view engine", "ejs");
app.use(express.static("public"));

// to handle cookies
app.use(cookieParser());

// error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logme("Request Error", {
      header: req.headers,
      body: req.body,
      error: err.message,
    });
    return res.status(400).send({ status: 404, message: err.message }); // Bad request
  }
  // Remove trailing slashes in url handle bad requests
  if (req.path.substr(-1) === "/" && req.path.length > 1) {
    let query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

// authentication middleware
function checkAuthenticated(req, res, next) {
  let token = req.cookies["session-token"];

  let user = {};
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "1098686719230-8f15jlef2joiv3shbnpbovro4j2qathv.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    user.name = payload.name;
    user.email = payload.email;
    user.picture = payload.picture;
  }
  verify()
    .then(() => {
      req.user = user;
      next();
    })
    .catch((err) => {
      res.redirect("/");
    });
}

// dashboard route for user to create or join meet
app.get(["/dashboard"], checkAuthenticated, (req, res) => {
  let user = req.user;
  res.render("dashboard", { user });
});
app.get("/chat", checkAuthenticated, (req, res) => {
  let user = req.user;
  res.render("chat", { user });
});
// if audio video permission not given
app.get(["/permission"], (req, res) => {
  res.render("permission");
});

// If no room name specified
app.get("/join/", (req, res) => {
  res.redirect("/dashboard");
});

// room join
app.get("/join/*", checkAuthenticated, (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.redirect(url.parse(req.url).pathname);
  } else {
    let user = req.user;
    res.render("meet", { user });
  }
});

// create a random meet word to use as link
app.get("/makemeetword", (req, res) => {
  let meetWord = randomWords({ exactly: 1, wordsPerString: 2, separator: "-" });
  meetWord = meetWord + "-" + Math.floor(Math.random() * 10000).toString();
  res.send(meetWord);
});

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let token = req.body.token;

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "1098686719230-8f15jlef2joiv3shbnpbovro4j2qathv.apps.googleusercontent.com", //  CLIENT_ID of app
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];
  }
  verify()
    .then(() => {
      res.cookie("session-token", token);
      res.send("success");
    })
    .catch(console.error);
});

//if authenticated then to profile page
app.get("/profile", checkAuthenticated, (req, res) => {
  let user = req.user;
  res.render("profile", { user });
});

//logout
app.get("/logout", (req, res) => {
  res.clearCookie("session-token");
  res.redirect("/");
});

// start server
server.listen(PORT, null, () => {
  logme(`Server started on port ${PORT}`);
});

let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

if (turnEnabled == "true") {
  iceServers.push({
    urls: turnUrls,
    username: turnUsername,
    credential: turnCredential,
  });
}

io.sockets.on("connect", (socket) => {
  logme("[" + socket.id + "] --> connection accepted");

  socket.channels = {};
  sockets[socket.id] = socket;

  //  On peer diconnected

  socket.on("disconnect", () => {
    for (let channel in socket.channels) {
      removePeerFrom(channel);
    }
    logme("[" + socket.id + "] <--> disconnected");
    delete sockets[socket.id];
  });

  // On peer join

  socket.on("join", (config) => {
    logme("[" + socket.id + "] --> join ", config);

    let channel = config.channel;
    let peer_name = config.peerName;
    let peer_img = config.peerImg;
    let peer_video = config.peerVideo;
    let peer_audio = config.peerAudio;
    let peer_hand = config.peerHand;

    if (channel in socket.channels) {
      logme("[" + socket.id + "] [Warning] already joined", channel);
      return;
    }
    // no channel aka room in channels init
    if (!(channel in channels)) {
      channels[channel] = {};
    }

    // no channel aka room in peers init
    if (!(channel in peers)) {
      peers[channel] = {};
    }

    // collect peers info grp by channels
    peers[channel][socket.id] = {
      peer_name: peer_name,
      peer_img: peer_img,
      peer_video: peer_video,
      peer_audio: peer_audio,
      peer_hand: peer_hand,
    };
    logme("connected peers grp by roomId", peers);

    for (let id in channels[channel]) {
      // offer false
      channels[channel][id].emit("addPeer", {
        peer_id: socket.id,
        peers: peers[channel],
        should_create_offer: false,
        iceServers: iceServers,
      });
      // offer true
      socket.emit("addPeer", {
        peer_id: id,
        peers: peers[channel],
        // peer_name: peers[channel][id].peer_name,
        should_create_offer: true,
        iceServers: iceServers,
      });
      logme("[" + socket.id + "] emit add Peer [" + id + "]");
    }

    channels[channel][socket.id] = socket;
    socket.channels[channel] = channel;
  });

  /**
   * Remove peers from channel aka room
   * @param {*} channel
   */
  async function removePeerFrom(channel) {
    if (!(channel in socket.channels)) {
      logme("[" + socket.id + "] [Warning] not in ", channel);
      return;
    }

    delete socket.channels[channel];
    delete channels[channel][socket.id];
    delete peers[channel][socket.id];

    // if not channel aka room in peers remove it
    if (Object.keys(peers[channel]).length === 0) {
      delete peers[channel];
    }

    for (let id in channels[channel]) {
      await channels[channel][id].emit("removePeer", { peer_id: socket.id });
      await socket.emit("removePeer", { peer_id: id });
      logme("[" + socket.id + "] emit remove Peer [" + id + "]");
    }
  }

  /**
   * Relay ICE to peers
   */
  socket.on("relayICE", (config) => {
    let peer_id = config.peer_id;
    let ice_candidate = config.ice_candidate;

    if (peer_id in sockets) {
      sockets[peer_id].emit("iceCandidate", {
        peer_id: socket.id,
        ice_candidate: ice_candidate,
      });
    }
  });

  /**
   * Relay SDP to peers
   */
  socket.on("relaySDP", (config) => {
    let peer_id = config.peer_id;
    let session_description = config.session_description;

    logme(
      "[" + socket.id + "] relay SessionDescription to [" + peer_id + "] ",
      { type: session_description.type }
    ); // session_description

    if (peer_id in sockets) {
      sockets[peer_id].emit("sessionDescription", {
        peer_id: socket.id,
        session_description: session_description,
      });
    }
  });

  /**
   * Relay MSG to peers
   */
  socket.on("msg", (config) => {
    let peerConnections = config.peerConnections;
    let room_id = config.room_id;
    let id = config.peer_id;
    let name = config.name;
    let msg = config.msg;

    for (let peer_id in peerConnections) {
      if (sockets[peer_id]) {
        sockets[peer_id].emit("onMessage", {
          peer_id: socket.id,
          name: name,
          msg: msg,
        });
      }
    }
  });

  /**
   * Relay Audio Video Hand ... Status to peers
   */
  socket.on("peerStatus", (config) => {
    let peerConnections = config.peerConnections;
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let element = config.element;
    let status = config.status;

    // update peers video-audio status in the specified room
    for (let peer_id in peers[room_id]) {
      if (peers[room_id][peer_id]["peer_name"] == peer_name) {
        switch (element) {
          case "video":
            peers[room_id][peer_id]["peer_video"] = status;
            break;
          case "audio":
            peers[room_id][peer_id]["peer_audio"] = status;
            break;
          case "hand":
            peers[room_id][peer_id]["peer_hand"] = status;
            break;
        }
      }
    }

    // socket.id aka peer that send this status
    if (Object.keys(peerConnections).length != 0) {
      logme(
        "[" + socket.id + "] emit onpeerStatus to [room_id: " + room_id + "]",
        {
          peer_id: socket.id,
          element: element,
          status: status,
        }
      );
      for (let peer_id in peerConnections) {
        if (sockets[peer_id]) {
          sockets[peer_id].emit("onpeerStatus", {
            peer_id: socket.id,
            element: element,
            status: status,
          });
        }
      }
    }
  });

  /**
   * Relay mute everyone in the room
   */
  socket.on("muteEveryone", (config) => {
    let peerConnections = config.peerConnections;
    let room_id = config.room_id;
    let peer_name = config.peer_name;

    // socket.id aka peer that send this status
    if (Object.keys(peerConnections).length != 0) {
      logme(
        "[" + socket.id + "] emit onmuteEveryone to [room_id: " + room_id + "]",
        {
          peer_id: socket.id,
          peer_name: peer_name,
        }
      );
      for (let peer_id in peerConnections) {
        if (sockets[peer_id]) {
          sockets[peer_id].emit("onmuteEveryone", {
            peer_name: peer_name,
          });
        }
      }
    }
  });

  /**
   * Relay hide everyone in the room
   */
  socket.on("hideEveryone", (config) => {
    let peerConnections = config.peerConnections;
    let room_id = config.room_id;
    let peer_name = config.peer_name;

    // socket.id aka peer that send this status
    if (Object.keys(peerConnections).length != 0) {
      logme(
        "[" + socket.id + "] emit onhideEveryone to [room_id: " + room_id + "]",
        {
          peer_name: peer_name,
        }
      );
      for (let peer_id in peerConnections) {
        if (sockets[peer_id]) {
          sockets[peer_id].emit("onhideEveryone", {
            peer_name: peer_name,
          });
        }
      }
    }
  });

  /**
   * Relay Kick out peer from room
   */
  socket.on("kickOut", (config) => {
    let room_id = config.room_id;
    let peer_id = config.peer_id;
    let peer_name = config.peer_name;

    logme(
      "[" +
        socket.id +
        "] kick out peer [" +
        peer_id +
        "] from room_id [" +
        room_id +
        "]"
    );

    if (peer_id in sockets) {
      sockets[peer_id].emit("onKickOut", {
        peer_name: peer_name,
      });
    }
  });

  /**
   * Relay File info
   */
  socket.on("fileInfo", (config) => {
    let peerConnections = config.peerConnections;
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let file = config.file;

    logme(
      "[" +
        socket.id +
        "] Peer [" +
        peer_name +
        "] send file to room_id [" +
        room_id +
        "]",
      {
        fileName: file.fileName,
        fileSize: convertBytesToSizes(file.fileSize),
        fileType: file.fileType,
      }
    );

    function convertBytesToSizes(bytes) {
      let sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      if (bytes == 0) return "0 Byte";
      let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
    }

    if (Object.keys(peerConnections).length != 0) {
      for (let peer_id in peerConnections) {
        if (sockets[peer_id]) {
          sockets[peer_id].emit("onFileInfo", file);
        }
      }
    }
  });

  /**
   * Whiteboard actions for all user in the same room
   */
  socket.on("wb", (config) => {
    let peerConnections = config.peerConnections;
    delete config.peerConnections;
    if (Object.keys(peerConnections).length != 0) {
      // logme("[" + socket.id + "] whiteboard config", config);
      for (let peer_id in peerConnections) {
        if (sockets[peer_id]) {
          sockets[peer_id].emit("wb", config);
        }
      }
    }
  });
}); // end [sockets.on-connect]

/**
 * log with UTC data time
 * @param {*} msg message any
 * @param {*} op optional params
 */
function logme(msg, op = "") {
  let dataTime = new Date().toISOString().replace(/T/, " ").replace(/Z/, "");
  console.log("[" + dataTime + "] " + msg, op);
}
