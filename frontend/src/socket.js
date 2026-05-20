import { io } from "socket.io-client";
import axios from "axios";
import API from "../api";

const socket = io(
  `${API}`
);

export default socket;