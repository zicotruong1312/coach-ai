const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    // Chỉ cho phép hoạt động trong channel #coach-ai
    if (!interaction.channel || interaction.channel.name !== 'coach-ai') {
      return await interaction.reply({ 
        content: '🤖 Bot chỉ hoạt động trong channel **#coach-ai**!', 
        ephemeral: true 
      });
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Có lỗi xảy ra khi thực hiện lệnh này!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện lệnh này!', ephemeral: true });
      }
    }
  },
};
