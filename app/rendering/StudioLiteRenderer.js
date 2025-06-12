import {
    Scene,
    PerspectiveCamera,
    PCFSoftShadowMap,
    TextureLoader,
    Clock,
    Matrix4,
    DirectionalLight,
    AmbientLight,
    Color,
    SphereGeometry,
    CylinderGeometry,
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    BackSide,
    MeshBasicMaterial,
    BoxGeometry,
    DataTexture,
    SRGBColorSpace,
    AxesHelper,
    BoxHelper,
    Raycaster,
    Vector2
} from '../thirdparty/three/three.core.js';
import { decode } from "../thirdparty/rbxBinaryParser.js";
import FlyCamera from '../controls/FlyCamera.js';
import { WebGLRenderer } from '../thirdparty/three/three.module.js';
import {
    findByClassName
} from '../datamodel/DataModelUtils.js';
import { parseMesh } from './mesh/MeshParser.js';
import {
    tryToFetch
} from '../http/TryToFetch.js';
import AssetManager from '../http/AssetManager.js';

const decalSides = ["Right", "Left", "Top", "Bottom", "Back", "Front"];
export const partClasses = ["Part", "SpawnLocation", "WedgePart", "Seat", "VehicleSeat"];

export class StudioLiteRenderer {
    constructor(conf) {
        this.conf = conf;
        this.queue = {
            total: 0,
            completed: 0
        }
        this.texturesOfFailedMeshes = {};
        this.imagePlaceholder = false;
        this.mAssetManager = new AssetManager({
            sharedFunctions: {
                print: this.conf.sharedFunctions.print
            }
        });
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, this.conf.width/this.conf.height, 0.1, 15000);
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.autoClear = false;
        this.renderer.setSize(this.conf.width, this.conf.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.style = PCFSoftShadowMap;
        this.domElement = this.renderer.domElement;
        this.loader = new TextureLoader();
        this.loader.crossOrigin = "Anonymous";
        this.clock = new Clock();
        let sun = new DirectionalLight(new Color(1, 1, 1), 1);
        sun.position.set(0, 10, 1);
        this.scene.add(sun);
        let light = new AmbientLight(new Color(1, 1, 1), .5);
        this.scene.add(light);
        this.controls = new FlyCamera(this.camera, this.domElement);
        this.setSkybox({
            SkyboxBk: "rbxasset://sky/null_plainsky512_bk.jpg",
            SkyboxDn: "rbxasset://sky/null_plainsky512_dn.jpg",
            SkyboxFt: "rbxasset://sky/null_plainsky512_ft.jpg",
            SkyboxLf: "rbxasset://sky/null_plainsky512_lf.jpg",
            SkyboxRt: "rbxasset://sky/null_plainsky512_rt.jpg",
            SkyboxUp: "rbxasset://sky/null_plainsky512_up.jpg"
        });
        this.axesHelper = new AxesHelper(20);
        this.scene.add(this.axesHelper);
        this.raycaster = new Raycaster();
        this.threeids = [];
        this.pointer = new Vector2();
        this.useSelectionBox = false;
        this.useSelectionBox2 = false;
        this.domElement.addEventListener("mousemove", (event) => {
            if (!this.useSelectionBox2) return;
            const rect = event.target.getBoundingClientRect();
            this.pointer.x = ( (event.clientX - rect.left) / this.conf.width ) * 2 - 1;
			this.pointer.y = - ( (event.clientY - rect.top) / this.conf.height ) * 2 + 1;
        });
        this.noWorkspace = false;
    }

