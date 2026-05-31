import http from "http";
import express from "express";
import { env } from "./configs/env";
import RedisService from "./services/service.redis";

await RedisService.connect();

const app = express();
const server = http.createServer(app);

server.listen(env.SERVER_PORT, () => {
    console.log("server listening on: ", env.SERVER_PORT);
});
