import cors from "cors";
import express from "express";
import http from "http";

import { ENV } from "./configs/env";
import SocketServer from "./real-time/socket.server";
import v1_router from "./routers/v1/router.v1";
import InitService from "./services/service.init";
import RedisService from "./services/service.redis";

export const server_services = new InitService();
await RedisService.connect();

const app = express();
const server = http.createServer(app);

app.use(
    cors({
        origin: [ENV.SERVER_WEB_URL, ENV.SERVER_ADMIN_URL],
        credentials: true,
    }),
);
app.use(express.json());
app.use("/api/v1", v1_router);

new SocketServer(server);

server.listen(ENV.SERVER_PORT, () => {
    console.log("server listening on: ", ENV.SERVER_PORT);
});
