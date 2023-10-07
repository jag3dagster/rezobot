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

const ONEMINUTE = 60;
const ONEHOUR = ONEMINUTE * 60;
const ONEDAY = ONEHOUR * 24;
const ONEWEEK = ONEDAY * 7;
const ONEMONTH = ONEDAY * 31;
const ONEYEAR = ONEDAY * 365;
const TOOSHORT = 10;
const TOOLONG = 315360000;

const TimerRegex = new RegExp(/.*?remind (?<target>.+?) in (?<rand>a while)? ?(?<years>[0-9]+ year)?s? ?(?<months>[0-9]+ month)?s? ?(?<weeks>([0-9]+|a) week)?s? ?(?<days>([0-9]+|a) day)?s? ?(?<hours>([0-9]+|an) hour)?s? ?(?<minutes>[0-9]+ minute)?s? ?(?<seconds>[0-9]+ seconds)?.*?(?<prep>[^ ]+) (?<reason>.+)/, "i");
const Timer2Regex = new RegExp(/.*?remind (?<target>.+?) (?<prep>[^ ]+) (?<reason>.+?) in (?<years>[0-9]+ year)?s? ?(?<months>[0-9]+ month)?s? ?(?<weeks>[0-9]+ week)?s? ?(?<days>[0-9]+ day)?s? ?(?<hours>[0-9]+ hour)?s? ?(?<minutes>[0-9]+ minute)?s? ?(?<seconds>[0-9]+ seconds)?/, "i");
const TimerOnRegex = new RegExp(/.*?remind (?<target>.+?) (?<prep>[^ ]+) (?<reason>.+?) at (?<time>[0-9]+:[0-9]{2} ?(am|pm)? ?(\\+[0-9\\.]+|\\-[0-9\\.]+)?)( on (?<date>[0-9]+(\/|-)[0-9]+(\/|-)[0-9]+))?/, "i");
const TimerOn2Regex = new RegExp(/.*?remind (?<target>.+?) at (?<time>[0-9]+:[0-9]{2} ?(am|pm)? ?(\\+[0-9:\\.]+|\\-[0-9:\\.]+)?)( on (?<date>[0-9]+(\/|-)[0-9]+(\/|-)[0-9]+))? ?(?<prep>[^ ]+) (?<reason>.+)/, "i");
const TimerDateCheckRegex = new RegExp(/^on [0-9]+(\/|-)[0-9]+(\/|-)[0-9]+/, "i");
const DigitCheckRegex = /^\d+$/;

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
  let msg = m.content;
  let query = m.query;
  let command = m.command;

  if (command === undefined || command === null || command === "")
  {
    if (msg !== null && msg.toLowerCase().includes("remind "))
    {
      let timerMatch = msg.match(TimerRegex);
      let timer2Match = msg.match(Timer2Regex);
      let timerAtMatch = msg.match(TimerOnRegex);
      let timerAt2Match = msg.match(TimerOn2Regex);

      console.log(timerMatch);
      console.log(timer2Match);
      console.log(timerAtMatch);
      console.log(timerAt2Match);

      // if (timerAtMatch !== null)
      // {
      //   let success = false;
      //   success, query = TryParseAbsoluteReminder(timerAtMatch, m);

      //   if (success)
      //   {
      //     command = "timer";
      //   }
      // }
      // else if (timerAt2Match !== null)
      // {
      //   let success = false;
      //   success, query = TryParseAbsoluteReminder(timerAt2Match, m);

      //   if (success)
      //   {
      //     command = "timer";
      //   }
      // }
      if (timerMatch !== null || timer2Match !== null)
      {
        let success = false;
        let matchToUse = timerMatch !== null && !DigitCheckRegex.test(timerMatch.groups.prep) ? timerMatch : timer2Match;
        success, query = TryParseReminder(matchToUse, m);

        if (success)
        {
          command = "timer";
        }
      }
      
      console.log(`${command}: ${query}`);
    }

    if (command !== "timer") return;


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
  let query = "";

  let toMatch = timerMatch.groups.target.toString().trim();
  let to = toMatch.toLowerCase() === "me" ? messageData.author.username : toMatch;
  let req = to === messageData.author.username ? "" : messageData.author.username;
  let durationStr = "";
  let duration = 0;

  let groups = timerMatch.groups;
  let reason = groups.reason.toString();

  var dateTimeString = groups.time.toString();

  // fix up e.g. +5.5 to +5:30
  if (dateTimeString.includes("."))
  {
    let parts = dateTimeString.split(".");
    dateTimeString = parts[0];

    for (let i = 1; i < parts.length; i++)
    {
      try
      {
        let time = parseFloat(parseInt(parts[i]) / 10 * 60);
        dateTimeString += `:${time}`;
      }
      catch (NumberFormatException)
      {
        console.log("poopy thing");
      }
    }
  }

  if (groups.date !== undefined)
  {
    dateTimeString = `${groups.date} ${dateTimeString}`;
  }

  let parsedDate = new Date(dateTimeString).getUTCDate();
  if (!isNaN(parsedDate))
  {
    duration = new Date(parsedDate - (new Date()).getUTCDate()) / 1000;

    if (duration < 0)
    {
      duration = new Date((parsedDate + (ONEDAY * 1000)) - (new Date()).getUTCDate()) / 1000;
    }

    durationStr = `${duration}s`;
  }

  if (duration < TOOSHORT || duration > TOOLONG)
  {
    return false;
  }

  query = `timer for: "${to}" ${durationStr} ${reason}`;

  if (reason.match(TimerDateCheckRegex) !== null)
  {
    return false;
  }

  return true, query;
}

