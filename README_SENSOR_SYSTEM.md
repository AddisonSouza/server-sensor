# Sistema de Sensores - MQ4 para App

## Visão Geral

Este sistema permite que dados do sensor MQ4 (ESP32) sejam retransmitidos para aplicativos móveis conectados via WebSocket.

## Como Funciona

### 1. Conexões

- **ESP32**: Envia dados do sensor MQ4
- **App Mobile**: Recebe dados do sensor em tempo real

### 2. Identificação de Clientes

O servidor identifica automaticamente o tipo de cliente através de:

#### Método 1: Query Parameters

```
ws://localhost:7777?client=app     # Para apps
ws://localhost:7777?client=esp32   # Para ESP32
```

#### Método 2: User-Agent

- Apps: User-Agent contendo "mobile" ou "app"
- ESP32: User-Agent contendo "ESP32" ou "esp"

#### Método 3: Primeira Mensagem

- Apps: Enviar mensagem contendo "app_connect" ou "mobile"
- ESP32: Enviar dados do sensor ou mensagem contendo "esp", "mq4", "sensor"

### 3. Protocolo de Comunicação

#### ESP32 → Servidor

```javascript
// Formato JSON (recomendado)
{
  "sensor": "MQ4",
  "value": 150.5,
  "unit": "ppm",
  "timestamp": "2025-08-16T10:30:00Z"
}

// Formato simples
"mq4: 150.5"
"MQ4 value: 150.5 ppm"
```

#### Servidor → App

```javascript
{
  "type": "sensor_data",
  "sensor": "MQ4",
  "data": {
    "value": 150.5,
    "unit": "ppm",
    "raw": "mq4: 150.5"
  },
  "timestamp": "2025-08-16T10:30:15.123Z"
}
```

#### App → Servidor

```javascript
// Ping/Pong
{
  "type": "ping"
}

// Solicitar dados do sensor
{
  "type": "request_sensor_data"
}
```

### 4. Exemplo de Uso

#### Conectar App

```javascript
const ws = new WebSocket("ws://localhost:7777?client=app");

ws.onopen = () => {
  console.log("Conectado ao servidor");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "sensor_data") {
    console.log("Dados do MQ4:", data.data.value, data.data.unit);
    // Atualizar UI com os dados do sensor
  }
};
```

#### ESP32 (Arduino)

```cpp
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

void setup() {
  webSocket.begin("192.168.1.100", 7777, "/?client=esp32");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  float mq4Value = analogRead(A0) * (5.0 / 1023.0);

  String jsonData = "{\"sensor\":\"MQ4\",\"value\":" + String(mq4Value) + ",\"unit\":\"ppm\"}";
  webSocket.sendTXT(jsonData);

  delay(1000);
}
```

## Logs do Sistema

O servidor fornece logs detalhados:

```
🟢 Servidor WebSocket escutando na porta 7777
🔗 Nova conexão estabelecida
📱 Identificado como APP - usando handler de app
📱 App conectado
🔗 Nova conexão estabelecida
🔧 Identificado como ESP32 - usando handler de ESP
🔧 ESP32 conectado
📩 Mensagem recebida do ESP32: {"sensor":"MQ4","value":142.3,"unit":"ppm"}
🎯 Dados do sensor MQ4 processados: {value: 142.3, unit: "ppm"}
📡 Enviando dados do MQ4 para 1 app(s) conectado(s)
📱 Dados do MQ4 enviados para os apps conectados
```

## Tratamento de Erros

- Conexões são automaticamente removidas quando fechadas
- Dados malformados são tratados graciosamente
- Timeout de 5 segundos para identificação de cliente
- Fallback para ESP32 quando não identificado

## Segurança

Para produção, considere adicionar:

- Autenticação via token
- Rate limiting
- Validação de origem
- HTTPS/WSS
