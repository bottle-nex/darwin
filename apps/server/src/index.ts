import http from "http";
import express from "express";
import cors from "cors";
import v1_router from "./routers/v1/router.v1";
import { ENV } from "./configs/env";
import RedisService from "./services/service.redis";
import E2B from "./sandbox/e2b";

await RedisService.connect();
await E2B.create()

const app = express();
const server = http.createServer(app);

app.use(
    cors({
        origin: ENV.SERVER_WEB_URL,
        credentials: true,
    }),
);
app.use(express.json());
app.use("/api/v1", v1_router);

server.listen(ENV.SERVER_PORT, () => {
    console.log("server listening on: ", ENV.SERVER_PORT);
});
