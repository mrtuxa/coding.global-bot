import { error } from 'console';
import type { Interaction } from 'discord.js';

export const isCommand = async (interaction: Interaction) => {
  // check if message is a command
  if (interaction.isChatInputCommand()) {
    // get slash command name
    const command = (interaction.client as any).commands.get(
      interaction.commandName
    );
    // if no name return
    if (!command) return;

    try {
      // execute command
      await command.execute(interaction);
    } catch (err) {
      // log error
      error(err);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
};
