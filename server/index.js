// ====== IMPORTACOES ======
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const multer = require("multer");
const methodOverride = require("method-override"); // para simular PUT e DELETE
const { Server } = require("socket.io");
const setupSocket = require("./managers/game/socketManager.js"); // socket
const expressLayouts = require("express-ejs-layouts"); // para ter um layout base (footer, header e head no caso)
require("dotenv").config();
//variaveis passaport
const passport = require("passport");
const localStrategy = require("passport-local");
const session = require("express-session");
const user = require("./models/users.js").UserInfo;
const path = require("path"); //===================================

// ====== INICIALIZACAO ======
const app = express(); // inicia o servidor express
const SERVER_PORT = process.env.PORT; // porta do server
const server = http.createServer(app); // cria um server HTTP

// ======  ======
app.set("views", path.join(__dirname, "../client/views")); //
app.use(express.static(path.join(__dirname, "../client/public"))); // 

// ====== VIEW ENGINE & LAYOUT ======
app.set("view engine", "ejs"); // define a view engine para "ejs" (evita ter que andar a colocar .ejs)
app.use(expressLayouts); // middleware para ter um layout base e não ter que andar a repetir código (tipo footer, header, etc)


// ====== MIDDLEWARES GERAIS ======
//app.use(express.static(__dirname + "/public")); // middleware que torna arquivos estáticos (imagens, js, css, etc.) acessíveis no browser (por exemplo, http://localhost:3000/css/style.css)
app.use(express.urlencoded({ extended: true })); // middleware que analisa os dados enviados via formulário HTML (POST ou PUT) e converte para um objeto req.body (por exemplo, se um formulario enviar name=Albuquerque&age=63, o req.body terá: {name: "Albuquerque", age: "63"}
app.use(express.json()); // middleware para meter os dados JSON (POST ou PUT) num objeto req.body
app.use(methodOverride("_method")); // middleware que permite que formulários HTML simulem requisições PUT e DELETE (útil porque o HTML padrão só suporta GET e POST: input type="hidden" name="_method" value="DELETE"> fará um DELETE em vez de POST)


// ====== SESSÃO & AUTENTICAÇÃO ======
app.use( // express-session middleware 
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session()); // para restaurar a sessao, permite manter a autenticação
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser()); // guarda um utilizador na sessão
passport.deserializeUser(user.deserializeUser()); // retira um utilizador na sessão

// ====== ROUTES ======
const routes = [
    "indexRoute",
    "aboutUsRoute",
    "AIChatRoute",
    "howToPlayRoute",
    "statisticsRoute",
    "brainstormingRoute",
    "loginRoute",
    "myAccountRoute",
    "preGameRoute",
    "profileRoute",
    "rankingsRoute",
    "waitingRoomRoute",
    "errorRoute",
    "gameRoute",
    "lastGamesRoute",
    "footerQuoteRoute"
];


routes.forEach((route) => {
    app.use(require(`./routes/${route}`));
});


// ====== MONGODB ======
mongoose
    .connect(process.env.DB_URL)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("ERROR: ", err);
    });

// ====== SOCKET.IO ======
const io = new Server(server);
setupSocket(io); // 

// ====== UPLOAD DE FOTOS ======
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../client/public/images/playerProfile"));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: "O ficheiro não foi carregado" });
});

// ====== SERVIDOR ======
server.listen(SERVER_PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", SERVER_PORT);
});
