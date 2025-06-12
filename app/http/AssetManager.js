import { tryToFetch_status } from "./TryToFetch.js";

export default class AssetManager {
	constructor(conf) {
		this.conf = conf;
		this.parseCache = {};
		this.failedAssets = [];
		this.texturesOfFailedMeshes = {};
		this.missingAssets = `You haven't opened a Place yet. Open a Place to get insights on missing assets.`;
		this.hasRbxGameAsset = false;
	}

	getAssetId(path) {
		if (path.split("://")[0] === "rbxassetid") return path.split("://").pop().trim();
		if (path.split("://")[0] === "http") return path.split("=").pop().trim();
		if (!this.hasRbxGameAsset && path.split("://")[0] === "rbxgameasset") this.hasRbxGameAsset = true;
		return false;
	}

	pushFailedMesh(assetId, meshTexture) {
		if (this.texturesOfFailedMeshes[assetId]) {} else this.texturesOfFailedMeshes[assetId] = [];
		if (this.texturesOfFailedMeshes[assetId].indexOf(meshTexture) === -1) this.texturesOfFailedMeshes[assetId].push(meshTexture);
	}

	async parseAssetPath(path, type = "decal", meshTexture = "N/A") {
		if (meshTexture === false) meshTexture = "N/A";
		const assetId = this.getAssetId(path);
		if (type === "mesh" && this.parseCache[path] && this.parseCache[path].length === 0) this.pushFailedMesh(assetId, meshTexture);
		if (this.parseCache[path]) return this.parseCache[path];
		//status.innerText = "Loading assets...";
		let href = "";
		if (path.split("://")[0] === "rbxasset") href = "content/" + path.split("://").pop();
		if (assetId) href =  "asset/" + assetId.trim() + (type === "decal" ? ".png" : ".mesh");
		if (this.failedAssets.indexOf(assetId) !== -1) { this.parseCache[path] = ""; return this.parseCache[path]; }
		if (href.trim().length === 0) {
			if (path.trim().length === 0)
				//print("parseAssetPath was called with an empty string!");
				;
			else
				if (path.split("://")[0] !== "rbxgameasset") this.conf.sharedFunctions.print(`Asset path ${path} could not be resolved! This might be a deficiency in Studio Lite, please open an issue!`);
				href = "";
		} else {
			if (path.trim().length === 0) { this.parseCache[path] = ""; return this.parseCache[path]; }
			const fetchResult = await tryToFetch_status(href);
			if (fetchResult === 200) { this.parseCache[path] = href; return href; } else {
				if (fetchResult === 404 && assetId !== false && this.failedAssets.indexOf(assetId) === -1) {
					this.failedAssets.push(assetId);
				}
				if (type === "mesh" && fetchResult === 404 && assetId !== false && meshTexture !== false) this.pushFailedMesh(assetId, meshTexture);
				this.parseCache[path] = "";
				return this.parseCache[path];
			}
		}
		this.parseCache[path] = href;
		//status.innerText = statusLastText;
		return href;
	}

	computeMissingAssetsList() {
		if (this.failedAssets.length > 0) {
			this.missingAssets = `Below are listed all the assets in this Place that have failed to load, likely because they aren't saved on the server.
To fix this, download the missing assets using the AssetDelivery API and place them in the asset/ directory.
The name must be given as [assetid].[extension], where the extension is:
.png for image assets
.mesh for meshes

AssetID listing starts here:`;
			for (const i in this.failedAssets) {
				const asset = this.failedAssets[i];
				const textures = this.texturesOfFailedMeshes[asset];
				this.missingAssets += `\n${textures ? "Mesh" : "Decal"} ${asset.trim()}${textures ? `, texture ${textures.join(", ")}` : ""}`;
			}
			return true;
		} else {
			this.missingAssets = "All assets in this Place have loaded successfully.";
			return false;
		}
	}
}