export function sleep(ms) { return new Promise((r) => { setTimeout(r, ms); }); }

/* https://stackoverflow.com/a/5624139 */
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
/* https://stackoverflow.com/a/5624139 */