// Armazena as conexões ativas do app
const appConnections = new Set();

module.exports = function handleAppSocket(ws) {
  console.log("📱 App conectado");

  // Adiciona a conexão do app ao conjunto de conexões ativas
  appConnections.add(ws);

  ws.send(
    JSON.stringify({
      type: "connection",
      message: "🔗 Conectado ao servidor de sensores",
      timestamp: new Date().toISOString(),
    })
  );

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      console.log("📩 Mensagem recebida do app:", data);

      // Responde a mensagens específicas do app
      switch (data.type) {
        case "ping":
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "request_sensor_data":
          ws.send(
            JSON.stringify({
              type: "info",
              message: "🔍 Aguardando dados do sensor MQ4...",
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "info",
              message: "ℹ️ Comando não reconhecido",
              timestamp: new Date().toISOString(),
            })
          );
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem do app:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Erro ao processar mensagem",
          timestamp: new Date().toISOString(),
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("📱 App desconectado");
    appConnections.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("❌ Erro na conexão do app:", error);
    appConnections.delete(ws);
  });
};

// Função para enviar dados do MQ4 para todos os apps conectados
function broadcastMQ4DataToApps(sensorData) {
  const message = JSON.stringify({
    type: "sensor_data",
    sensor: "MQ4",
    data: sensorData,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `📡 Enviando dados do MQ4 para ${appConnections.size} app(s) conectado(s)`
  );

  // Envia para todos os apps conectados
  appConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    } else {
      // Remove conexões fechadas
      appConnections.delete(ws);
    }
  });
}

// Função para verificar se há apps conectados
function hasConnectedApps() {
  return appConnections.size > 0;
}

module.exports.broadcastMQ4DataToApps = broadcastMQ4DataToApps;
module.exports.hasConnectedApps = hasConnectedApps;
