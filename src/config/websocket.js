const WebSocket = require("ws");
const handleSocket = require("../handlers/socketHandlers");

function setupWebSocketServer() {
  const wss = new WebSocket.Server({ port: 7777 }, () => {
    console.log("🟢 Servidor WebSocket escutando na porta 7777");
  });

  wss.on("connection", (ws, req) => {
    console.log("🔗 Novo cliente conectado");
    handleSocket(ws);
  });
}

module.exports = { setupWebSocketServer };
