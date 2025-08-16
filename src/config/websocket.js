const WebSocket = require("ws");
const handleAppSocket = require("../handlers/sockerAppHandlers");
const handleEspSocket = require("../handlers/socketEspHandlers");

function setupWebSocketServer() {
  const wss = new WebSocket.Server({ port: 7777 }, () => {
    console.log("🟢 Servidor WebSocket escutando na porta 7777");
  });

  wss.on("connection", (ws, req) => {
    console.log("🔗 Nova conexão estabelecida");

    // Analisa o User-Agent ou query parameters para distinguir cliente
    const userAgent = req.headers["user-agent"] || "";
    const url = new URL(req.url, `http://${req.headers.host}`);
    const clientType = url.searchParams.get("client") || "";

    console.log("🔍 Analisando cliente:");
    console.log("  - User-Agent:", userAgent);
    console.log("  - Client Type:", clientType);
    console.log("  - URL:", req.url);

    // Determina o tipo de cliente e usa o handler apropriado
    if (
      clientType === "esp32" ||
      userAgent.includes("ESP32") ||
      userAgent.includes("esp") ||
      userAgent.includes("arduino")
    ) {
      console.log("🔧 Identificado como ESP32 - usando handler de ESP");
      handleEspSocket(ws);
    } else if (
      clientType === "app" ||
      userAgent.includes("mobile") ||
      userAgent.includes("app") ||
      userAgent.includes("android") ||
      userAgent.includes("Mozilla") ||
      userAgent.includes("okhttp")
    ) {
      console.log("📱 Identificado como APP - usando handler de app");
      handleAppSocket(ws);
    } else {
      // Por padrão, aguarda identificação via primeira mensagem
      console.log("❓ Cliente não identificado - aguardando primeira mensagem");

      let handlerAssigned = false;

      const messageHandler = (msg) => {
        if (handlerAssigned) return;

        const messageStr = msg.toString().toLowerCase();

        if (
          messageStr.includes("app_connect") ||
          messageStr.includes("mobile")
        ) {
          console.log("📱 Cliente identificado como APP via mensagem");
          handlerAssigned = true;
          ws.removeListener("message", messageHandler);
          handleAppSocket(ws);
        } else if (
          messageStr.includes("esp") ||
          messageStr.includes("mq4") ||
          messageStr.includes("sensor")
        ) {
          console.log("🔧 Cliente identificado como ESP32 via mensagem");
          handlerAssigned = true;
          ws.removeListener("message", messageHandler);
          handleEspSocket(ws);
        } else {
          // Se não conseguir identificar, assume como ESP32 por compatibilidade
          console.log("🔧 Cliente não identificado - assumindo como ESP32");
          handlerAssigned = true;
          ws.removeListener("message", messageHandler);
          handleEspSocket(ws);
        }
      };

      ws.on("message", messageHandler);

      // Timeout para forçar identificação
      setTimeout(() => {
        if (!handlerAssigned) {
          console.log("⏰ Timeout de identificação - assumindo como ESP32");
          handlerAssigned = true;
          ws.removeListener("message", messageHandler);
          handleEspSocket(ws);
        }
      }, 5000);
    }
  });

  return wss;
}

module.exports = { setupWebSocketServer };
