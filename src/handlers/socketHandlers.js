module.exports = function handleSocket(ws) {
  ws.send("👋 Conexão estabelecida com o servidor!");

  ws.on("message", (msg) => {
    console.log("📩 Mensagem recebida do cliente:", msg.toString());

    // Simula handshake simples
    if (msg.toString().includes("mq4")) {
      ws.send("✅ Dado do sensor recebido com sucesso");
    } else {
      ws.send("ℹ️ Mensagem genérica recebida");
    }
  });

  ws.on("close", () => {
    console.log("🔌 Cliente desconectado");
  });
};
