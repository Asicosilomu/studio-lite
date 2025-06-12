# Studio Lite
A web viewer for _Roblox[^1]_ place and model files, with a gorgeous interface.

![Screenshot of Studio Lite](images/screen.png)

## This is still in alpha
Expect bugs and unfinished features

## Acknowledgements
Studio Lite uses the [rbxBinaryParser](https://github.com/MrSprinkleToes/rbxBinaryParser) library by [MrSprinkleToes](https://github.com/MrSprinkleToes). Additionally, some code, mostly mesh parsing code, is taken from [roblox-in-webbrowser](https://github.com/MrSprinkleToes/roblox-in-webbrowser) and [roblox-web-viewer](https://github.com/MrSprinkleToes/roblox-web-viewer).

These other libraries are also used:
* [THREE.js](https://threejs.org/) for rendering
* [7.css](https://khang-nd.github.io/7.css/) for that gorgeous user interface
* [jsTree](https://www.jstree.com/) for displaying interactive trees

## Included assets
For demo purposes, Studio Lite includes some downloaded assets in the `asset/` directory and some place files in `examples/`. Please note that these files are copyright of their respective owners.

The _Roblox[^1]_ Studio icons, used in the title bar and Explorer view, and stored under the `content/icons/` directory, are copyright of Roblox Corporation.

Other assets within the `content/` directory, as well as the `favicon.ico` in the root of the source tree, are also copyright of Roblox Corporation.

Studio Lite is not affiliated with, or endorsed by Roblox Corporation.

## Features
### Read RBXL and RBXM files
![City.rbxl with a part selected in Explorer](images/explorer.png)
![Script viewer](images/script.png)
![THREE.js Scene Explorer](images/three.png)

These file types can be opened by Studio Lite. Keep in mind that there is no support for files in the XML format (though it is a high priority), so you'll encounter issues especially with older places (which often have RBXL extension but contain XML data).

You can use the Explorer and Properties views to browse the contents of the DataModel. You can click on scripts to view their code. Parts selected in the Explorer are highlighted in the renderer, and you can also zoom to the currently selected part.

### Asset support
![Closeup of a billboard](images/billboard.png)
![Drinks in a fridge](images/fridge.png)
![View of convenience store](images/cashier.png)
![Library with many books](images/library.png)
![View of the City template out a car windshield](images/car.png)
![List of missing assets](images/assets.png)

Studio Lite can load decals and meshes accurately! In light of _Roblox[^1]_'s API changes, you must manually download assets using AssetDelivery and place them in the `asset/` folder. This is made easy as you get a list of all missing assets along with their type upon loading a Place.

### Perfect for renders
![Render Image dialog](images/render.png)

You can render the current view to a PNG file at any resolution you want. Do you want [a top-down view of Crossroads in 8K resolution](images/crossroads8k.png)? No problem.

_Also, here's [an 8K render of the Suburban map](images/suburban8k.png), for those interested. Caution, large file, about 2 MB!_

![Western Lounge thumbnail](images/lounge.png)
![Dilapidated House thumbnail](images/house.png)

You can also hide the skybox, leaving a transparent background. This is useful for thumbnails. You can open a model file, hide the skybox and render a 420x420 image. This will produce a thumbnail similar to those on the _Roblox[^1]_ website. (see examples above)

## How to use
Studio Lite makes many network requests, so I've refrained from hosting a live demo in fear of rate limits. It is very easy to run yourself, though, being a fully client-side application.

All you need is a decent computer and an HTTP server. Download these files (you can clone the repo or just download as ZIP) and run a web server in the root directory.

If you have Python installed, it's very easy to run a local server: `python -m http.server`. Then you can access Studio Lite on `localhost:8000`. Otherwise, use your preferred method of starting up a quick server (you can use Node.js or PHP).

If you have any issues or are unsatisfied with your experience, please open an issue!

## How to download assets
Read the first section to learn how the download process works. Then read the second section, which shows you how to get the AssetIDs you need to download.

### The download process itself
Due to _Roblox[^1]_ API changes, you must be logged in to access AssetDelivery. Therefore, you must be signed into your _Roblox[^1]_ account on the browser.

While my experimentation has shown that you can download _Roblox[^1]_-owned assets anonymously, authentication is required otherwise.

To download an asset, copy the Asset ID (the long number) and navigate to the URL below, first replacing `[assetid]` with the Asset ID you've copied.

AssetDelivery URL: `https://assetdelivery.roblox.com/v1/asset?id=[assetid]`

This will download a file with a random name. Rename it like you're told in the second section.

### Downloading all assets in a Place
1. Open a Place containing un-downloaded assets.
2. Look in the console. If it says that there are missing assets, then go to `File > Missing assets` like it tells you.
3. Browse the list. For each line, if it is a decal, download the asset and rename it to `[assetid].png`, where `[assetid]` is the AssetID. If it is a mesh, do the same but use `.mesh` extension. Download all of the mesh's textures (if any) with the `.png` extension.
4. If you're done, reload the page and open your Place again. You shouldn't get the console warning, and `File > Missing assets` should say all assets have loaded successfully.

### Possible errors while downloading
You may encounter some errors during asset downloads, which will get you a JSON response.

##### Authentication required / User not authorized
JSON response: `{"errors":[{"code":0,"message":"Authentication required to access Asset."}]}`

Alternatively: `{"errors":[{"code":1,"message":"User is not authorized to access Asset."}]}`

You need to log in to download the asset. If you're logged in on the _Roblox[^1]_ website, but still get this error, the asset could be private or something. Idk.

##### Requested asset is archived
JSON response: `{"errors":[{"code":0,"message":"Requested asset is archived"}]}`

Exactly what it says on the tin. You're not getting the asset :)

You could put a placeholder image in its place, to silence the Missing assets error...

## Roadmap (WIP)
- [ ] Fix bugs
- - [ ] Issues with mesh Scale and Offset (see comments in `StudioLiteRenderer.renderPart`, around where it says `// Give meshes special treatment`)
- - [ ] Upside down decals (see paintings in suburban house and piano in western lounge)
- - [ ] Merry-go-round in Suburban playground is broken (base renders sideways)
- [ ] Support XML format
- [ ] Support all primitive shapes
- - [x] Block
- - [x] Ball
- - [x] Wedge
- - [x] Cylinder (for the most part, see bugs)
- - [ ] Truss
- [ ] Cool effects
- - [ ] Show light for parts with [Light](https://create.roblox.com/docs/reference/engine/classes/Light) children
- - [ ] ParticleEmitter support
- - [ ] Fire and Smoke
- - [ ] Glow for parts with Neon material
- [ ] Completionist questline (impossible)
- - [ ] Support part materials
- - [ ] Basic support for rendering Smooth Terrain (really, this is a problem of reading terrain voxels, which might very well be impossible)
- - [ ] hmm... ~~Edit Mode~~ (lol no... but maybe one day?)

## Licensing
Studio Lite is **MIT licensed**. However, the following files and directories in the source tree are exempt from licensing:
* `asset/` (non-free assets)
* `content/` (non-free assets)
* `examples/` (non-free assets)
* `favicon.ico` (non-free asset)
* `app/rendering/mesh/MeshParser.js` (contains mesh parsing code from `roblox-in-webbrowser`/`roblox-web-viewer`, which are unlicensed. Please see **Acknowledgements**)
* `app/controls/FlyCamera.js` (contains camera code from `roblox-web-viewer`, which is unlicensed. See **Acknowledgements**)

## How you can help
Contributions are welcome! You don't need to write any code, I'll be very happy if you told me what you didn't like, or what you'd like added.

[^1]: _Roblox_ is a registered trademark of Roblox Corporation.