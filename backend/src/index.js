const express = require('express');
const cors = require('cors');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// 1. Initialize DB
connectDB();

// 2. Initialize Cron Jobs
const { startTrackingJob } = require('./cron/trackMatches');
startTrackingJob();

// 3. Initialize Express Server
const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints cho Web Dashboard
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CoachAI Backend is running.' });
});

// Chỗ này sau sẽ tích hợp Discord OAuth2 và API trả dữ liệu Charts
// app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Web Server (Express) running on port ${PORT}`);
});

// 3. Initialize Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});
client.commands = new Collection();

// -- Load Events --
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// -- Load Commands --
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFolders = fs.readdirSync(commandsPath);
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }
  }
}

if (!process.env.DISCORD_TOKEN) {
  console.log("⚠️ BỎ QUA LOGIN DISCORD: Thiếu DISCORD_TOKEN trong .env");
} else {
  client.login(process.env.DISCORD_TOKEN);
}
