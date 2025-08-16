const {
  broadcastMQ4DataToApps,
  hasConnectedApps,
} = require("./sockerAppHandlers");

module.exports = function handleEspSocket(ws) {
  console.log("🔧 ESP32 conectado");

  ws.send("👋 Conexão estabelecida com o servidor!");

  ws.on("message", (msg) => {
    const messageStr = msg.toString();
    console.log("📩 Mensagem recebida do ESP32:", messageStr);

    try {
      // Verifica se a mensagem contém dados do sensor MQ4
      if (messageStr.includes("mq4") || messageStr.includes("MQ4")) {
        let sensorData;

        try {
          // Tenta fazer parse JSON da mensagem
          sensorData = JSON.parse(messageStr);
        } catch (parseError) {
          // Se não for JSON, trata como valor simples
          const match = messageStr.match(/mq4[:\s]*([0-9.]+)/i);
          if (match) {
            sensorData = {
              value: parseFloat(match[1]),
              unit: "ppm",
              raw: messageStr,
            };
          } else {
            sensorData = {
              raw: messageStr,
              parsed: false,
            };
          }
        }

        console.log("🎯 Dados do sensor MQ4 processados:", sensorData);

        // Envia confirmação para o ESP32
        ws.send("✅ Dado do sensor MQ4 recebido com sucesso");

        // Se há apps conectados, envia os dados para eles
        if (hasConnectedApps()) {
          broadcastMQ4DataToApps(sensorData);
          console.log("📱 Dados do MQ4 enviados para os apps conectados");
        } else {
          console.log(
            "📱 Nenhum app conectado - dados do MQ4 não retransmitidos"
          );
        }
      } else {
        // Mensagem genérica
        console.log("ℹ️ Mensagem genérica do ESP32:", messageStr);
        ws.send("ℹ️ Mensagem genérica recebida");
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem do ESP32:", error);
      ws.send("❌ Erro ao processar dados");
    }
  });

  ws.on("close", () => {
    console.log("� ESP32 desconectado");
  });

  ws.on("error", (error) => {
    console.error("❌ Erro na conexão do ESP32:", error);
  });
};
