"use strict"; // https://www.w3schools.com/js/js_strict.asp


const peerLoockupUrl = "https://extreme-ip-lookup.com/json/";
const avatarApiUrl = "https://eu.ui-avatars.com/api";

const fileSharingInput = "*"; // allow all file extensions
// "image/*,.mp3,.doc,.docs,.txt,.pdf,.xls,.xlsx,.csv,.pcap,.xml,.json,.md,.html,.js,.css,.php,.py,.sh,.zip,.rar,.tar"; // "*"
const isWebRTCSupported = DetectRTC.isWebRTCSupported;
const isMobileDevice = DetectRTC.isMobileDevice;

let leftChatUserImg; 
let rightChatUserImg; 
let startTime; 
let elapsedTime; 
let recordTimeStart; 
let recordTimeElapsed; 
let swalBg = "white"; 
let serverSignalingPort = 3000; 
let serverSignaling = getServerUrl(); 
let roomId = getRoomId(); 
let peerInfo = getPeerInfo(); 
let peerGeo; 
let peerConnection; 
let myPeerName; 
let myPeerAvatarRecieved; 
let usingAudio = true;
let usingVideo = true; 
let camera = "user"; 
let videoChange = false; 
let handStatus = false; 
let videoStatus = true; 
let audioStatus = true; 
let isScreenSharing = false; 
let isChatVisible = false; 
let isButtonsVisible = false; 
let isSettingVisible = false; 
let isVideoOnFullScreen = false; 
let isDocumentOnFullScreen = false; 
let isWhiteboardFullscreen = false; 
// socket.io connection to our webserver
let signalingSocket;
// my microphone / webcam
let localMediaStream;
// peers microphone / webcam
let remoteMediaStream;
// enable - disable peers video player controls (default false)
let remoteMediaControls = false;
// keep track of our peer connections, indexed by peer_id == socket.io id
let peerConnections = {};
// keep track of our peer chat data channels
let chatDataChannels = {};
// keep track of our peer file sharing data channels
let fileSharingDataChannels = {};
// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
let useRTCDataChannel = true;
// keep track of our peer <video> tags, indexed by peer_id
let peerMediaElements = {};
// collect chat messages to save it later if want
let chatMessages = []; // chatMessagesToSave
// backup iceServers
let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

let totalTime; //
// init audio-video
let initAudioBtn; //initialAudioBtn
let initVideoBtn; // initialVideoBtn
// control buttons
let leftButtons; // controlButtons
let shareRoomBtn; //shareRoomInfoButton
let audioBtn;
let videoBtn;
let swapCameraBtn;
let screenShareBtn; // screenSharingBtn
let recordStreamBtn; // recordBtn
let fullScreenBtn; //fsBtn
let chatRoomBtn; // chatBtn
let myHandBtn; // raiseHandBtn
let whiteboardBtn;
let fileShareBtn; // shareFileBtn
let mySettingsBtn; // settingsBtn
let leaveRoomBtn; // leaveBtn
// chat room elements
let msgerDraggable;
let msgerHeader;
let msgerClean;
let msgerSaveBtn;
let msgerClose;
let msgerChat;
let msgerInput;
let msgerSendBtn;

// my settings
let mySettings; // settings
let mySettingsHeader; // settingsHeader
let mySettingsCloseBtn; // settingsCloseBtn
let audioInputSelect;
let audioOutputSelect;
let videoSelect;
let selectors;
let myVideo;
// name && hand video audio status
let myVideoParagraph;
let handStatusIcon; //
let videoStatusIcon; //
let audioStatusIcon; //
// record Media Stream
let mediaRecorder;
let recordedBlobs;
let isStreamRecording = false;
// whiteboard init
let whiteboardCont;
let whiteboardHeader;
let whiteboardColorPicker;
let whiteboardCloseBtn;
let whiteboardFsBtn;
let whiteboardCleanBtn;
let whiteboardSaveBtn;
let whiteboardEraserBtn;
let isWhiteboardVisible = false;
let canvas;
let ctx;
// whiteboard settings
let isDrawing = 0;
let x = 0;
let y = 0;
let color = "#000000";
let drawsize = 3;
// room actions btns
let muteEveryoneBtn;
let hideEveryoneBtn;
// file transfer settings
let fileToSend; //filesend
let fileReader;
let receiveBuffer = [];
let receivedSize = 0; //sizeRecieved
let incomingFileInfo;
let incomingFileData;
let sendFileDiv;
let sendFileInfo;
let sendProgress;
let sendAbortBtn;
let sendInProgress = false;
let fsDataChannelOpen = false;
const chunkSize = 16 * 1024; //16kb

/**
 * Load all Html elements by Id
 */
function getHtmlElementsById() {
  // totalTime = document.getElementById("totalTime");
  myVideo = document.getElementById("myVideo");
  // control buttons
  leftButtons = document.getElementById("leftButtons");
  shareRoomBtn = document.getElementById("shareRoomBtn");
  audioBtn = document.getElementById("audioBtn");
  videoBtn = document.getElementById("videoBtn");
  swapCameraBtn = document.getElementById("swapCameraBtn");
  screenShareBtn = document.getElementById("screenShareBtn");
  recordStreamBtn = document.getElementById("recordStreamBtn");
  fullScreenBtn = document.getElementById("fullScreenBtn");
  chatRoomBtn = document.getElementById("chatRoomBtn");
  whiteboardBtn = document.getElementById("whiteboardBtn");
  fileShareBtn = document.getElementById("fileShareBtn");
  myHandBtn = document.getElementById("myHandBtn");
  mySettingsBtn = document.getElementById("mySettingsBtn");

  leaveRoomBtn = document.getElementById("leaveRoomBtn");
  // chat Room elements
  msgerDraggable = document.getElementById("msgerDraggable");
  msgerHeader = document.getElementById("msgerHeader");

  msgerClean = document.getElementById("msgerClean");
  msgerSaveBtn = document.getElementById("msgerSaveBtn");
  msgerClose = document.getElementById("msgerClose");
  msgerChat = document.getElementById("msgerChat");
  msgerInput = document.getElementById("msgerInput");
  msgerSendBtn = document.getElementById("msgerSendBtn");

  // my settings
  mySettings = document.getElementById("mySettings");
  mySettingsHeader = document.getElementById("mySettingsHeader");
  mySettingsCloseBtn = document.getElementById("mySettingsCloseBtn");
  audioInputSelect = document.getElementById("audioSource");
  audioOutputSelect = document.getElementById("audioOutput");
  videoSelect = document.getElementById("videoSource");
  // my conference name, hand, video - audio status
  myVideoParagraph = document.getElementById("myVideoParagraph");
  handStatusIcon = document.getElementById("handStatusIcon");
  videoStatusIcon = document.getElementById("videoStatusIcon");
  audioStatusIcon = document.getElementById("audioStatusIcon");
  // my whiteboard
  whiteboardCont = document.querySelector(".whiteboard-cont");
  whiteboardHeader = document.querySelector(".colors-cont");
  whiteboardCloseBtn = document.getElementById("whiteboardCloseBtn");
  whiteboardFsBtn = document.getElementById("whiteboardFsBtn");
  whiteboardColorPicker = document.getElementById("whiteboardColorPicker");
  whiteboardSaveBtn = document.getElementById("whiteboardSaveBtn");
  whiteboardEraserBtn = document.getElementById("whiteboardEraserBtn");
  whiteboardCleanBtn = document.getElementById("whiteboardCleanBtn");
  canvas = document.getElementById("whiteboard");
  ctx = canvas.getContext("2d");
  // room actions buttons
  muteEveryoneBtn = document.getElementById("muteEveryoneBtn");
  hideEveryoneBtn = document.getElementById("hideEveryoneBtn");
  // file send progress
  sendFileDiv = document.getElementById("sendFileDiv");
  sendFileInfo = document.getElementById("sendFileInfo");
  sendProgress = document.getElementById("sendProgress");
  sendAbortBtn = document.getElementById("sendAbortBtn");
}

/**
 * Using tippy
 * https://atomiks.github.io/tippyjs/
 */
function setButtonsTitle() {
  // not need for mobile
  if (isMobileDevice) return;

  // left buttons
  tippy(shareRoomBtn, {
    content: "Invite people to join",
    placement: "right-start",
  });
  tippy(audioBtn, {
    content: "Click to audio OFF",
    placement: "right-start",
  });
  tippy(videoBtn, {
    content: "Click to video OFF",
    placement: "right-start",
  });
  tippy(screenShareBtn, {
    content: "START screen sharing",
    placement: "right-start",
  });
  tippy(recordStreamBtn, {
    content: "START recording",
    placement: "right-start",
  });
  tippy(fullScreenBtn, {
    content: "VIEW full screen",
    placement: "right-start",
  });
  tippy(chatRoomBtn, {
    content: "OPEN the chat",
    placement: "right-start",
  });
  tippy(myHandBtn, {
    content: "RAISE your hand",
    placement: "right-start",
  });
  tippy(whiteboardBtn, {
    content: "OPEN the whiteboard",
    placement: "right-start",
  });
  tippy(fileShareBtn, {
    content: "SHARE the file",
    placement: "right-start",
  });
  tippy(mySettingsBtn, {
    content: "Show settings",
    placement: "right-start",
  });

  tippy(leaveRoomBtn, {
    content: "Leave this room",
    placement: "right-start",
  });

  tippy(msgerClean, {
    content: "Clean messages",
  });
  tippy(msgerSaveBtn, {
    content: "Save messages",
  });
  tippy(msgerClose, {
    content: "Close the chat",
  });

  tippy(msgerSendBtn, {
    content: "Send",
  });

  // settings
  tippy(mySettingsCloseBtn, {
    content: "Close settings",
  });

  // whiteboard btns
  tippy(whiteboardCloseBtn, {
    content: "CLOSE the whiteboard",
    placement: "bottom",
  });
  tippy(whiteboardFsBtn, {
    content: "VIEW full screen",
    placement: "bottom",
  });
  tippy(whiteboardColorPicker, {
    content: "COLOR picker",
    placement: "bottom",
  });
  tippy(whiteboardSaveBtn, {
    content: "SAVE the board",
    placement: "bottom",
  });
  tippy(whiteboardEraserBtn, {
    content: "ERASE the board",
    placement: "bottom",
  });
  tippy(whiteboardCleanBtn, {
    content: "CLEAN the board",
    placement: "bottom",
  });

  // room actions btn
  tippy(muteEveryoneBtn, {
    content: "MUTE everyone except yourself",
    placement: "top",
  });
  tippy(hideEveryoneBtn, {
    content: "HIDE everyone except yourself",
    placement: "top",
  });

  // Suspend File transfer btn
  tippy(sendAbortBtn, {
    content: "ABORT file transfer",
    placement: "right-start",
  });
}

/**
 * Get peer info using DetecRTC
 * https://github.com/muaz-khan/DetectRTC
 * @return Json peer info
 */
function getPeerInfo() {
  return {
    detectRTCversion: DetectRTC.version,
    isWebRTCSupported: DetectRTC.isWebRTCSupported,
    isMobileDevice: DetectRTC.isMobileDevice,
    osName: DetectRTC.osName,
    osVersion: DetectRTC.osVersion,
    browserName: DetectRTC.browser.name,
    browserVersion: DetectRTC.browser.version,
  };
}

/**
 * Get approximative peer geolocation
 * @return json
 */
