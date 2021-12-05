import { app } from "./app";

const port = 3000;

app.listen(port, () => {
  console.log(`TS with Express http://localhost:${port}`);
});
