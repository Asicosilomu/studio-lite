export async function tryToFetch_status(url) {
	if (url.trim().length === 0) return false;
	try {
		let r = await fetch(url, {method: "HEAD"});
		return r.status;
	} catch (ignored) { return false; }
}

export async function tryToFetch(url) {
	if (await tryToFetch_status(url) === 200) return true;
	return false;
}