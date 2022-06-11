// madlibs command data for deploy-commands
const {SlashCommandBuilder} = require("@discordjs/builders");
 
module.exports = {
	data: new SlashCommandBuilder()
			.setName('madlibs')
			.setDescription('Begins a game of MadLibs'),
}