function getPeerGeoLocation() {
  fetch(peerLoockupUrl)
    .then((res) => res.json())
    .then((outJson) => {
      peerGeo = outJson;
    })
    .catch((err) => console.error(err));
}

/**
 * Get Signaling server url
 * @return Signaling server Url
 */
function getServerUrl() {
  return (
    "http" +
    (location.hostname == "localhost" ? "" : "s") +
    "://" +
    location.hostname +
    (location.hostname == "localhost" ? ":" + serverSignalingPort : "")
  );
}

/**
 * Generate random Room id
 * @return Room Id
 */
function getRoomId() {
  // skip /join/
  let roomId = location.pathname.substring(6);
  // if not specified room id, create one random
  if (roomId == "") {
    roomId = makeId(12);
    const newurl = serverSignaling + "/join/" + roomId;
    window.history.pushState({ url: newurl }, roomId, newurl);
  }
  return roomId;
}

/**
 * Generate random Id
 * @param {*} length
 * @returns random id
 */
function makeId(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Check if there is peer connections
 * @return true, false otherwise
 */
function thereIsPeerConnections() {
  if (Object.keys(peerConnections).length === 0) {
    return false;
  }
  return true;
}

/**
 * On body load Get started
 */
function initPeer(userName, userImg) {
  // check if peer is done for WebRTC
  if (!isWebRTCSupported) {
    console.error("isWebRTCSupported: false");
    userLog("error", "This browser seems not supported WebRTC!");
    return;
  }

  // peer ready for WebRTC! :)
  console.log("Connecting to signaling server");
  signalingSocket = io(serverSignaling);

  /**
   * Once the user has given us access to their
   * microphone/camcorder, join the channel
   * and start peering up
   */
  signalingSocket.on("connect", () => {
    console.log("Connected to signaling server");
    if (localMediaStream) joinToChannel();
    else
      setupLocalMedia(() => {
        getNameImg(userName, userImg);
      });
  });

  /**
   * set your name 4 conference
   */
  function getNameImg(userName, userImg) {
    myPeerName = userName;
    myPeerAvatarRecieved = userImg;
    myVideoParagraph.innerHTML = myPeerName + " (me)";
    setAvatarImgName("myVideoAvatarImage", myPeerAvatarRecieved);
    setChatAvatarImgName("right", myPeerName);
    joinToChannel();
    welcomeUser();

    // not need for mobile
    if (isMobileDevice) return;
    // init audio-video
    initAudioBtn = document.getElementById("initAudioBtn");
    initVideoBtn = document.getElementById("initVideoBtn");
    // popup text
    tippy(initAudioBtn, {
      content: "Click to audio OFF",
      placement: "top",
    });
    tippy(initVideoBtn, {
      content: "Click to video OFF",
      placement: "top",
    });
  }

  /**
   * join to chennel and send some peer info
   */
  function joinToChannel() {
    console.log("join to channel", roomId);
    signalingSocket.emit("join", {
      channel: roomId,
      peerInfo: peerInfo,
      peerGeo: peerGeo,
      peerName: myPeerName,
      peerImg: myPeerAvatarRecieved,
      peerVideo: videoStatus,
      peerAudio: audioStatus,
      peerHand: handStatus,
    });
  }

  /**
   * welcome message
   */
  function welcomeUser() {
    const myRoomUrl = window.location.href;

    Swal.fire({
      background: swalBg,
      position: "center",
      title: "<strong>Welcome " + myPeerName + "</strong>",
      imageAlt: "MSTeams-welcome",
      html:
        `
      <br/> 
      <p >Share this meeting invite others to join.</p>
      <p style="font-weight: bold;">` +
        myRoomUrl +
        `</p>`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Copy meeting URL`,
      denyButtonText: `Email invite`,
      cancelButtonText: `Close`,
      showClass: {
        popup: "animate__animated animate__fadeInDown",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        copyRoomURL();
      } else if (result.isDenied) {
        let message = {
          email: "",
          subject: "Please join our MSTeams Video Chat Meeting",
          body: "Click to join: " + myRoomUrl,
        };
        shareRoomByEmail(message);
      }
    });
  }

  /**
   * When we join a group, our signaling server will send out 'addPeer' events to each pair
   * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
   * in the channel you will connect directly to the other 5, so there will be a total of 15
   * connections in the network).
   */
  signalingSocket.on("addPeer", (config) => {
    let peer_id = config.peer_id;
    let peers = config.peers;

    if (peer_id in peerConnections) {
      // This could happen if the user joins multiple channels where the other peer is also in.
      console.log("Already connected to peer", peer_id);
      return;
    }

    if (config.iceServers) iceServers = config.iceServers;
    console.log("iceServers", iceServers[0]);

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
    peerConnection = new RTCPeerConnection({ iceServers: iceServers });

    // collect peer connections
    peerConnections[peer_id] = peerConnection;

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onicecandidate
    peerConnections[peer_id].onicecandidate = (event) => {
      if (event.candidate) {
        signalingSocket.emit("relayICE", {
          peer_id: peer_id,
          ice_candidate: {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
            address: event.candidate.address,
          },
        });
      }
    };

    /**
     * WebRTC: onaddstream is deprecated! Use peerConnection.ontrack instead (done)
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onaddstream
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
     */
    let ontrackCount = 0;
    peerConnections[peer_id].ontrack = (event) => {
      ontrackCount++;
      if (ontrackCount === 2) {
        console.log("ontrack", event);
        remoteMediaStream = event.streams[0];

        const videoWrap = document.createElement("div");

        // handle peers name video audio status
        const remoteStatusMenu = document.createElement("div");
        const remoteVideoParagraphImg = document.createElement("i");
        const remoteVideoParagraph = document.createElement("h4");
        const remoteHandStatusIcon = document.createElement("button");
        const remoteVideoStatusIcon = document.createElement("button");
        const remoteAudioStatusIcon = document.createElement("button");
        const remotePeerKickOut = document.createElement("button");
        const remoteVideoFullScreenBtn = document.createElement("button");
        const remoteVideoAvatarImage = document.createElement("img");

        // menu Status
        remoteStatusMenu.setAttribute("id", peer_id + "_menuStatus");
        remoteStatusMenu.className = "statusMenu";

        // remote peer name element
        remoteVideoParagraphImg.setAttribute("id", peer_id + "_nameImg");
        // remoteVideoParagraphImg.className = "fas fa-user";
        remoteVideoParagraph.setAttribute("id", peer_id + "_name");
        remoteVideoParagraph.className = "videoPeerName";
        tippy(remoteVideoParagraph, {
          content: "Participant name",
        });
        const peerVideoText = document.createTextNode(
          peers[peer_id]["peer_name"]
        );
        remoteVideoParagraph.appendChild(peerVideoText);
        // remote hand status element
        remoteHandStatusIcon.setAttribute("id", peer_id + "_handStatus");
        remoteHandStatusIcon.style.setProperty("color", "rgb(0, 255, 0)");
        remoteHandStatusIcon.className = "fas fa-hand-paper pulsate";
        tippy(remoteHandStatusIcon, {
          content: "Participant hand is RAISED",
        });
        // remote video status element
        remoteVideoStatusIcon.setAttribute("id", peer_id + "_videoStatus");
        remoteVideoStatusIcon.className = "fas fa-video";
        tippy(remoteVideoStatusIcon, {
          content: "Participant video is ON",
        });
        // remote audio status element
        remoteAudioStatusIcon.setAttribute("id", peer_id + "_audioStatus");
        remoteAudioStatusIcon.className = "fas fa-microphone";
        tippy(remoteAudioStatusIcon, {
          content: "Participant audio is ON",
        });
        // remote peer kick out
        remotePeerKickOut.setAttribute("id", peer_id + "_kickOut");
        remotePeerKickOut.className = "fas fa-sign-out-alt";
        tippy(remotePeerKickOut, {
          content: "Kick out",
        });
        // remote video full screen mode
        remoteVideoFullScreenBtn.setAttribute("id", peer_id + "_fullScreen");
        remoteVideoFullScreenBtn.className = "fas fa-expand";
        tippy(remoteVideoFullScreenBtn, {
          content: "Full screen mode",
        });
        // my video avatar image
        remoteVideoAvatarImage.setAttribute("id", peer_id + "_avatar");
        remoteVideoAvatarImage.className =
          "videoAvatarImage rounded-circle pulsate";

        // add elements to remoteStatusMenu div
        remoteStatusMenu.appendChild(remoteVideoParagraphImg);
        remoteStatusMenu.appendChild(remoteVideoParagraph);
        remoteStatusMenu.appendChild(remoteHandStatusIcon);
        remoteStatusMenu.appendChild(remoteVideoStatusIcon);
        remoteStatusMenu.appendChild(remoteAudioStatusIcon);
        remoteStatusMenu.appendChild(remotePeerKickOut);
        remoteStatusMenu.appendChild(remoteVideoFullScreenBtn);

        // add elements to videoWrap div
        videoWrap.appendChild(remoteStatusMenu);
        videoWrap.appendChild(remoteVideoAvatarImage);

        const remoteMedia = document.createElement("video");
        videoWrap.className = "video";
        videoWrap.appendChild(remoteMedia);
        remoteMedia.setAttribute("id", peer_id + "_video");
        remoteMedia.setAttribute("playsinline", true);
        remoteMedia.mediaGroup = "remotevideo";
        remoteMedia.autoplay = true;
        isMobileDevice
          ? (remoteMediaControls = false)
          : (remoteMediaControls = remoteMediaControls);
        remoteMedia.controls = remoteMediaControls;
        peerMediaElements[peer_id] = remoteMedia;
        document.body.appendChild(videoWrap);

        // attachMediaStream is a part of the adapter.js library
        attachMediaStream(remoteMedia, remoteMediaStream);
        // resize video elements
        resizeVideos();

        // handle video full screen mode
        handleVideoPlayerFs(peer_id + "_video", peer_id + "_fullScreen");
        // handle kick out button event
        handlePeerKickOutBtn(peer_id);
        // refresh remote peers avatar name
        setAvatarImgName(peer_id + "_avatar", peers[peer_id]["peer_img"]);
        // refresh remote peers hand icon status and title
        // console.log(peers[peer_id].peer_name)
        setPeerHandStatus(
          peer_id,
          peers[peer_id].peer_name,
          peers[peer_id]["peer_hand"]
        );
        // refresh remote peers video icon status and title
        setPeerVideoStatus(peer_id, peers[peer_id]["peer_video"]);
        // refresh remote peers audio icon status and title
        setPeerAudioStatus(peer_id, peers[peer_id]["peer_audio"]);
        // show status menu
        toggleClassElements("statusMenu", "inline");
      }
    };

    if (useRTCDataChannel) {
      /**
       * Secure Data Channel (production mode)
       * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
       * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel
       * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ondatachannel
       * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/onmessage
       */
      peerConnections[peer_id].ondatachannel = (event) => {
        console.log("Datachannel event " + peer_id, event);
        event.channel.onmessage = (msg) => {
          switch (event.channel.label) {
            case "MSTeams_chat_channel":
              let dataMessage = {};
              try {
                dataMessage = JSON.parse(msg.data);
                handleDataChannelChat(dataMessage);
              } catch (err) {
                console.log(err);
              }
              break;
            case "MSTeams_file_sharing_channel":
              handleDataChannelFileSharing(msg.data);
              break;
          }
        };
      };

      createChatDataChannel(peer_id);
      createFileSharingDataChannel(peer_id);
    } else {
      // show chat messages dev mode
      signalingSocket.on("onMessage", (config) => {
        console.log("Receive msg", { msg: config.msg });
        if (!isChatVisible) {
          showChatRoomDraggable();
          chatRoomBtn.className = "fas fa-comment-slash";
        }

        setChatAvatarImgName("left", config.name);
        appendMessage(config.name, leftChatUserImg, "left", config.msg);
      });
    }

    /**
     * peerConnections[peer_id].addStream(localMediaStream); // no longer raccomanded
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addTrack
     */
    localMediaStream.getTracks().forEach((track) => {
      peerConnections[peer_id].addTrack(track, localMediaStream);
    });

    /**
     * Only one side of the peer connection should create the
     * offer, the signaling server picks one to be the offerer.
     * The other user will get a 'sessionDescription' event and will
     * create an offer, then send back an answer 'sessionDescription' to us
     */
    if (config.should_create_offer) {
      console.log("Creating RTC offer to", peer_id);
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
      peerConnections[peer_id]
        .createOffer()
        .then((local_description) => {
          console.log("Local offer description is", local_description);
          // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
          peerConnections[peer_id]
            .setLocalDescription(local_description)
            .then(() => {
              signalingSocket.emit("relaySDP", {
                peer_id: peer_id,
                session_description: local_description,
              });
              console.log("Offer setLocalDescription done!");
            })
            .catch((err) => {
              console.error("[Error] offer setLocalDescription", err);
              userLog("error", "Offer setLocalDescription failed " + err);
            });
        })
        .catch((err) => {
          console.error("[Error] sending offer", err);
        });
    } // end [if offer true]
  }); // end [addPeer]

  /**
   * Peers exchange session descriptions which contains information
   * about their audio / video settings and that sort of stuff. First
   * the 'offerer' sends a description to the 'answerer' (with type
   * "offer"), then the answerer sends one back (with type "answer").
   */
  signalingSocket.on("sessionDescription", (config) => {
    console.log("Remote Session-description", config);

    let peer_id = config.peer_id;
    let remote_description = config.session_description;

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription
    let description = new RTCSessionDescription(remote_description);

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setRemoteDescription
    peerConnections[peer_id]
      .setRemoteDescription(description)
      .then(() => {
        console.log("setRemoteDescription done!");
        if (remote_description.type == "offer") {
          console.log("Creating answer");
          // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
          peerConnections[peer_id]
            .createAnswer()
            .then((local_description) => {
              console.log("Answer description is: ", local_description);
              // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
              peerConnections[peer_id]
                .setLocalDescription(local_description)
                .then(() => {
                  signalingSocket.emit("relaySDP", {
                    peer_id: peer_id,
                    session_description: local_description,
                  });
                  console.log("Answer setLocalDescription done!");
                })
                .catch((err) => {
                  console.error("[Error] answer setLocalDescription", err);
                  userLog("error", "Answer setLocalDescription failed " + err);
                });
            })
            .catch((err) => {
              console.error("[Error] creating answer", err);
            });
        } // end [if type offer]
      })
      .catch((err) => {
        console.error("[Error] setRemoteDescription", err);
      });
  }); // end [sessionDescription]

  /**
   * The offerer will send a number of ICE Candidate blobs to the answerer so they
   * can begin trying to find the best path to one another on the net.
   */
  signalingSocket.on("iceCandidate", (config) => {
    let peer_id = config.peer_id;
    let ice_candidate = config.ice_candidate;
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate
    peerConnections[peer_id]
      .addIceCandidate(new RTCIceCandidate(ice_candidate))
      .catch((err) => {
        console.error("[Error] addIceCandidate", err);
      });
  });

  

  // refresh peers video - audio - hand icon status and title
  signalingSocket.on("onpeerStatus", (config) => {
    switch (config.element) {
      case "video":
        setPeerVideoStatus(config.peer_id, config.status);
        break;
      case "audio":
        setPeerAudioStatus(config.peer_id, config.status);
        break;
      case "hand":
        setPeerHandStatus(config.peer_id, config.peer_name, config.status);
        break;
    }
  });

  // whiteboard actions
  signalingSocket.on("wb", (config) => {
    // only on desktop if mobile do nothing
    if (isMobileDevice) return;
    switch (config.act) {
      case "draw":
        drawRemote(config);
        break;
      case "clean":
        userLog("toast", config.peer_name + " has cleaned the board");
        whiteboardClean();
        break;
      case "open":
        userLog("toast", config.peer_name + " has opened the board");
        whiteboardOpen();
        break;
      case "close":
        userLog("toast", config.peer_name + " has closed the board");
        whiteboardClose();
        break;
      case "resize":
        userLog("toast", config.peer_name + " has resized the board");
        whiteboardResize();
        break;
    }
  });

  // set my Audio off
  signalingSocket.on("onmuteEveryone", (config) => {
    setMyAudioOff(config.peer_name);
  });
  // set my Video off
  signalingSocket.on("onhideEveryone", (config) => {
    setMyVideoOff(config.peer_name);
  });
  // kick out
  signalingSocket.on("onKickOut", (config) => {
    kickedOut(config.peer_name);
  });
  // get file info
  signalingSocket.on("onFileInfo", (data) => {
    startDownload(data);
  });

  /**
   * Tear down all of our peer connections
   * and remove all the media divs when we disconnect
   */
  signalingSocket.on("disconnect", () => {
    console.log("Disconnected from signaling server");
    for (let peer_id in peerMediaElements) {
      document.body.removeChild(peerMediaElements[peer_id].parentNode);
      resizeVideos();
    }
    for (let peer_id in peerConnections) {
      peerConnections[peer_id].close();
    }
    if (useRTCDataChannel) chatDataChannels = {};
    fileSharingDataChannels = {};
    peerConnections = {};
    peerMediaElements = {};
  });

  /**
   * When a user leaves a channel (or is disconnected from the
   * signaling server) everyone will recieve a 'removePeer' message
   * telling them to trash the media channels they have open for those
   * that peer. If it was this client that left a channel, they'll also
   * receive the removePeers. If this client was disconnected, they
   * wont receive removePeers, but rather the
   * signaling_socket.on('disconnect') code will kick in and tear down
   * all the peer sessions.
   */
  signalingSocket.on("removePeer", (config) => {
    console.log("Signaling server said to remove peer:", config);

    let peer_id = config.peer_id;

    if (peer_id in peerMediaElements) {
      document.body.removeChild(peerMediaElements[peer_id].parentNode);
      resizeVideos();
    }
    if (peer_id in peerConnections) {
      peerConnections[peer_id].close();
    }

    if (useRTCDataChannel) delete chatDataChannels[peer_id];
    delete fileSharingDataChannels[peer_id];

    delete peerConnections[peer_id];
    delete peerMediaElements[peer_id];
  });
} // end [initPeer]

/**
 * Setup local media stuff
 * @param {*} callback
 * @param {*} errorback
 */
function setupLocalMedia(callback, errorback) {
  // if we've already been initialized do nothing
  if (localMediaStream != null) {
    if (callback) callback();
    return;
  }

  getPeerGeoLocation();

  /**
   * Ask user for permission to use the computers microphone and/or camera,
   * attach it to an <audio> or <video> tag if they give us access.
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */
  console.log("Requesting access to local audio / video inputs");

  const constraints = {
    audio: usingAudio,
    video: usingVideo,
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      console.log("Access granted to audio/video");
      // hide img bg and loading div
      document.body.style.backgroundImage = "none";
      document.getElementById("loadingDiv").style.display = "none";

      localMediaStream = stream;

      const videoWrap = document.createElement("div");

      
      const myStatusMenu = document.createElement("div");
      
      const myVideoParagraphImg = document.createElement("i");
      const myVideoParagraph = document.createElement("h4");
      const handStatusIcon = document.createElement("button");
      const videoStatusIcon = document.createElement("button");
      const audioStatusIcon = document.createElement("button");
      const myVideoFullScreenBtn = document.createElement("button");
      const myVideoAvatarImage = document.createElement("img");

      // menu Status
      myStatusMenu.setAttribute("id", "myStatusMenu");
      myStatusMenu.className = "statusMenu";

      
      myVideoParagraphImg.setAttribute("id", "myVideoParagraphImg");
      // myVideoParagraphImg.className = "fas fa-user";
      myVideoParagraph.setAttribute("id", "myVideoParagraph");
      myVideoParagraph.className = "videoPeerName";
      tippy(myVideoParagraph, {
        content: "My name",
      });
      // my hand status element
      handStatusIcon.setAttribute("id", "handStatusIcon");
      handStatusIcon.className = "fas fa-hand-paper pulsate";
      handStatusIcon.style.setProperty("color", "rgb(0, 255, 0)");
      tippy(handStatusIcon, {
        content: "My hand is RAISED",
      });
      // my video status element
      videoStatusIcon.setAttribute("id", "videoStatusIcon");
      videoStatusIcon.className = "fas fa-video";
      tippy(videoStatusIcon, {
        content: "My video is ON",
      });
      // my audio status element
      audioStatusIcon.setAttribute("id", "audioStatusIcon");
      audioStatusIcon.className = "fas fa-microphone";
      tippy(audioStatusIcon, {
        content: "My audio is ON",
      });
      // my video full screen mode
      myVideoFullScreenBtn.setAttribute("id", "myVideoFullScreenBtn");
      myVideoFullScreenBtn.className = "fas fa-expand";
      tippy(myVideoFullScreenBtn, {
        content: "Full screen mode",
      });
      // my video avatar image
      myVideoAvatarImage.setAttribute("id", "myVideoAvatarImage");
      myVideoAvatarImage.className = "videoAvatarImage rounded-circle pulsate";

      
      myStatusMenu.appendChild(myVideoParagraphImg);
      myStatusMenu.appendChild(myVideoParagraph);
      myStatusMenu.appendChild(handStatusIcon);
      myStatusMenu.appendChild(videoStatusIcon);
      myStatusMenu.appendChild(audioStatusIcon);
      myStatusMenu.appendChild(myVideoFullScreenBtn);

      // add elements to video wrap div
      videoWrap.appendChild(myStatusMenu);
      videoWrap.appendChild(myVideoAvatarImage);

      // hand display none on default menad is raised == false
      handStatusIcon.style.display = "none";

      const localMedia = document.createElement("video");
      videoWrap.className = "video";
      videoWrap.setAttribute("id", "myVideoWrap");
      videoWrap.appendChild(localMedia);
      localMedia.setAttribute("id", "myVideo");
      localMedia.setAttribute("playsinline", true);
      localMedia.className = "mirror";
      localMedia.autoplay = true;
      localMedia.muted = true;
      localMedia.volume = 0;
      localMedia.controls = false;
      document.body.appendChild(videoWrap);

      console.log("local-video-audio", {
        video: localMediaStream.getVideoTracks()[0].label,
        audio: localMediaStream.getAudioTracks()[0].label,
      });

      // attachMediaStream is a part of the adapter.js library
      attachMediaStream(localMedia, localMediaStream);
      resizeVideos();

      getHtmlElementsById();
      setButtonsTitle();
      manageLeftButtons();
      handleBodyOnMouseMove();
      setupMySettings();
      // startCountTime();

      // handle video full screen mode
      handleVideoPlayerFs("myVideo", "myVideoFullScreenBtn");

      if (callback) callback();
    })
    .catch((err) => {
      // user denied access to audio/video
      // https://blog.addpipe.com/common-getusermedia-errors/
      console.error("Access denied for audio/video", err);

      window.location.href = `/permission?roomId=${roomId}&getUserMediaError=${err}`;
      if (errorback) errorback();
    });
} // end [setup_local_stream]

/**
 * Resize video elements
 */
function resizeVideos() {
  const numToString = ["", "one", "two", "three", "four", "five", "six"];
  const videos = document.querySelectorAll(".video");
  document.querySelectorAll(".video").forEach((v) => {
    v.className = "video " + numToString[videos.length];
  });
}

/**
 * Handle peer kick out event button
 * @param {*} peer_id
 */
function handlePeerKickOutBtn(peer_id) {
  let peerKickOutBtn = document.getElementById(peer_id + "_kickOut");
  peerKickOutBtn.addEventListener("click", (e) => {
    kickOut(peer_id, peerKickOutBtn);
  });
}

/**
 * Refresh video - chat image avatar on name changes
 * https://eu.ui-avatars.com/
 *
 * @param {*} videoAvatarImageId element
 * @param {*} peerName
 */
function setAvatarImgName(videoAvatarImageId, avatarImg) {
  let videoAvatarImageElement = document.getElementById(videoAvatarImageId);
  // default img size 64 max 512
  let avatarImgSize = isMobileDevice ? 100 : 200;
  videoAvatarImageElement.setAttribute("src", avatarImg);

  videoAvatarImageElement.setAttribute("width", avatarImgSize + "px");
}

/**
 * Set Chat avatar image by peer name
 * @param {*} avatar left/right
 * @param {*} peerName my/friends
 */
function setChatAvatarImgName(avatar, peerName) {
  let avatarImg =
    avatarApiUrl +
    "?name=" +
    peerName +
    "&size=32" +
    "&background=random&rounded=true";

  switch (avatar) {
    case "left":
      leftChatUserImg = avatarImg;
      break;
    case "right":
      rightChatUserImg = avatarImg;
      break;
  }
}

/**
 * On video player click, go on full screen mode ||
 * On button click, go on full screen mode.
 * Press Esc to exit from full screen mode, or click again.
 * @param {*} videoId
 * @param {*} videoFullScreenBtnId
 */
function handleVideoPlayerFs(videoId, videoFullScreenBtnId) {
  let videoPlayer = document.getElementById(videoId);
  let videoFullScreenBtn = document.getElementById(videoFullScreenBtnId);

  // handle Chrome Firefox Opera Microsoft Edge videoPlayer ESC
  videoPlayer.addEventListener("fullscreenchange", (e) => {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    let fullscreenElement = document.fullscreenElement;
    if (!fullscreenElement) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

  // handle Safari videoPlayer ESC
  videoPlayer.addEventListener("webkitfullscreenchange", (e) => {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    let webkitIsFullScreen = document.webkitIsFullScreen;
    if (!webkitIsFullScreen) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

  // on button click go on FS
  videoFullScreenBtn.addEventListener("click", (e) => {
    handleFSVideo();
  });

  // on video click go on FS
  videoPlayer.addEventListener("click", (e) => {
    // not mobile on click go on FS or exit from FS
    if (!isMobileDevice) {
      handleFSVideo();
    } else {
      // mobile on click exit from FS, for enter use videoFullScreenBtn
      if (isVideoOnFullScreen) handleFSVideo();
    }
  });

  function handleFSVideo() {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;

    if (!isVideoOnFullScreen) {
      if (videoPlayer.requestFullscreen) {
        // Chrome Firefox Opera Microsoft Edge
        videoPlayer.requestFullscreen();
      } else if (videoPlayer.webkitRequestFullscreen) {
        // Safari request full screen mode
        videoPlayer.webkitRequestFullscreen();
      } else if (videoPlayer.msRequestFullscreen) {
        // IE11 request full screen mode
        videoPlayer.msRequestFullscreen();
      }
      isVideoOnFullScreen = true;
      videoPlayer.style.pointerEvents = "none";
      // console.log("Go on FS isVideoOnFullScreen", isVideoOnFullScreen);
    } else {
      if (document.exitFullscreen) {
        // Chrome Firefox Opera Microsoft Edge
        document.exitFullscreen();
      } else if (document.webkitCancelFullScreen) {
        // Safari exit full screen mode ( Not work... )
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        // IE11 exit full screen mode
        document.msExitFullscreen();
      }
      isVideoOnFullScreen = false;
      videoPlayer.style.pointerEvents = "auto";
    }
  }
}

/**
 * Start talk time
 */
// function startCountTime() {
//   totalTime.style.display = "inline";
//   startTime = Date.now();
//   setInterval(function printTime() {
//     elapsedTime = Date.now() - startTime;
//     totalTime.innerHTML = getTimeToString(elapsedTime);
//   }, 1000);
// }

/**
 * Start recording time
 */
function startRecordingTime() {
  recordTimeStart = Date.now();
  let rc = setInterval(function printTime() {
    if (isStreamRecording) {
      recordTimeElapsed = Date.now() - recordTimeStart;
      myVideoParagraph.innerHTML =
        myPeerName +
        "&nbsp;&nbsp; 🔴 REC " +
        getTimeToString(recordTimeElapsed);
      return;
    }
    clearInterval(rc);
  }, 1000);
}

/**
 * Return time to string
 * @param {*} time
 */
function getTimeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);
  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);
  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);
  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

/**
 * Handle WebRTC left buttons
 */
function manageLeftButtons() {
  setShareRoomBtn();
  setAudioBtn();
  setVideoBtn();
  setSwapCameraBtn();
  setScreenShareBtn();
  setRecordStreamBtn();
  setFullScreenBtn();
  setChatRoomBtn();

  setMyHandBtn();
  setMyWhiteboardBtn();
  setMyFileShareBtn();
  setMySettingsBtn();
  setLeaveRoomBtn();
  showLeftButtonsAndMenu();
}

/**
 * Copy - share room url button click event
 */
function setShareRoomBtn() {
  shareRoomBtn.addEventListener("click", async (e) => {
    shareRoomUrl();
  });
}

/**
 * Audio mute - unmute button click event
 */
function setAudioBtn() {
  audioBtn.addEventListener("click", (e) => {
    handleAudio(e, false);
  });
}

/**
 * Video hide - show button click event
 */
function setVideoBtn() {
  videoBtn.addEventListener("click", (e) => {
    handleVideo(e, false);
  });
}

/**
 * Check if can swap or not cam,
 * if yes show the button else hide it
 */
function setSwapCameraBtn() {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const videoInput = devices.filter((device) => device.kind === "videoinput");
    if (videoInput.length > 1 && isMobileDevice) {
      // swap camera front - rear button click event for mobile
      swapCameraBtn.addEventListener("click", (e) => {
        swapCamera();
      });
    } else {
      swapCameraBtn.style.display = "none";
    }
  });
}

/**
 * Check if can share a screen,
 * if yes show button else hide it
 */
function setScreenShareBtn() {
  if (
    !isMobileDevice &&
    (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia)
  ) {
    // share screen on - off button click event
    screenShareBtn.addEventListener("click", (e) => {
      toggleScreenSharing();
    });
  } else {
    screenShareBtn.style.display = "none";
  }
}

/**
 * Start - Stop Stream recording
 */
function setRecordStreamBtn() {
  recordStreamBtn.addEventListener("click", (e) => {
    if (isStreamRecording) {
      stopStreamRecording();
    } else {
      startStreamRecording();
    }
  });
}

/**
 * Full screen button click event
 */
function setFullScreenBtn() {
  if (DetectRTC.browser.name != "Safari") {
    // detect esc from full screen mode
    document.addEventListener("fullscreenchange", (e) => {
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        fullScreenBtn.className = "bi-arrows-fullscreen";
        isDocumentOnFullScreen = false;
        // only for desktop
        if (!isMobileDevice) {
          tippy(fullScreenBtn, {
            content: "VIEW full screen",
            placement: "right-start",
          });
        }
      }
    });
    fullScreenBtn.addEventListener("click", (e) => {
      toggleFullScreen();
    });
  } else {
    fullScreenBtn.style.display = "none";
  }
}

/**
 * Chat room buttons click event
 */
function setChatRoomBtn() {
  // adapt chat room for mobile
  setChatRoomForMobile();

  // open hide chat room
  chatRoomBtn.addEventListener("click", (e) => {
    if (!isChatVisible) {
      showChatRoomDraggable();
    } else {
      hideChatRoom();
      e.target.className = "fas fa-comment";
    }
  });

  // clean chat messages
  msgerClean.addEventListener("click", (e) => {
    cleanMessages();
  });

  // save chat messages to file
  msgerSaveBtn.addEventListener("click", (e) => {
    if (chatMessages.length != 0) {
      downloadChatMsgs();
      return;
    }
    userLog("info", "No chat messages to save");
  });

  // close chat room - show left button and status menu if hide
  msgerClose.addEventListener("click", (e) => {
    hideChatRoom();
    showLeftButtonsAndMenu();
  });

  // Execute a function when the user releases a key on the keyboard
  msgerInput.addEventListener("keyup", (e) => {
    // Number 13 is the "Enter" key on the keyboard
    if (e.keyCode === 13) {
      e.preventDefault();
      msgerSendBtn.click();
    }
  });

  // chat send msg
  msgerSendBtn.addEventListener("click", (e) => {
    // prevent refresh page
    e.preventDefault();

    if (!thereIsPeerConnections()) {
      userLog("info", "Can't send message, no peer connection detected");
      msgerInput.value = "";
      return;
    }

    const msg = msgerInput.value;
    // empity msg
    if (!msg) return;

    emitMsg(myPeerName, "toAll", msg, "");
    appendMessage(myPeerName, rightChatUserImg, "right", msg, false);
    msgerInput.value = "";
  });
}

/**
 * Set my hand button click event
 */
function setMyHandBtn() {
  myHandBtn.addEventListener("click", async (e) => {
    setMyHandStatus();
  });
}

function setMyWhiteboardBtn() {
  // not supported for mobile
  if (isMobileDevice) {
    whiteboardBtn.style.display = "none";
    return;
  }

  setupCanvas();

  // open - close whiteboard
  whiteboardBtn.addEventListener("click", (e) => {
    if (isWhiteboardVisible) {
      whiteboardClose();
      remoteWbAction("close");
    } else {
      whiteboardOpen();
      remoteWbAction("open");
    }
  });
  // close whiteboard
  whiteboardCloseBtn.addEventListener("click", (e) => {
    whiteboardClose();
    remoteWbAction("close");
  });
  // view full screen
  whiteboardFsBtn.addEventListener("click", (e) => {
    whiteboardResize();
    remoteWbAction("resize");
  });
  // erase whiteboard
  whiteboardEraserBtn.addEventListener("click", (e) => {
    setEraser();
  });
  // save whitebaord content as img
  whiteboardSaveBtn.addEventListener("click", (e) => {
    saveWbCanvas();
  });
  // clean whiteboard
  whiteboardCleanBtn.addEventListener("click", (e) => {
    confirmCleanBoard();
  });
}

/**
 * File Transfer button event click
 * https://fromsmash.com for Big Data
 */
function setMyFileShareBtn() {
  fileShareBtn.addEventListener("click", (e) => {
    selectFileToShare();
  });
  sendAbortBtn.addEventListener("click", (e) => {
    abortFileTransfer();
  });
}

/**
 * My settings button click event
 */
function setMySettingsBtn() {
  mySettingsBtn.addEventListener("click", (e) => {
    if (isMobileDevice) {
      leftButtons.style.display = "none";
      isButtonsVisible = false;
    }
    hideShowMySettings();
  });
  mySettingsCloseBtn.addEventListener("click", (e) => {
    hideShowMySettings();
  });
  if (!isMobileDevice) {
    // make chat room draggable for desktop
    dragElement(mySettings, mySettingsHeader);
  }
}

/**
 * Leave room button click event
 */
function setLeaveRoomBtn() {
  leaveRoomBtn.addEventListener("click", (e) => {
    leaveRoom();
  });
}

/**
 * Handle left buttons - status menù show - hide on body mouse move
 */
function handleBodyOnMouseMove() {
  document.body.addEventListener("mousemove", (e) => {
    showLeftButtonsAndMenu();
  });
}

/**
 * Setup local audio - video devices  ...
 */
function setupMySettings() {
  // audio - video select box
  selectors = [audioInputSelect, audioOutputSelect, videoSelect];
  audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);
  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
  audioInputSelect.addEventListener("change", (e) => {
    videoChange = false;
    refreshLocalMedia();
  });
  audioOutputSelect.addEventListener("change", (e) => {
    changeAudioDestination();
  });
  videoSelect.addEventListener("change", (e) => {
    if (isMobileDevice) videoChange = true;
    refreshLocalMedia();
  });
  // room actions
  muteEveryoneBtn.addEventListener("click", (e) => {
    disableAllPeers("audio");
  });
  hideEveryoneBtn.addEventListener("click", (e) => {
    disableAllPeers("video");
  });
}

/**
 * Refresh Local media audio video in - out
 */
function refreshLocalMedia() {
  // some devices can't swap the video track, if already in execution.
  stopLocalVideoTrack();
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

/**
 * Change Audio Output
 */
function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(myVideo, audioDestination);
}

/**
 * Attach audio output device to video element using device/sink ID.
 * @param {*} element
 * @param {*} sinkId
 */
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== "undefined") {
    element
      .setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch((err) => {
        let errorMessage = err;
        if (err.name === "SecurityError") {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${err}`;
        }
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn("Browser does not support output device selection.");
  }
}

/**
 * Got Stream and append to local media
 * @param {*} stream
 */
function gotStream(stream) {
  refreshMyStreamToPeers(stream);
  refreshMyLocalStream(stream);
  setMyVideoStatusTrue();
  if (videoChange) {
    myVideo.classList.toggle("mirror");
  }
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

/**
 * Get audio-video Devices and show it to select box
 * https://github.com/webrtc/samples/tree/gh-pages/src/content/devices/input-output
 * @param {*} deviceInfos
 */
function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  // check devices
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    // console.log("device-info ------> ", deviceInfo);
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;

    if (deviceInfo.kind === "audioinput") {
      // audio Input
      option.text =
        deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === "audiooutput") {
      // audio Output
      option.text =
        deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      // video Input
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      // something else
      console.log("Some other kind of source/device: ", deviceInfo);
    }
  } // end for devices

  selectors.forEach((select, selectorIndex) => {
    if (
      Array.prototype.slice
        .call(select.childNodes)
        .some((n) => n.value === values[selectorIndex])
    ) {
      select.value = values[selectorIndex];
    }
  });
}

/**
 * Handle getUserMedia error
 * @param {*} err
 */
function handleError(err) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    err.message,
    err.name
  );
  userLog("error", "GetUserMedia error " + err);
  // https://blog.addpipe.com/common-getusermedia-errors/
}