function TryParseReminder(timerMatch, messageData)
{
  let query = "";

  let toMatch = timerMatch.groups.target.toString().trim();
  let to = toMatch.toLowerCase() === "me" ? messageData.author.username : toMatch;
  let req = to === messageData.author.username ? "" : messageData.author.username;
  let durationStr = "";
  let duration = 0;

  let groups = timerMatch.groups;
  let reason = groups.reason.toString();

  if (groups.rand !== undefined)
  {
    var randValue = GetRandomInt(20, 360);
    duration += randValue * 60;
    durationStr = `${randValue}m`
    console.log(`${durationStr}: ${duration}`)
  }

  if (groups.years !== undefined)
  {
    let yearString = groups.years.toString();

    if (yearString.toLowerCase() === "a year")
    {
      yearString = "1 year";
    }

    try
    {
      let yearValue = parseInt(yearString.substring(0, yearString.length - 5));
      duration += yearValue * ONEYEAR;
      durationStr = `${yearValue}y`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good year: ${yearString}`)
    }
  }

  if (groups.months !== undefined)
  {
    let monthString = groups.months.toString();

    if (monthString.toLowerCase() === "a month")
    {
      monthString = "1 month";
    }

    try
    {
      let monthValue = parseInt(monthString.substring(0, monthString.length - 6));
      duration += monthValue * ONEMONTH;
      durationStr += `${monthValue}mo`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good month: ${monthString}`);
    }
  }

  if (groups.weeks !== undefined)
  {
    let weekString = groups.weeks.toString();

    if (weekString.toLowerCase() === "a week")
    {
      weekString = "1 week";
    }

    try
    {
      let weekValue = parseInt(weekString.substring(0, weekString.length - 5));
      duration += weekValue * ONEWEEK;
      durationStr += `${weekValue}w`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good week: ${weekString}`);
    }
  }

  if (groups.days !== undefined)
  {
    let dayString = groups.days.toString();

    if (dayString.toLowerCase() === "a day")
    {
      dayString = "1 day";
    }

    try
    {
      let dayValue = parseInt(dayString.substring(0, dayString.length - 4));
      duration += dayValue * ONEDAY;
      durationStr += `${dayValue}d`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good day: ${dayString}`);
    }
  }

  if (groups.hours !== undefined)
  {
    let hourString = groups.hours.toString();

    if (hourString.toLowerCase() === "an hour")
    {
      hourString = "1 hour";
    }

    try
    {
      let hourValue = parseInt(hourString.substring(0, hourString.length - 5));
      duration += hourValue * ONEHOUR;
      durationStr += `${hourValue}h`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good hour: ${hourString}`);
    }
  }

  if (groups.minutes !== undefined)
  {
    let minuteString = groups.minutes.toString();

    if (minuteString.toLowerCase() === "a minute")
    {
      minuteString = "1 minute";
    }

    try
    {
      let minuteValue = parseInt(minuteString.substring(0, minuteString.length - 7));
      duration += minuteValue * ONEMINUTE;
      durationStr += `${minuteValue}`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good minute: ${minuteString}`);
    }
  }

  if (groups.seconds !== undefined)
  {
    let secondString = groups.seconds.toString();
    
    if (secondString.toLowerCase() === "a second")
    {
      secondString = "1 second";
    }

    try
    {
      let secondValue = parseInt(secondString.substring(0, secondString.length - 8));
      duration += secondValue;
      durationStr += `${secondValue}`;
    }
    catch (NumberFormatException)
    {
      console.log(`not good second: ${secondString}`);
    }
  }

  if (duration < TOOSHORT || duration > TOOLONG)
  {
    return false;
  }

  // if we see a pattern of "on yy/mm/dd" it indicates the user was trying to do an absolute time
  // reminder but parsing broke, so bail out. TODO: error messaging to the user
  if (reason.match(TimerDateCheckRegex) !== null)
  {
    return false;
  }

  query = `timer for: "${encodeURIComponent(to)}" ${durationStr} ${reason}`;

  return true, query;
}

function GetRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min) + min);
}
