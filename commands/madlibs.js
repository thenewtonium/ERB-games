// madlibs command data for deploy-commands
const {SlashCommandBuilder} = require("@discordjs/builders");
 
module.exports = {
	data: new SlashCommandBuilder()
			.setName('madlibs')
			.setDescription('Commands relating to MadLibs')
			.addSubcommand(subcommand =>
				subcommand
					.setName('start')
					.setDescription('Begin a game of MadLibs')
					.addStringOption(option => option.setName('title').setDescription('Title the text to use (see /madlibs list). Leave blank to randomise.') )
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('list')
					.setDescription('List the titles of the available texts for MadLibs.')
					.addIntegerOption(option => option.setName('page').setDescription('Page number to display') )
			),
}	