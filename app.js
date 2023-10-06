import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType
} from "discord-interactions";
import { VerifyDiscordRequest } from "./utils.js";
import {
  Client,
  GatewayIntentBits,
  GuildScheduledEventManager,
  CDN
} from "discord.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const token = process.env.DISCORD_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.login(token);

client.on("guildMessageCreate", async (msg) => {
  console.log("CRE");
  console.log(m);
});

app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  // Handle verification requests
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
