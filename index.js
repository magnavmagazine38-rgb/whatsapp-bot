const http = require("http");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("WhatsApp Bot is running! 🤖");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || "")
  .replace(/\D/g, "");

let pairingRequested = false;

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({
      level: "silent"
    }),
    browser: [
      "WhatsApp Bot",
      "Chrome",
      "1.0.0"
    ]
  });

  sock.ev.on("creds.update", saveCreds);

  // WhatsApp pairing code
  if (
    !state.creds.registered &&
    PAIRING_NUMBER &&
    !pairingRequested
  ) {

    pairingRequested = true;

    setTimeout(async () => {

      try {

        const code =
          await sock.requestPairingCode(
            PAIRING_NUMBER
          );

        console.log("");
        console.log("==============================");
        console.log("WHATSAPP PAIRING CODE:");
        console.log(code);
        console.log("==============================");
        console.log("");

      } catch (error) {

        pairingRequested = false;

        console.error(
          "Pairing code error:",
          error.message
        );
      }

    }, 3000);
  }

  // Connection status
  sock.ev.on(
    "connection.update",
    ({ connection, lastDisconnect }) => {

      if (connection === "open") {

        console.log("");
        console.log("==============================");
        console.log("✅ WHATSAPP BOT CONNECTED!");
        console.log("==============================");
        console.log("");
      }

      if (connection === "close") {

        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        if (
          statusCode !==
          DisconnectReason.loggedOut
        ) {

          console.log(
            "🔄 WhatsApp disconnected."
          );

          console.log(
            "🔄 Reconnecting..."
          );

          pairingRequested = false;

          setTimeout(
            startBot,
            5000
          );

        } else {

          console.log(
            "❌ WhatsApp logged out."
          );
        }
      }
    }
  );

  // Incoming messages
  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg?.message) return;

        if (msg.key.fromMe) return;

        const jid =
          msg.key.remoteJid;

        if (!jid) return;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          "";

        const message =
          text.trim().toLowerCase();

        console.log(
          `📩 Message: ${text}`
        );

        // HI
        if (
          [
            "hi",
            "hello",
            "hey",
            "salam",
            "assalamualaikum"
          ].includes(message)
        ) {

          await sock.sendMessage(jid, {
            text:
              "👋 Assalam o Alaikum!\n\n" +
              "🤖 Main WhatsApp Bot hoon.\n\n" +
              "*menu* likhein."
          });
        }

        // MENU
        else if (message === "menu") {

          await sock.sendMessage(jid, {
            text:
              "╭━━━ 🤖 BOT MENU ━━━╮\n\n" +
              "👉 *hi* - Greeting\n" +
              "👉 *menu* - Menu\n" +
              "👉 *ping* - Bot status\n" +
              "👉 *owner* - Owner information\n" +
              "👉 *help* - Help\n\n" +
              "╰━━━━━━━━━━━━━━━━╯"
          });
        }

        // PING
        else if (message === "ping") {

          await sock.sendMessage(jid, {
            text:
              "🏓 Pong!\n\n" +
              "✅ Bot is online."
          });
        }

        // OWNER
        else if (message === "owner") {

          await sock.sendMessage(jid, {
            text:
              "👤 *Bot Owner*\n\n" +
              "Owner: Saif\n" +
              "🤖 WhatsApp Bot"
          });
        }

        // HELP
        else if (message === "help") {

          await sock.sendMessage(jid, {
            text:
              "🆘 *Help*\n\n" +
              "Available commands:\n\n" +
              "• hi\n" +
              "• menu\n" +
              "• ping\n" +
              "• owner\n" +
              "• help"
          });
        }

      } catch (error) {

        console.error(
          "Message error:",
          error.message
        );
      }
    }
  );
}

// Start bot
startBot().catch((error) => {

  console.error(
    "❌ Bot startup error:",
    error
  );

});
