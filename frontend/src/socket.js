import { io } from "socket.io-client";

const API = "https://save-money-yyv1.onrender.com";

const socket = io(API, {
  transports: ["websocket"],
});

export default socket;