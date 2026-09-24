const http = require("http");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

// Render ke liye simple web server
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WhatsApp Bot is running! 🤖");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server running on port ${PORT}`);
  });

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["WhatsApp Bot", "Chrome", "1.0.0"],
  });

  // Login/session save
  sock.ev.on("creds.update", saveCreds);

  // WhatsApp connection
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("=================================");
      console.log("✅ WhatsApp Bot Connected!");
      console.log("🤖 Bot is now online");
      console.log("=================================");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("🔄 WhatsApp disconnected.");
        console.log("🔄 Reconnecting...");
        setTimeout(startBot, 5000);
      } else {
        console.log("❌ WhatsApp logged out.");
        console.log("Please login again.");
      }
    }
  });

  // Messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg || !msg.message) return;

      // Bot apne messages ka reply na kare
      if (msg.key.fromMe) return;

      const jid = msg.key.remoteJid;

      if (!jid) return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      const message = text.trim().toLowerCase();

      console.log(`📩 Message: ${text}`);

      // =========================
      // HI / HELLO
      // =========================

      if (
        message === "hi" ||
        message === "hello" ||
        message === "hey" ||
        message === "salam" ||
        message === "assalamualaikum"
      ) {
        await sock.sendMessage(jid, {
          text:
            "👋 Assalam o Alaikum!\n\n" +
            "🤖 Main WhatsApp Bot hoon.\n\n" +
            "Menu dekhne ke liye *menu* likhein.",
        });
      }

      // =========================
      // MENU
      // =========================

      else if (message === "menu") {
        await sock.sendMessage(jid, {
          text:
            "╭━━━ 🤖 BOT MENU ━━━╮\n\n" +
            "👉 *hi* - Greeting\n" +
            "👉 *menu* - Menu\n" +
            "👉 *ping* - Bot status\n" +
            "👉 *owner* - Owner information\n" +
            "👉 *help* - Help\n\n" +
            "╰━━━━━━━━━━━━━━━━╯",
        });
      }

      // =========================
      // PING
      // =========================

      else if (message === "ping") {
        await sock.sendMessage(jid, {
          text: "🏓 Pong!\n\n✅ Bot is online.",
        });
      }

      // =========================
      // OWNER
      // =========================

      else if (message === "owner") {
        await sock.sendMessage(jid, {
          text:
            "👤 *Bot Owner*\n\n" +
            "Owner: Saif\n" +
            "🤖 WhatsApp Bot",
        });
      }

      // =========================
      // HELP
      // =========================

      else if (message === "help") {
        await sock.sendMessage(jid, {
          text:
            "🆘 *Help*\n\n" +
            "Available commands:\n\n" +
            "• hi\n" +
            "• menu\n" +
            "• ping\n" +
            "• owner\n" +
            "• help",
        });
      }
    } catch (error) {
      console.log("❌ Message error:", error);
    }
  });
}

// Start bot
startBot().catch((error) => {
  console.error("❌ Bot startup error:", error);
});
