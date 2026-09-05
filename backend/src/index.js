const cors =  require( "cors");
const express = require("express");
// const path  =require('path')
// require("dotenv").config({
  //   path:path.join(__dirname , '../.env')
// });
require("dotenv").config();
const main = require("./config/db.js");
const cookieParser = require("cookie-parser");
// Routers

const authRouter = require("./routes/authRouter.js");
// const executeRouter = require("./routes/execute.js");
const problemRouter = require("./routes/problemRouter.js");
const codeRouter = require("./routes/codeRouter.js");
   const chatRouter = require('./routes/chatRouter.js');
const userRouter = require("./routes/userRouter.js");
const topicRouter = require("./routes/topicRouter.js");
const quizRouter = require("./routes/quizRouter.js");
// express instance
const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    // origin: "*", => means any one can access
    credentials: true,
  }),
);




// middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));app.use(cookieParser());




const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/problem", problemRouter);
apiRouter.use("/code", codeRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/topic", topicRouter);
apiRouter.use("/quiz", quizRouter);

app.use(apiRouter);
app.use("/api", apiRouter);
main()
  .then(() => {
    console.log(process.env.PORT);

    app.listen(process.env.PORT, () => {
      console.log(
        `Server is listening on http://localhost:` + process.env.PORT,
      );
      
    });
  })
  .catch((err) => {
    console.log(`Error` + err.message);
  });