/**
 * AttachMediaStream stream to element
 * @param {*} element
 * @param {*} stream
 */
function attachMediaStream(element, stream) {
  console.log("Success, media stream attached");
  element.srcObject = stream;
}

/**
 * Show left buttons & status menù for 10 seconds on body mousemove
 * if mobile and chatroom open do nothing return
 * if mobile and mySettings open do nothing return
 */
function showLeftButtonsAndMenu() {
  if (
    isButtonsVisible ||
    (isMobileDevice && isChatVisible) ||
    (isMobileDevice && isSettingVisible)
  ) {
    return;
  }
  toggleClassElements("statusMenu", "inline");
  leftButtons.style.display = "flex";
  isButtonsVisible = true;
  setTimeout(() => {
    toggleClassElements("statusMenu", "none");
    leftButtons.style.display = "none";
    isButtonsVisible = false;
  }, 10000);
}

/**
 * Copy room url to clipboard and share it with navigator share if supported
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
 */
async function shareRoomUrl() {
  const myRoomUrl = window.location.href;

  // navigator share
  let isSupportedNavigatorShare = false;
  let errorNavigatorShare = false;
  // if supported
  if (navigator.share) {
    isSupportedNavigatorShare = true;
    try {
      // not add title and description to load metadata from url
      await navigator.share({ url: myRoomUrl });
      userLog("toast", "Room Shared successfully!");
    } catch (err) {
      errorNavigatorShare = true;
      /*  This feature is available only in secure contexts (HTTPS),
          in some or all supporting browsers and mobile devices
          console.error("navigator.share", err); 
      */
    }
  }

  // something wrong or not supported navigator.share
  if (
    !isSupportedNavigatorShare ||
    (isSupportedNavigatorShare && errorNavigatorShare)
  ) {
    Swal.fire({
      background: swalBg,
      position: "center",
      title: "Share the Room",
      imageAlt: "MSTeams-share",
      html:
        `
      <br/>
      <div id="qrRoomContainer">
        <canvas id="qrRoom"></canvas>
      </div>
      <br/><br/>
      <p> Share this meeting invite others to join.</p>
      <p style=" font-weight: bold;">` +
        myRoomUrl +
        `</p>`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Copy meeting URL`,
      denyButtonText: `Email invite`,
      cancelButtonText: `Close`,
      showClass: {
        popup: "animate__animated animate__fadeInDown",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        copyRoomURL();
      } else if (result.isDenied) {
        let message = {
          email: "",
          subject: "Please join our MSTeams Video Chat Meeting",
          body: "Click to join: " + myRoomUrl,
        };
        shareRoomByEmail(message);
      }
    });
    makeRoomQR();
  }
}

/**
 * Make Room QR
 * https://github.com/neocotic/qrious
 */
function makeRoomQR() {
  let qr = new QRious({
    element: document.getElementById("qrRoom"),
    value: window.location.href,
  });
  qr.set({
    size: 128,
  });
}

/**
 * Copy Room URL to clipboard
 */
function copyRoomURL() {
  // save Room Url to clipboard
  let roomURL = window.location.href;
  let tmpInput = document.createElement("input");
  document.body.appendChild(tmpInput);
  tmpInput.value = roomURL;
  tmpInput.select();
  // for mobile devices
  tmpInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  console.log("Copied to clipboard Join Link ", roomURL);
  document.body.removeChild(tmpInput);
  userLog("toast", "Meeting URL is copied to clipboard");
}

/**
 * Share room id by email
 * @param {*} message email | subject | body
 */
function shareRoomByEmail(message) {
  let email = message.email;
  let subject = message.subject;
  let emailBody = message.body;
  document.location =
    "mailto:" + email + "?subject=" + subject + "&body=" + emailBody;
}

/**
 * Handle Audio ON-OFF
 * @param {*} e event
 * @param {*} init bool true/false
 */
function handleAudio(e, init) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/getAudioTracks
  localMediaStream.getAudioTracks()[0].enabled =
    !localMediaStream.getAudioTracks()[0].enabled;
  audioStatus = localMediaStream.getAudioTracks()[0].enabled;
  e.target.className = "fas fa-microphone" + (audioStatus ? "" : "-slash");
  if (init) {
    audioBtn.className = "fas fa-microphone" + (audioStatus ? "" : "-slash");
    if (!isMobileDevice) {
      tippy(initAudioBtn, {
        content: audioStatus ? "Click to audio OFF" : "Click to audio ON",
        placement: "top",
      });
    }
  }
  setMyAudioStatus(audioStatus);
}

/**
 * Handle Video ON-OFF
 * @param {*} e event
 * @param {*} init bool true/false
 */
function handleVideo(e, init) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/getVideoTracks
  localMediaStream.getVideoTracks()[0].enabled =
    !localMediaStream.getVideoTracks()[0].enabled;
  videoStatus = localMediaStream.getVideoTracks()[0].enabled;
  e.target.className = "fas fa-video" + (videoStatus ? "" : "-slash");
  if (init) {
    videoBtn.className = "fas fa-video" + (videoStatus ? "" : "-slash");
    if (!isMobileDevice) {
      tippy(initVideoBtn, {
        content: videoStatus ? "Click to video OFF" : "Click to video ON",
        placement: "top",
      });
    }
  }
  setMyVideoStatus(videoStatus);
}

/**
 * SwapCamera front (user) - rear (environment)
 */
function swapCamera() {
  // setup camera
  camera = camera == "user" ? "environment" : "user";
  if (camera == "user") usingVideo = true;
  else usingVideo = { facingMode: { exact: camera } };

  // some devices can't swap the cam, if have Video Track already in execution.
  if (usingVideo) stopLocalVideoTrack();

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  navigator.mediaDevices
    .getUserMedia({ video: usingVideo })
    .then((camStream) => {
      refreshMyStreamToPeers(camStream);
      refreshMyLocalStream(camStream);
      if (usingVideo) {
        setMyVideoStatusTrue();
        localMediaStream.getVideoTracks()[0].enabled = true;
      }
      myVideo.classList.toggle("mirror");
    })
    .catch((err) => {
      console.log("[Error] to swaping camera", err);
      userLog("error", "Error to swaping the camera " + err);
      // https://blog.addpipe.com/common-getusermedia-errors/
    });
}

/**
 * Stop Local Video Track
 */
function stopLocalVideoTrack() {
  localMediaStream.getVideoTracks()[0].stop();
}

/**
 * Enable - disable screen sharing
 */
function toggleScreenSharing() {
  const constraints = {
    video: true,
  };

  let screenMediaPromise;

  if (!isScreenSharing) {
    // on screen sharing start
    if (navigator.getDisplayMedia) {
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
      screenMediaPromise = navigator.getDisplayMedia(constraints);
    } else if (navigator.mediaDevices.getDisplayMedia) {
      screenMediaPromise = navigator.mediaDevices.getDisplayMedia(constraints);
    } else {
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
      screenMediaPromise = navigator.mediaDevices.getUserMedia({
        video: {
          mediaSource: "screen",
        },
      });
    }
  } else {
    // on screen sharing stop
    const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: { deviceId: videoSource ? { exact: videoSource } : undefined },
    };
    screenMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
    // if screen sharing accidentally closed
    if (isStreamRecording) {
      stopStreamRecording();
    }
  }
  screenMediaPromise
    .then((screenStream) => {
      // stop cam video track on screen share
      stopLocalVideoTrack();
      isScreenSharing = !isScreenSharing;
      refreshMyStreamToPeers(screenStream);
      refreshMyLocalStream(screenStream);
      myVideo.classList.toggle("mirror");
      setScreenSharingStatus(isScreenSharing);
    })
    .catch((err) => {
      console.error("[Error] Unable to share the screen", err);
    });
}

/**
 * Set Screen Sharing Status
 * @param {*} status
 */
function setScreenSharingStatus(status) {
  screenShareBtn.className = status ? "fas fa-stop-circle" : "fas fa-desktop";
  // only for desktop
  if (!isMobileDevice) {
    tippy(screenShareBtn, {
      content: status ? "STOP screen sharing" : "START screen sharing",
      placement: "right-start",
    });
  }
}

/**
 * set videoStatus true
 */
function setMyVideoStatusTrue() {
  // Put video status alredy ON
  if (videoStatus === false) {
    videoStatus = true;
    videoBtn.className = "fas fa-video";
    videoStatusIcon.className = "fas fa-video";
    myVideoAvatarImage.style.display = "none";
    emitPeerStatus("video", videoStatus);
    // only for desktop
    if (!isMobileDevice) {
      tippy(videoBtn, {
        content: "Click to video OFF",
        placement: "right-start",
      });
    }
  }
}

/**
 * Enter - esc on full screen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 */
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullScreenBtn.className = "bi-arrows-fullscreen";
    isDocumentOnFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      fullScreenBtn.className = "bi-arrows-fullscreen";
      isDocumentOnFullScreen = false;
    }
  }
  // only for desktop
  if (!isMobileDevice) {
    tippy(fullScreenBtn, {
      content: isDocumentOnFullScreen ? "EXIT full screen" : "VIEW full screen",
      placement: "right-start",
    });
  }
}

/**
 * Refresh my stream changes to connected peers in the room
 * @param {*} stream
 */
function refreshMyStreamToPeers(stream) {
  if (thereIsPeerConnections()) {
    // refresh my video stream
    for (let peer_id in peerConnections) {
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getSenders
      let sender = peerConnections[peer_id]
        .getSenders()
        .find((s) => (s.track ? s.track.kind === "video" : false));
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/replaceTrack
      sender.replaceTrack(stream.getVideoTracks()[0]);
    }
  }
}

/**
 * Refresh my local stream
 * @param {*} stream
 */
function refreshMyLocalStream(stream) {
  stream.getVideoTracks()[0].enabled = true;
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
  const newStream = new MediaStream([
    stream.getVideoTracks()[0],
    localMediaStream.getAudioTracks()[0],
  ]);
  localMediaStream = newStream;

  // attachMediaStream is a part of the adapter.js library
  attachMediaStream(myVideo, localMediaStream); // newstream

  // on toggleScreenSharing video stop
  stream.getVideoTracks()[0].onended = () => {
    if (isScreenSharing) toggleScreenSharing();
  };

  /** when you stop the screen sharing, on default i turn back to the webcam with video stream ON.
   *  if you want the webcam with video stream OFF, just disable it with the button (click to video OFF),
   *  before to stop the screen sharing.
   */
  if (videoStatus === false) {
    localMediaStream.getVideoTracks()[0].enabled = false;
  }
}

/**
 * recordind stream data
 * @param {*} event
 */
function handleDataAvailable(event) {
  console.log("handleDataAvailable", event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

/**
 * Start Recording
 * https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/record
 */
function startStreamRecording() {
  recordedBlobs = [];
  let options = { mimeType: "video/webm;codecs=vp9,opus" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    options = { mimeType: "video/webm;codecs=vp8,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = { mimeType: "video/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: "" };
      }
    }
  }

  try {
    // record only my local Media Stream
    mediaRecorder = new MediaRecorder(localMediaStream, options);
  } catch (err) {
    console.error("Exception while creating MediaRecorder:", err);
    userLog("error", "Can't start stream recording: " + err);
    return;
  }

  console.log("Created MediaRecorder", mediaRecorder, "with options", options);
  mediaRecorder.onstop = (event) => {
    console.log("MediaRecorder stopped: ", event);
    console.log("MediaRecorder Blobs: ", recordedBlobs);
    myVideoParagraph.innerHTML = myPeerName + " (me)";
    disableElements(false);
    downloadRecordedStream();
    // only for desktop
    if (!isMobileDevice) {
      tippy(recordStreamBtn, {
        content: "START recording",
        placement: "right-start",
      });
    }
  };

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log("MediaRecorder started", mediaRecorder);
  isStreamRecording = true;
  recordStreamBtn.style.setProperty("background-color", "red");
  startRecordingTime();
  disableElements(true);
  // only for desktop
  if (!isMobileDevice) {
    tippy(recordStreamBtn, {
      content: "STOP recording",
      placement: "right-start",
    });
  }
}

/**
 * Stop recording
 */
function stopStreamRecording() {
  mediaRecorder.stop();
  isStreamRecording = false;
  // CHANGE RECORDING BUTTON COLOR AFTER STOP RECORDING EDIT THIS
}

/**
 * Download recorded stream
 */
function downloadRecordedStream() {
  try {
    const blob = new Blob(recordedBlobs, { type: "video/webm" });
    const recFileName = getDataTimeString() + "-REC.webm";
    const currentDevice = isMobileDevice ? "MOBILE" : "PC";
    const blobFileSize = bytesToSize(blob.size);

    userLog(
      "success-html",
      `<div style="text-align: left;">
        Recording Info <br/>
        FILE: ${recFileName} <br/>
        SIZE: ${blobFileSize} <br/>
        Please wait to be processed, then will be downloaded to your ${currentDevice} device.
      </div>`
    );

    // save the recorded file to device
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = recFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    userLog("error", "Recording save failed: " + err);
  }
}

/**
 * Data Formated DD-MM-YYYY-H_M_S
 * https://convertio.co/it/
 * @returns data string
 */
function getDataTimeString() {
  const d = new Date();
  const date = d.toISOString().split("T")[0];
  const time = d.toTimeString().split(" ")[0];
  return `${date}-${time}`;
}

/**
 * Disable - enable some elements on Recording
 * I can Record One Media Stream at time
 * @param {*} b boolean true/false
 */
function disableElements(b) {
  swapCameraBtn.disabled = b;
  screenShareBtn.disabled = b;
  audioSource.disabled = b;
  videoSource.disabled = b;
}

/**
 * Set the chat room on full screen mode for mobile
 */
function setChatRoomForMobile() {
  if (isMobileDevice) {
    document.documentElement.style.setProperty("--msger-height", "99%");
    document.documentElement.style.setProperty("--msger-width", "99%");
  } else {
    // make chat room draggable for desktop
    dragElement(msgerDraggable, msgerHeader);
  }
}

/**
 * Show msger draggable on center screen position
 */
function showChatRoomDraggable() {
  if (isMobileDevice) {
    leftButtons.style.display = "none";
    isButtonsVisible = false;
  }
  chatRoomBtn.className = "fas fa-comment-slash";
  msgerDraggable.style.top = "50%";
  msgerDraggable.style.left = "50%";
  msgerDraggable.style.display = "flex";
  isChatVisible = true;
  // only for desktop
  if (!isMobileDevice) {
    tippy(chatRoomBtn, {
      content: "CLOSE the chat",
      placement: "right-start",
    });
  }
}

/**
 * Clean chat messages
 * https://sweetalert2.github.io
 */
function cleanMessages() {
  Swal.fire({
    background: swalBg,
    position: "center",
    title: "Clean up chat Messages?",
    icon: "warning",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    // clean chat messages
    if (result.isConfirmed) {
      let msgs = msgerChat.firstChild;
      while (msgs) {
        msgerChat.removeChild(msgs);
        msgs = msgerChat.firstChild;
      }
      // clean object
      chatMessages = [];
    }
  });
}

/**
 * Hide chat room
 */
function hideChatRoom() {
  msgerDraggable.style.display = "none";

  chatRoomBtn.className = "fas fa-comment";
  isChatVisible = false;
  // only for desktop
  if (!isMobileDevice) {
    tippy(chatRoomBtn, {
      content: "OPEN the chat",
      placement: "right-start",
    });
  }
}

/**
 * Create Chat Room Data Channel
 * @param {*} peer_id
 */
function createChatDataChannel(peer_id) {
  chatDataChannels[peer_id] = peerConnections[peer_id].createDataChannel(
    "MSTeams_chat_channel"
  );
}

/**
 * handle Incoming Data Channel Chat Messages
 * @param {*} dataMessages
 */
function handleDataChannelChat(dataMessages) {
  switch (dataMessages.type) {
    case "chat":
      // chat message for me also
      if (!isChatVisible) {
        showChatRoomDraggable();
        chatRoomBtn.className = "fas fa-comment-slash";
      }
      setChatAvatarImgName("left", dataMessages.name);
      appendMessage(
        dataMessages.name,
        leftChatUserImg,
        "left",
        dataMessages.msg
      );
      break;

    default:
      break;
  }
}

/**
 * Append Message to msger chat room
 * @param {*} name
 * @param {*} img
 * @param {*} side
 * @param {*} text
 */
function appendMessage(name, img, side, text) {
  let time = getFormatDate(new Date());
  // collect chat msges to save it later
  chatMessages.push({
    time: time,
    name: name,
    text: text,
  });

  let msgBubble = "msg-bubble";

  let ctext = detectUrl(text);
  const msgHTML = `
	<div class="msg ${side}-msg">
		<div class="msg-img" style="background-image: url('${img}')"></div>
		<div class=${msgBubble}>
      <div class="msg-info">
        <div class="msg-info-name">${name}</div>
        <div class="msg-info-time">${time}</div>
      </div>
      <div class="msg-text">${ctext}</div>
    </div>
	</div>
  `;
  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

/**
 * Detect url from text and make it clickable
 * Detect also if url is a img to create preview of it
 * @param {*} text
 * @returns html
 */
function detectUrl(text) {
  let urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    if (isImageURL(text)) {
      return (
        '<p><img src="' + url + '" alt="img" width="200" height="auto"/></p>'
      );
    }
    return (
      '<a id="chat-msg-a" href="' + url + '" target="_blank">' + url + "</a>"
    );
  });
}

/**
 * Check if url passed is a image
 * @param {*} url
 * @returns true/false
 */
function isImageURL(url) {
  return url.match(/\.(jpeg|jpg|gif|png|tiff|bmp)$/) != null;
}

/**
 * Format data h:m:s
 * @param {*} date
 */
function getFormatDate(date) {
  const time = date.toTimeString().split(" ")[0];
  return `${time}`;
}

/**
 * Send message over Secure dataChannels if use useRTCDataChannel(true)
 * otherwise over signaling server
 * @param {*} name
 * @param {*} toName
 * @param {*} msg
 */
function emitMsg(name, toName, msg, peer_id) {
  if (msg) {
    if (useRTCDataChannel) {
      const chatMessage = {
        type: "chat",
        name: name,
        toName: toName,
        msg: msg,
      };
      // peer to peer over DataChannels
      Object.keys(chatDataChannels).map((peerId) =>
        chatDataChannels[peerId].send(JSON.stringify(chatMessage))
      );
    } else {
      // client over signaling server
      signalingSocket.emit("msg", {
        peerConnections: peerConnections,
        room_id: roomId,
        peer_id: peer_id,
        name: name,
        msg: msg,
      });
    }
  }
}

/**
 * Download Chat messages in json format
 * https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 */
function downloadChatMsgs() {
  let a = document.createElement("a");
  a.href =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(chatMessages, null, 1));
  a.download = getDataTimeString() + "-CHAT.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Make chat room - devices draggable
 * https://www.w3schools.com/howto/howto_js_draggable.asp
 * @param {*} elmnt
 * @param {*} dragObj
 */
function dragElement(elmnt, dragObj) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (dragObj) {
    // if present, the header is where you move the DIV from:
    dragObj.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Hide - show my settings
 */
function hideShowMySettings() {
  if (!isSettingVisible) {
    // adapt it for mobile
    if (isMobileDevice) {
      mySettings.style.setProperty("width", "90%");
      document.documentElement.style.setProperty(
        "--mySettings-select-w",
        "99%"
      );
    }

    mySettings.style.top = "50%";
    mySettings.style.left = "50%";
    mySettings.style.display = "block";
    isSettingVisible = true;
    return;
  }
  mySettings.style.display = "none";
  isSettingVisible = false;
}

/**
 * Append updated peer name to video player
 * @param {*} id
 * @param {*} name
 */
function appendPeerName(id, name) {
  let videoName = document.getElementById(id + "_name");
  if (videoName) {
    videoName.innerHTML = name;
  }
  // change also btn value - name on chat lists....
  let msgerPeerName = document.getElementById(id + "_pMsgBtn");
  if (msgerPeerName) {
    msgerPeerName.innerHTML = `&nbsp;${name}`;
    msgerPeerName.value = name;
  }
  // refresh also peer video avatar name
  setAvatarImgName(id + "_avatar", myPeerAvatarRecieved);
}

/**
 * Send my Video-Audio-Hand... status
 * @param {*} element
 * @param {*} status
 */
function emitPeerStatus(element, status) {
  signalingSocket.emit("peerStatus", {
    peerConnections: peerConnections,
    room_id: roomId,
    peer_name: myPeerName,
    element: element,
    status: status,
  });
}

/**
 * Set my Hand Status and Icon
 */
function setMyHandStatus() {
  if (handStatus) {
    // Raise hand
    handStatus = false;
    if (!isMobileDevice) {
      tippy(myHandBtn, {
        content: "RAISE your hand",
        placement: "right-start",
      });
    }
  } else {
    // Lower hand
    handStatus = true;
    if (!isMobileDevice) {
      tippy(myHandBtn, {
        content: "LOWER your hand",
        placement: "right-start",
      });
    }
  }
  handStatusIcon.style.display = handStatus ? "inline" : "none";
  emitPeerStatus("hand", handStatus);
}

/**
 * Set My Audio Status Icon and Title
 * @param {*} status
 */
function setMyAudioStatus(status) {
  audioStatusIcon.className = "fas fa-microphone" + (status ? "" : "-slash");
  // send my audio status to all peers in the room
  emitPeerStatus("audio", status);
  tippy(audioStatusIcon, {
    content: status ? "My audio is ON" : "My audio is OFF",
  });
  // only for desktop
  if (!isMobileDevice) {
    tippy(audioBtn, {
      content: status ? "Click to audio OFF" : "Click to audio ON",
      placement: "right-start",
    });
  }
}

/**
 * Set My Video Status Icon and Title
 * https://atomiks.github.io/tippyjs/
 * @param {*} status
 */
function setMyVideoStatus(status) {
  // on vdeo OFF display my video avatar name
  myVideoAvatarImage.style.display = status ? "none" : "block";
  videoStatusIcon.className = "fas fa-video" + (status ? "" : "-slash");
  // send my video status to all peers in the room
  emitPeerStatus("video", status);
  tippy(videoStatusIcon, {
    content: status ? "My video is ON" : "My video is OFF",
  });
  // only for desktop
  if (!isMobileDevice) {
    tippy(videoBtn, {
      content: status ? "Click to video OFF" : "Click to video ON",
      placement: "right-start",
    });
  }
}

/**
 * Set Participant Hand Status Icon and Title
 * @param {*} peer_id
 * @param {*} peer_name
 * @param {*} status
 */
function setPeerHandStatus(peer_id, peer_name, status) {
  let peerHandStatus = document.getElementById(peer_id + "_handStatus");
  peerHandStatus.style.display = status ? "block" : "none";
  // if (status) {
  //   userLog("toast", peer_name + " has raised the hand");
  // }
}

/**
 * Set Participant Audio Status Icon and Title
 * https://atomiks.github.io/tippyjs/
 * @param {*} peer_id
 * @param {*} status
 */
function setPeerAudioStatus(peer_id, status) {
  let peerAudioStatus = document.getElementById(peer_id + "_audioStatus");
  peerAudioStatus.className = "fas fa-microphone" + (status ? "" : "-slash");
  tippy(peerAudioStatus, {
    content: status ? "Participant audio is ON" : "Participant audio is OFF",
  });
}

/**
 * Set Participant Video Status Icon and Title
 * https://atomiks.github.io/tippyjs/
 * @param {*} peer_id
 * @param {*} status
 */
function setPeerVideoStatus(peer_id, status) {
  let peerVideoAvatarImage = document.getElementById(peer_id + "_avatar");
  let peerVideoStatus = document.getElementById(peer_id + "_videoStatus");
  peerVideoStatus.className = "fas fa-video" + (status ? "" : "-slash");
  peerVideoAvatarImage.style.display = status ? "none" : "block";
  tippy(peerVideoStatus, {
    content: status ? "Participant video is ON" : "Participant video is OFF",
  });
}

// ##############################################################################
// SIMPLE COLLABORATIVE WHITEBOARD v1
// ##############################################################################

/**
 * Whiteboard draggable
 */
function setWhiteboardDraggable() {
  dragElement(whiteboardCont, whiteboardHeader);
}

/**
 * Whiteboard Open
 */
function whiteboardOpen() {
  if (!isWhiteboardVisible) {
    setWhiteboardDraggable();
    setColor("#ffffff"); // color picker
    whiteboardCont.style.top = "50%";
    whiteboardCont.style.left = "50%";
    whiteboardCont.style.display = "block";
    isWhiteboardVisible = true;
    drawsize = 3;
    fitToContainer(canvas);
    tippy(whiteboardBtn, {
      content: "CLOSE the whiteboard",
      placement: "right-start",
    });
  }
}

/**
 * Whiteboard close
 */
function whiteboardClose() {
  if (isWhiteboardVisible) {
    whiteboardCont.style.display = "none";
    isWhiteboardVisible = false;
    tippy(whiteboardBtn, {
      content: "OPEN the whiteboard",
      placement: "right-start",
    });
  }
}

/**
 * Whiteboard resize
 */
function whiteboardResize() {
  let content;
  whiteboardCont.style.top = "50%";
  whiteboardCont.style.left = "50%";
  if (isWhiteboardFullscreen) {
    document.documentElement.style.setProperty("--wb-width", "800px");
    document.documentElement.style.setProperty("--wb-height", "600px");
    fitToContainer(canvas);
    whiteboardFsBtn.className = "bi-arrows-fullscreen";
    content = "VIEW full screen";
    isWhiteboardFullscreen = false;
  } else {
    document.documentElement.style.setProperty("--wb-width", "99%");
    document.documentElement.style.setProperty("--wb-height", "99%");
    fitToContainer(canvas);
    whiteboardFsBtn.className = "bi-arrows-fullscreen";
    content = "EXIT full screen";
    isWhiteboardFullscreen = true;
  }
  tippy(whiteboardFsBtn, {
    content: content,
    placement: "bottom",
  });
}

/**
 * Whiteboard clean
 */
function whiteboardClean() {
  if (isWhiteboardVisible) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Set whiteboard color
 * @param {*} newcolor
 */
function setColor(newcolor) {
  color = newcolor;
  drawsize = 3;
  whiteboardColorPicker.value = color;
}

/**
 * Whiteboard eraser
 */
function setEraser() {
  color = "white";
  drawsize = 25;
  whiteboardColorPicker.value = color;
}

/**
 * Clean whiteboard content
 */
function confirmCleanBoard() {
  Swal.fire({
    background: swalBg,
    position: "center",
    title: "Clean the board",
    text: "Are you sure you want to clean the board?",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      whiteboardClean();
      remoteWbAction("clean");
    }
  });
}

/**
 * Draw on whiteboard
 * @param {*} newx
 * @param {*} newy
 * @param {*} oldx
 * @param {*} oldy
 */
function draw(newx, newy, oldx, oldy) {
  ctx.strokeStyle = color;
  ctx.lineWidth = drawsize;
  ctx.beginPath();
  ctx.moveTo(oldx, oldy);
  ctx.lineTo(newx, newy);
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draw Remote whiteboard
 * @param {*} config draw coordinates, color and size
 */
function drawRemote(config) {
  // draw on whiteboard
  if (isWhiteboardVisible) {
    ctx.strokeStyle = config.color;
    ctx.lineWidth = config.size;
    ctx.beginPath();
    ctx.moveTo(config.prevx, config.prevy);
    ctx.lineTo(config.newx, config.newy);
    ctx.stroke();
    ctx.closePath();
  }
}

/**
 * Resize canvas
 * @param {*} canvas
 */
function fitToContainer(canvas) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

/**
 * Handle whiteboard on windows resize
 * here i lose drawing, Todo fix it
 */
function reportWindowSize() {
  fitToContainer(canvas);
}
/**
 * Whiteboard setup
 */
function setupCanvas() {
  fitToContainer(canvas);

  canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = 1;
  });
  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      draw(e.offsetX, e.offsetY, x, y);
      // send draw to other peers in the room
      if (thereIsPeerConnections()) {
        signalingSocket.emit("wb", {
          peerConnections: peerConnections,
          act: "draw",
          newx: e.offsetX,
          newy: e.offsetY,
          prevx: x,
          prevy: y,
          color: color,
          size: drawsize,
        });
      }
      x = e.offsetX;
      y = e.offsetY;
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      isDrawing = 0;
    }
  });

  window.onresize = reportWindowSize;
}

/**
 * Save whiteboard canvas to file as png
 */
function saveWbCanvas() {
  // Improve it if erase something...
  let link = document.createElement("a");
  link.download = getDataTimeString() + "WHITEBOARD.png";
  link.href = canvas.toDataURL();
  link.click();
  link.delete;
}

/**
 * Remote whiteboard actions
 * @param {*} action
 */
function remoteWbAction(action) {
  if (thereIsPeerConnections()) {
    signalingSocket.emit("wb", {
      peerConnections: peerConnections,
      peer_name: myPeerName,
      act: action,
    });
  }
}

/**
 * WEBRCT FILE TRANSFER
 * https://webrtc.github.io/samples/src/content/datachannel/filetransfer/
 * https://github.com/webrtc/samples/blob/gh-pages/src/content/datachannel/filetransfer/js/main.js
 */

/**
 * Create File Sharing Data Channel
 * @param {*} peer_id
 */
function createFileSharingDataChannel(peer_id) {
  fileSharingDataChannels[peer_id] = peerConnections[peer_id].createDataChannel(
    "MSTeams_file_sharing_channel"
  );
  fileSharingDataChannels[peer_id].binaryType = "arraybuffer";
  fileSharingDataChannels[peer_id].addEventListener(
    "open",
    onFSChannelStateChange
  );
  fileSharingDataChannels[peer_id].addEventListener(
    "close",
    onFSChannelStateChange
  );
  fileSharingDataChannels[peer_id].addEventListener("error", onFsError);
}

/**
 * Handle File Sharing
 * @param {*} data
 */
function handleDataChannelFileSharing(data) {
  receiveBuffer.push(data);
  receivedSize += data.byteLength;

  if (receivedSize === incomingFileInfo.fileSize) {
    incomingFileData = receiveBuffer;
    receiveBuffer = [];
    endDownload();
  }
}

/**
 * Handle File Sharing data channel state
 * @param {*} event
 */
function onFSChannelStateChange(event) {
  console.log("onFSChannelStateChange", event.type);
  if (event.type === "close") {
    if (sendInProgress) {
      userLog("error", "File Sharing channel closed");
      sendFileDiv.style.display = "none";
      sendInProgress = false;
    }
    fsDataChannelOpen = false;
    return;
  }
  fsDataChannelOpen = true;
}

/**
 * Handle File sharing data channel error
 * @param {*} event
 */
function onFsError(event) {
  // cleanup
  receiveBuffer = [];
  incomingFileData = [];
  receivedSize = 0;
  sendFileDiv.style.display = "none";
  // Popup what wrong
  if (sendInProgress) {
    console.error("onFsError", event);
    userLog("error", "File Sharing " + event.error);
    sendInProgress = false;
  }
}

/**
 * Send File Data trought datachannel
 */
function sendFileData() {
  console.log(
    "Send file " +
      fileToSend.name +
      " size " +
      bytesToSize(fileToSend.size) +
      " type " +
      fileToSend.type
  );

  sendInProgress = true;

  sendFileInfo.innerHTML =
    "File name: " +
    fileToSend.name +
    "<br>" +
    "File type: " +
    fileToSend.type +
    "<br>" +
    "File size: " +
    bytesToSize(fileToSend.size) +
    "<br>";

  sendFileDiv.style.display = "inline";
  sendProgress.max = fileToSend.size;
  fileReader = new FileReader();
  let offset = 0;

  fileReader.addEventListener("error", (err) =>
    console.error("fileReader error", err)
  );
  fileReader.addEventListener("abort", (e) =>
    console.log("fileReader aborted", e)
  );
  fileReader.addEventListener("load", (e) => {
    if (!sendInProgress || !fsDataChannelOpen) return;

    // peer to peer over DataChannels
    sendFSData(e.target.result);
    offset += e.target.result.byteLength;

    sendProgress.value = offset;
    sendFilePercentage.innerHTML =
      "Send progress: " + ((offset / fileToSend.size) * 100).toFixed(2) + "%";

    // send file completed
    if (offset === fileToSend.size) {
      sendInProgress = false;
      sendFileDiv.style.display = "none";
      userLog(
        "success",
        "The file " + fileToSend.name + " was sent successfully."
      );
    }

    if (offset < fileToSend.size) {
      readSlice(offset);
    }
  });
  const readSlice = (o) => {
    const slice = fileToSend.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  };
  readSlice(0);
}

/**
 * Send Data if channel open
 * @param {*} data fileReader e.target.result
 */
function sendFSData(data) {
  for (let peer_id in fileSharingDataChannels) {
    if (fileSharingDataChannels[peer_id].readyState === "open") {
      fileSharingDataChannels[peer_id].send(data);
    }
  }
}

/**
 * Abort the file transfer
 */
function abortFileTransfer() {
  if (fileReader && fileReader.readyState === 1) {
    fileReader.abort();
    sendFileDiv.style.display = "none";
  }
}

/**
 * Select the File to Share
 */
function selectFileToShare() {
  Swal.fire({
    allowOutsideClick: false,
    background: swalBg,
    imageAlt: "MSTeams-file-sharing",
    //imageUrl: fileSharingImg,
    position: "center",
    title: "Share the file",
    input: "file",
    inputAttributes: {
      accept: fileSharingInput,
      "aria-label": "Select the file",
    },
    showDenyButton: true,
    confirmButtonText: `Send`,
    denyButtonText: `Cancel`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      fileToSend = result.value;
      if (fileToSend && fileToSend.size > 0) {
        // no peers in the room
        if (!thereIsPeerConnections()) {
          userLog("info", "No participants detected");
          return;
        }
        // something wrong channel not open
        if (!fsDataChannelOpen) {
          userLog(
            "error",
            "Unable to Sharing the file, DataChannel seems closed."
          );
          return;
        }
        // send some metadata about our file to peers in the room
        signalingSocket.emit("fileInfo", {
          peerConnections: peerConnections,
          peer_name: myPeerName,
          room_id: roomId,
          file: {
            fileName: fileToSend.name,
            fileSize: fileToSend.size,
            fileType: fileToSend.type,
          },
        });
        // send the File
        setTimeout(() => {
          sendFileData();
        }, 1000);
      } else {
        userLog("error", "File not selected or empty.");
      }
    }
  });
}

/**
 * Start to Download the File
 * @param {*} data file
 */
function startDownload(data) {
  incomingFileInfo = data;
  incomingFileData = [];
  receiveBuffer = [];
  receivedSize = 0;
  let fileToReceiveInfo =
    "incoming file: " +
    incomingFileInfo.fileName +
    " size: " +
    bytesToSize(incomingFileInfo.fileSize) +
    " type: " +
    incomingFileInfo.fileType;
  console.log(fileToReceiveInfo);
  userLog("toast", fileToReceiveInfo);
}

/**
 * The file will be saved in the blob
 * You will be asked to confirm if you want to save it on your PC / Mobile device.
 * https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
function endDownload() {
  // save received file into Blob
  const blob = new Blob(incomingFileData);
  incomingFileData = [];

  // if file is image, show the preview
  if (isImageURL(incomingFileInfo.fileName)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      Swal.fire({
        allowOutsideClick: false,
        background: swalBg,
        position: "center",
        title: "Received file",
        text:
          incomingFileInfo.fileName +
          " size " +
          bytesToSize(incomingFileInfo.fileSize),
        imageUrl: e.target.result,
        imageAlt: "MSTeams-file-img-download",
        showDenyButton: true,
        confirmButtonText: `Save`,
        denyButtonText: `Cancel`,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          saveFileFromBlob();
        }
      });
    };

    reader.readAsDataURL(blob);
  } else {
    // not img file
    Swal.fire({
      allowOutsideClick: false,
      background: swalBg,
      imageAlt: "MSTeams-file-download",

      position: "center",
      title: "Received file",
      text:
        incomingFileInfo.fileName +
        " size " +
        bytesToSize(incomingFileInfo.fileSize),
      showDenyButton: true,
      confirmButtonText: `Save`,
      denyButtonText: `Cancel`,
      showClass: {
        popup: "animate__animated animate__fadeInDown",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        saveFileFromBlob();
      }
    });
  }

  // save to PC / Mobile devices
  function saveFileFromBlob() {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = incomingFileInfo.fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

/**
 * Convert bytes to KB-MB-GB-TB
 * @param {*} bytes
 * @returns size
 */
function bytesToSize(bytes) {
  let sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

/**
 * Mute everyone except yourself
 * Once muted, you won't be able to unmute them, but they can unmute themselves at any time
 */
function muteEveryone() {
  signalingSocket.emit("muteEveryone", {
    peerConnections: peerConnections,
    room_id: roomId,
    peer_name: myPeerName,
  });
}

/**
 * Hide everyone except yourself
 * Once hided, you won't be able to unhide them, but they can unhide themselves at any time
 */
function hideEveryone() {
  signalingSocket.emit("hideEveryone", {
    peerConnections: peerConnections,
    room_id: roomId,
    peer_name: myPeerName,
  });
}

/**
 * Popup the peer_name that do this actions
 * @param {*} peer_name
 */
function setMyAudioOff(peer_name) {
  if (audioStatus === false) return;
  localMediaStream.getAudioTracks()[0].enabled = false;
  audioStatus = localMediaStream.getAudioTracks()[0].enabled;
  audioBtn.className = "fas fa-microphone-slash";
  setMyAudioStatus(audioStatus);
  userLog("toast", peer_name + " has disabled your audio");
}

/**
 * Popup the peer_name that do this actions
 * @param {*} peer_name
 */
function setMyVideoOff(peer_name) {
  if (videoStatus === false) return;
  localMediaStream.getVideoTracks()[0].enabled = false;
  videoStatus = localMediaStream.getVideoTracks()[0].enabled;
  videoBtn.className = "fas fa-video-slash";
  setMyVideoStatus(videoStatus);
  userLog("toast", peer_name + " has disabled your video");
}

/**
 * Mute or Hide everyone except yourself
 * @param {*} element audio/video
 */
function disableAllPeers(element) {
  if (!thereIsPeerConnections()) {
    userLog("info", "No participants detected");
    return;
  }
  Swal.fire({
    background: swalBg,
    position: "center",
    imageAlt: "MSTeams-disable-" + element,

    title:
      element == "audio"
        ? "Mute everyone except yourself?"
        : "Hide everyone except yourself?",
    text:
      element == "audio"
        ? "Once muted, you won't be able to unmute them, but they can unmute themselves at any time."
        : "Once hided, you won't be able to unhide them, but they can unhide themselves at any time.",
    showDenyButton: true,
    confirmButtonText: element == "audio" ? `Mute` : `Hide`,
    denyButtonText: `Cancel`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      switch (element) {
        case "audio":
          muteEveryone();
          break;
        case "video":
          hideEveryone();
          break;
      }
    }
  });
}

/**
 * Kick out confirm
 * @param {*} peer_id
 * @param {*} peerKickOutBtn
 */
function kickOut(peer_id, peerKickOutBtn) {
  let pName = document.getElementById(peer_id + "_name").innerHTML;

  Swal.fire({
    background: swalBg,
    position: "center",
    //imageUrl: confirmImg,
    title: "Kick out " + pName,
    text: "Are you sure you want to kick out this participant?",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // send peer to kick out from room
      signalingSocket.emit("kickOut", {
        room_id: roomId,
        peer_id: peer_id,
        peer_name: myPeerName,
      });
      peerKickOutBtn.style.display = "none";
    }
  });
}

/**
 * Who Kick out you msg popup
 * @param {*} peer_name
 */
function kickedOut(peer_name) {
  let timerInterval;

  Swal.fire({
    allowOutsideClick: false,
    background: swalBg,
    position: "center",
    icon: "warning",
    title: "You will be kicked out!",
    html:
      `<h2 style="color: red;">` +
      peer_name +
      `</h2> will kick out you after <b style="color: red;"></b> milliseconds.`,
    timer: 10,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
      timerInterval = setInterval(() => {
        const content = Swal.getHtmlContainer();
        if (content) {
          const b = content.querySelector("b");
          if (b) {
            b.textContent = Swal.getTimerLeft();
          }
        }
      }, 100);
    },
    willClose: () => {
      clearInterval(timerInterval);
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then(() => {
    window.location.href = "/dashboard";
  });
}

/**
 * Leave the Room and create a new one
 * https://sweetalert2.github.io
 */
function leaveRoom() {
  Swal.fire({
    background: swalBg,
    position: "center",
    title: "Leave this room ?",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/dashboard";
    }
  });
}

/**
 * Basic user logging
 * https://sweetalert2.github.io
 * @param {*} type
 * @param {*} message
 */
function userLog(type, message) {
  switch (type) {
    case "error":
      Swal.fire({
        background: swalBg,
        position: "center",
        icon: "error",
        title: "Oops...",
        text: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "info":
      Swal.fire({
        background: swalBg,
        position: "center",
        icon: "info",
        title: "Info",
        text: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "success":
      Swal.fire({
        background: swalBg,
        position: "center",
        icon: "success",
        title: "Success",
        text: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "success-html":
      Swal.fire({
        background: swalBg,
        position: "center",
        icon: "success",
        title: "Success",
        html: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "toast":
      const Toast = Swal.mixin({
        background: swalBg,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      Toast.fire({
        icon: "info",
        title: message,
      });
      break;
    // ......
    default:
      alert(message);
  }
}

/**
 * Show-Hide all elements grp by class name
 * @param {*} className
 * @param {*} displayState
 */
function toggleClassElements(className, displayState) {
  let elements = document.getElementsByClassName(className);
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = displayState;
  }
}
