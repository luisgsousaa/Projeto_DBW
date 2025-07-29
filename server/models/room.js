// models/room.js

const mongoose = require("mongoose");

/**
 * Esquema para representar uma mensagem no chat da sala
 * Cada mensagem tem:
 * - username: quem enviou
 * - message: o conteúdo textual
 * - timestamp: data/hora de envio
 */
const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

/**
 * Esquema principal para representar uma sala de jogo
 * Armazena dados do estado da sala, dos jogadores e do jogo em si
 */
const roomSchema = new mongoose.Schema({
    /** Tema do brainstorming */
    tema: String,
    /** Duração do brainstorming */
    tempo: Number,
    /** Número máximo de jogadores permitidos na sala */
    maxPlayers: Number,
    /**
     * Lista de jogadores atualmente na sala
     */
    players: [{
        username: String,
        socket_id: String,
    }, ],
    /**
     * Histórico de mensagens trocadas no chat da sala
     */
    messages: [messageSchema],
     /** Nome do utilizador que criou a sala (não necessariamente o admin atual) */
    creator_username: String,
    /** Nome do jogador que tem permissões de admin na sala */
    admin_username: String,
    /**
     * Lista de usernames que têm permissão para reentrar na sala se por exemplo desconectarem-se e quererem voltar
     * Evita que jogadores que nao começaram o jogo entrem
     */
    allowed_reentries: {
        type: [String],
        default: []
    },
    /**
     * Flag que indica se o jogo já foi iniciado ou não
     * Serve para bloquear entrada de novos jogadores após início do jogo
     */
    game_started: {
        type: Boolean,
        default: false
    },
    /**
     * Representa o estado atual do jogo
     * É usado para decidir que partial carregar no front-end
     * Ex: "waitingRoom", "brainstorming", etc.
     */
    game_state: String,

});

const Room = mongoose.model("Room", roomSchema); // cria modelo

module.exports = Room;