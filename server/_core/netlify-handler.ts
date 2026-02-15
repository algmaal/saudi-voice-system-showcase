import serverless from "serverless-http";
import { createExpressApp } from "./app";

const app = createExpressApp();

export const handler = serverless(app);
