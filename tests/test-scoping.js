
module.exports = function ( pass ) {
	return {
	value : 2,
	passed : pass,
	fn : () => {
		console.log(module.exports.value);
		console.log("GRIEF");
	}};
}