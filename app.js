import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType
} from "discord-interactions";
import { VerifyDiscordRequest } from "./utils.js";
import {
  Client,
  GatewayIntentBits
} from "discord.js";

const TimerRegex = new RegExp(/.*?remind (?<target>.+?) in (?<rand>a while)? ?(?<years>[0-9]+ year)?s? ?(?<months>[0-9]+ month)?s? ?(?<weeks>([0-9]+|a) week)?s? ?(?<days>([0-9]+|a) day)?s? ?(?<hours>([0-9]+|an) hour)?s? ?(?<minutes>[0-9]+ minute)?s? ?(?<seconds>[0-9]+ seconds)?.*?(?<prep>[^ ]+) (?<reason>.+)/, "i");
const Timer2Regex = new RegExp(/.*?remind (?<target>.+?) (?<prep>[^ ]+) (?<reason>.+?) in (?<years>[0-9]+ year)?s? ?(?<months>[0-9]+ month)?s? ?(?<weeks>[0-9]+ week)?s? ?(?<days>[0-9]+ day)?s? ?(?<hours>[0-9]+ hour)?s? ?(?<minutes>[0-9]+ minute)?s? ?(?<seconds>[0-9]+ seconds)?/, "i");
const TimerOnRegex = new RegExp(/.*?remind (?<target>.+?) (?<prep>[^ ]+) (?<reason>.+?) at (?<time>[0-9]+:[0-9]{2} ?(am|pm)? ?(\\+[0-9\\.]+|\\-[0-9\\.]+)?)( on (?<date>[0-9]+(\/|-)[0-9]+(\/|-)[0-9]+))?/, "i");
const TimerOn2Regex = new RegExp(/.*?remind (?<target>.+?) at (?<time>[0-9]+:[0-9]{2} ?(am|pm)? ?(\\+[0-9:\\.]+|\\-[0-9:\\.]+)?)( on (?<date>[0-9]+(\/|-)[0-9]+(\/|-)[0-9]+))? ?(?<prep>[^ ]+) (?<reason>.+)/, "i");
const TimerDateCheckRegex = new RegExp(/^on [0-9]+(\/|-)[0-9]+(\/|-)[0-9]+/, "i");

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

client.on("messageCreate", async (m) => {
  console.log(m);
  let msg = m.Content;
  let query = m.Query;

  if (msg !== null && msg.toLowerCase().includes("remind "))
  {
    let timerAtMatch = msg.match(TimerOnRegex);
    let timerAt2Match = msg.match(TimerOn2Regex);
    let timerMatch = msg.match(TimerRegex);
    let timer2Match = msg.match(Timer2Regex);

    if (timerAtMatch !== null)
    {
      let success = false;
      success, query = TryParseAbsoluteReminder(timerAtMatch, m);

      if (success)
      {
        command = "timer";
      }
    }
    else if (timerAt2Match !== null)
    {
      success, query = TryParseAbsoluteReminder(timerAt2Match, m);

      if (success)
      {
        command = "timer";
      }
    }
    else if (timerMatch !== null || timer2Match !== null)
    {
      console.log(timerMatch);
      let matchToUse = timerMatch !== null && !timerMatch[0]["prep"]
    }
  }
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

function TryParseAbsoluteReminder(timerMatch, messageData)
{

}