    render() {
        if (this.controls) this.controls.update(this.clock.getDelta());
        this.renderer.render(this.scene, this.camera);
        if (this.useSelectionBox2) {
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, false);
            if (intersects.length > 0) {
                this.updateSelectionBox2(intersects[0].object);
            }
        }
    }

    renderImage(width = this.conf.width, height = this.conf.height) {
        if (this.selectionBox) this.scene.remove(this.selectionBox);
        if (this.selectionBox2) this.scene.remove(this.selectionBox2);
	    this.renderer.setSize(width, height);
	    this.camera.aspect = width / height;
	    this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.camera);
        const result = this.domElement.toDataURL();
        this.resize();
        if (this.selectionBox) this.scene.add(this.selectionBox);
        if (this.selectionBox2) this.scene.add(this.selectionBox2);
        return result;
    }

    setAnimationLoop(cb) {
        this.renderer.setAnimationLoop(cb);
    }

    resize() {
	    this.renderer.setSize(this.conf.width, this.conf.height);
	    this.camera.aspect = this.conf.width / this.conf.height;
	    this.camera.updateProjectionMatrix();
    }

    toggleAxes(axes) {
        if (axes) {
            this.scene.add(this.axesHelper);
        } else {
            this.scene.remove(this.axesHelper);
        }
    }

    setAxesPosition(x, y, z) {
        this.axesHelper.position.set(x, y, z);
    }

    zoomTo(cameraFrame, rotate = true) {
        this.camera.position.set(cameraFrame.Position.X, cameraFrame.Position.Y, cameraFrame.Position.Z);
        if (rotate) this.camera.setRotationFromMatrix(new Matrix4().fromArray([
            cameraFrame.Components[3], cameraFrame.Components[6], cameraFrame.Components[9], 0,
            cameraFrame.Components[4], cameraFrame.Components[7], cameraFrame.Components[10], 0,
            cameraFrame.Components[5], cameraFrame.Components[8], cameraFrame.Components[11], 0,
            0, 0, 0, 1
        ]));
    }

    updateSelectionBox(threeid) {
        if (!this.useSelectionBox) return;
        if (threeid !== 1) {
            const mesh = this.scene.getObjectById(threeid);
            if (this.selectionBox) {
                this.selectionBox.setFromObject(mesh);
            } else {
                this.selectionBox = new BoxHelper(mesh, new Color(1, 1, 1));
                this.scene.add(this.selectionBox);
                this.conf.sharedFunctions.treeRefresh2();
            }
        }
    }

    updateSelectionBox2(mesh) {
        if (!this.useSelectionBox2) return;
        if (this.selectionBox2) {
            if (mesh !== this.skybox) this.selectionBox2.setFromObject(mesh);
        } else {
            this.selectionBox2 = new BoxHelper(mesh, new Color(1, 1, 1));
            this.scene.add(this.selectionBox2);
            this.conf.sharedFunctions.treeRefresh2();
        }
    }

    removeSelectionBoxesIfNeeded() {
        if (!this.useSelectionBox && this.selectionBox) {
            this.scene.remove(this.selectionBox);
            this.selectionBox.dispose();
            this.selectionBox = null;
        }
        if (!this.useSelectionBox2 && this.selectionBox2) {
            this.scene.remove(this.selectionBox2);
            this.selectionBox2.dispose();
            this.selectionBox2 = null;
        }
        this.conf.sharedFunctions.treeRefresh2();
    }

    showSkybox(show) {
        if (show)
            this.scene.add(this.skybox);
        else
            this.scene.remove(this.skybox);
    }

    getThreeId(id) {
        return this.threeids[id];
    }

    async setSkybox(sky) {
        if (this.skybox) this.scene.remove(this.skybox);
        this.skybox = null
        var material = []
        material[0] = await this.mAssetManager.parseAssetPath(sky.SkyboxFt);
        material[1] = await this.mAssetManager.parseAssetPath(sky.SkyboxBk);
        material[2] = await this.mAssetManager.parseAssetPath(sky.SkyboxUp);
        material[3] = await this.mAssetManager.parseAssetPath(sky.SkyboxDn);
        material[4] = await this.mAssetManager.parseAssetPath(sky.SkyboxRt);
        material[5] = await this.mAssetManager.parseAssetPath(sky.SkyboxLf);
        for (var i = 0; i < material.length; i++) {
            material[i] = new MeshBasicMaterial({map: this.loadColorTexture(material[i])})
            material[i].side = BackSide
        }
        var geometry = new BoxGeometry(10000, 10000, 10000)
        this.skybox = new Mesh(geometry, material)
        this.skybox.position.set(0, 0, 0)
        this.skybox.name = "Skybox";
        this.scene.add(this.skybox)
        console.log("skybox added")
        this.conf.sharedFunctions.treeRefresh2();
    }

    queueOperation(cb) {
        (async () => {
            this.queue.total++;
            await cb();
            this.queue.completed++;
        })();
    }
    
    get queueSize() {
        return this.queue.total - this.queue.completed;
    }

    async renderPart(part, forceNoMesh = false, mappedid) {
        const transparent = part.Transparency > 0;
        let geometry, material, decals = [];
        let offset = {x: 0, y: 0, z: 0};
        let scale = {x: 1, y: 1, z: 1};

        // Look for mesh data
        const mesh = findByClassName(part.Children, "SpecialMesh");
        if (typeof mesh !== "object" && part.ClassName === "MeshPart") mesh = part;

        // Decide part color
        let color = new Color(1, 1, 1);
        if (part.Color3) {
            color = new Color(part.Color3.R, part.Color3.G, part.Color3.B);
        } else if (part.BrickColor) {
            color = new Color(part.BrickColor.Color.R/255, part.BrickColor.Color.G/255, part.BrickColor.Color.B/255)
        }

        // Give meshes special treatment
        const blockMesh = mesh && mesh !== part ? mesh : findByClassName(part.Children, "BlockMesh");
        if (blockMesh) {
            scale = {
                x: blockMesh.Scale.X,
                y: blockMesh.Scale.Y,
                z: blockMesh.Scale.Z
            };
            // offset stays y-only for now. offset coordinates are somehow relative to rotation? tf??
            // to see what I mean, uncomment X and Z, then open City.rbxl from the examples.
            // Look at the stop signs. whaat? I ain't figuring this one out.
            offset = {
                x: 0,//blockMesh.Offset.X,
                y: blockMesh.Offset.Y,
                z: 0,//blockMesh.Offset.Z
            };
        }
        
        // If ball or cylinder, decide geometry
        if (part.Shape == "Ball") {
            geometry = new SphereGeometry(part.Size.X / 2, 10, 10)
        } else if (part.Shape === "Cylinder" || (mesh && mesh.MeshType === "Head")) {
            let x, y, z;
            if (part.Shape === "Cylinder") {
                x = part.Size.X;
                y = part.Size.Y;
                z = part.Size.Z;
            } else {
                x = part.Size.Y;
                y = part.Size.X;
                z = part.Size.Z;
            }
            const cylinderRadius = Math.min(y, z) / 2;
            geometry = new CylinderGeometry(cylinderRadius, cylinderRadius, x, 16, 16);
        } else if (!forceNoMesh && mesh && (mesh.MeshType === "FileMesh" || part.ClassName === "MeshPart")) {
            // Look, a mesh! Let's queue that so it doesn't block place loading.
            this.queueOperation(async () => {
                try {
                    var meshData = await this.getMesh(mesh.MeshId, this.mAssetManager.getAssetId(mesh.TextureId));
                    var { positions, normal, uv } = await parseMesh(meshData, mesh.MeshId);
                    const geometry = new BufferGeometry();
                    const positionNumComponents = 3;
                    const normalNumComponents = 3;
                    const uvNumComponents = 3;
                    geometry.setAttribute(
                    "position",
                    new BufferAttribute(
                        new Float32Array(positions),
                        positionNumComponents
                    )
                    );
                    geometry.setAttribute(
                    "normal",
                    new BufferAttribute(new Float32Array(normal), normalNumComponents)
                    );
                    geometry.setAttribute(
                    "uv",
                    new BufferAttribute(new Float32Array(uv), uvNumComponents)
                    );
                    geometry.computeBoundingBox();
                    let box = geometry.boundingBox;
                    let x = box.max.x - box.min.x;
                    let y = box.max.y - box.min.y;
                    let z = box.max.z - box.min.z;
                    geometry.scale(part.Size.X / x, part.Size.Y / y, part.Size.Z / z);

                    material = new MeshPhongMaterial( {
                        map: this.loadColorTexture(await this.mAssetManager.parseAssetPath(mesh.TextureId)),
                        transparent: transparent,
                        opacity: part.transparency*-1+1,
                        specular: 0x222222
                    } )
                
                    let cube = new Mesh(geometry, material);
                    cube.receiveShadow = true
                    cube.castShadow = true
                    cube.name = part.Name;
                    cube.position.set(part.CFrame.Position.X, part.CFrame.Position.Y, part.CFrame.Position.Z);
                    cube.setRotationFromMatrix(new Matrix4().fromArray([
                        part.CFrame.Components[3], part.CFrame.Components[6], part.CFrame.Components[9], 0,
                        part.CFrame.Components[4], part.CFrame.Components[7], part.CFrame.Components[10], 0,
                        part.CFrame.Components[5], part.CFrame.Components[8], part.CFrame.Components[11], 0,
                        0, 0, 0, 1
                    ]));
                    this.scene.add(cube);
                    if (mappedid) this.threeids[mappedid] = cube.id;
                // That didn't work! Let's load the part meshless instead.
                } catch (e) {
                    // forceNoMesh = true skips the mesh code, so this part will follow the regular code path.
                    this.renderPart(part, true);
                }
            });
            return;
        } else {
            geometry = new BoxGeometry( part.Size.X * scale.x, part.Size.Y * scale.y, part.Size.Z * scale.z )
        }

        // Render wedgepart
        if (part.ClassName === "WedgePart") {
            let pos = geometry.attributes.position;
            for(let i = 0; i < pos.count; i++){
                if (pos.getZ(i) < 0 && pos.getY(i) > 0) pos.setY(i, (part.Size.Y / 2) * -1); // change Y-coord by condition
            }
            geometry.computeVertexNormals(); // don't forget to re-compute normals
        }

        // Enumerate decals
        for (let child of part.Children) {
            if (child.ClassName === "Decal" || child.ClassName === "Texture") {
                decals.push(child);
            }
        }

        // Stage two. We will queue this if there are decals, to not block.
        const renderPartStageTwo = async () => {
            if (decals.length > 0) {
                // Build a decal material.
                material = [null, null, null, null, null, null];
                let index;
                for (let decal of decals) {
                    index = decalSides.indexOf(decal.Face);
                    if (index !== -1) {
                        material[index] = new MeshPhongMaterial({
                            map: this.loadColorTexture(await this.mAssetManager.parseAssetPath(decal.Texture)),
                            transparent: decal.Transparency > 0,
                            opacity: decal.Transparency*-1+1,
                            specular: 0x222222
                        });
                    }
                }
                for (let i in material) {
                    if (material[i] === null) material[i] = new MeshPhongMaterial({
                        color: color,
                        transparent: transparent,
                        opacity: part.Transparency*-1+1,
                        specular: 0x222222
                    });
                }
            } else {
                // No decals? Just one material, then.
                material = new MeshPhongMaterial( {
                    color: color,
                    transparent: transparent,
                    opacity: part.Transparency*-1+1,
                    specular: 0x222222
                } )
            }

            // Create the mesh for our part.
            var cube = new Mesh( geometry, material )
            cube.receiveShadow = true
            cube.castShadow = true
            cube.name = part.Name;
            cube.position.set(part.CFrame.Position.X + offset.x, part.CFrame.Position.Y + offset.y, part.CFrame.Position.Z + offset.z);
            // Degrees aren't enough! We need to set the exact rotation matrix.
            // If we use just CFrame.Orientation, it will lead to incorrect placements => destroyed buildings.
            cube.setRotationFromMatrix(new Matrix4().fromArray([
                part.CFrame.Components[3], part.CFrame.Components[6], part.CFrame.Components[9], 0,
                part.CFrame.Components[4], part.CFrame.Components[7], part.CFrame.Components[10], 0,
                part.CFrame.Components[5], part.CFrame.Components[8], part.CFrame.Components[11], 0,
                0, 0, 0, 1
            ]));
            // This is needed for cylinders to rotate correctly. No idea why.
            if (part.Shape === "Cylinder") cube.rotation.z += Math.PI / 2;
            //cube.rotation.set(MathUtils.degToRad(part.CFrame.Orientation.X), MathUtils.degToRad(part.CFrame.Orientation.Y), MathUtils.degToRad(part.CFrame.Orientation.Z));
            this.scene.add( cube )
            if (mappedid) this.threeids[mappedid] = cube.id;
        };
        
        // If there are no assets to load, render the part synchronously.
        // If there are assets, move rendering to the background,
        // so it doesn't block everything else if the user's connection is slow.
        // (it is just a HEAD request, tho...)
        if (decals.length > 0) {
            this.queueOperation(renderPartStageTwo);
        } else await renderPartStageTwo();
    }

    async traverse(instance, treeData, render = false) {
        for (let child of instance.Children) {
            if (child) {
                let item = {'text': child.Name, 'icon': `content/icons/${child.ClassName}.png`, 'children': [], 'instance': child, 'id': this.threeids.push(1) - 1};
                treeData.push(item);
                if (render && partClasses.indexOf(child.ClassName) !== -1) {
                    await this.renderPart(child, false, item.id);
                }
                await this.traverse(child, item.children, render ? true : child.ClassName === "Workspace" || this.noWorkspace);
            }
        }
    }
    
    loadColorTexture( path ) {
        if (path.trim().length === 0) return new DataTexture(new Uint8Array(4), 1, 1);
        this.conf.sharedFunctions.print("Load texture " + new URL(path, window.location.href));
        const texture = this.loader.load( path );
        texture.colorSpace = SRGBColorSpace;
        return texture;
    }

    async getMesh(mesh, texture) {
        const path = await this.mAssetManager.parseAssetPath(mesh, "mesh", texture);
        if (path.trim().length === 0) throw new Error();
        var d = await fetch(path);
        var data = await d.arrayBuffer();
        return data;
    }

    async loadPlace(ab) {
        this.data = decode(ab);
        const workspace = findByClassName(this.data, "Workspace");
        if (workspace) this.noWorkspace = false; else this.noWorkspace = true;
        try {
            const robloxCamera = findByClassName((this.noWorkspace ? findByClassName(this.data, "Model") : workspace).Children, "Camera");
            const cameraFrame = robloxCamera.CFrame || robloxCamera.CoordinateFrame;
            this.zoomTo(cameraFrame);
        } catch (ignored) {
            this.conf.sharedFunctions.print("Could not determine camera position!");
        }
        this.queueOperation(async () => {
            try {
                const sky = findByClassName(findByClassName(this.data, "Lighting").Children, "Sky");
                if (!sky) throw new Error();
                try {
                    for (const key of ["Bk", "Dn", "Ft", "Lf", "Rt", "Up"]) {
                        if (await tryToFetch(await this.mAssetManager.parseAssetPath(sky["Skybox" + key]))) {} else { throw new Error(); }
                    }
                    await this.setSkybox(sky);
                } catch (ignored) {
                    this.conf.sharedFunctions.print("Could not load sky!");
                }
            } catch (ignored) {};
        });
        await this.traverse({"Children": this.data}, this.conf.sharedObjects.jsTreeData);
    }
}