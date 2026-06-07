import express from "express";
import v1_router from "./routes/v1";
import Init from "./services/init";

Init();

const app = express();

app.use(express.json());

app.use("/agent/v1", v1_router);

app.listen();
