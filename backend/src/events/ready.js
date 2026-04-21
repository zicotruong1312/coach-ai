const { Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Đăng ký Slash Commands
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    // Đọc tất cả commands để register
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
              commands.push(command.data.toJSON());
            }
          }
        }
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data = await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      );

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
    }
  },
};
