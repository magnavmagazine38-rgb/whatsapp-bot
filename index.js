const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ WhatsApp Bot Connected!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ WhatsApp logged out.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const message = text.toLowerCase().trim();

    if (message === "hi" || message === "hello") {
      await sock.sendMessage(jid, {
        text: "Assalam o Alaikum 👋\nMain WhatsApp Bot hoon 🤖"
      });
    }

    if (message === "menu") {
      await sock.sendMessage(jid, {
        text:
          "🤖 *BOT MENU*\n\n" +
          "1. hi\n" +
          "2. menu\n" +
          "3. ping\n\n" +
          "Command bhejein."
      });
    }

    if (message === "ping") {
      await sock.sendMessage(jid, {
        text: "🏓 Pong!"
      });
    }
  });
}

startBot();
