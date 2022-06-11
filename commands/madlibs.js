const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('madlibs')
		.setDescription('Begins a game of MadLibs'),
	async execute(interaction) {
		await interaction.reply('(Placeholder response)');
	},
};
