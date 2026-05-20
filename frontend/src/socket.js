import { io } from "socket.io-client";

const socket = io(
  `${API}`
);

export default socket;