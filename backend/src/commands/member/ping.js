const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra trạng thái của Bot'),
  async execute(interaction) {
    await interaction.reply('Pong! Bot AI Coach đang hoạt động.');
  },
};
