import { Canvas } from "../renderer/canvas.js";
import { AssetManager } from "./assets.js";
import { ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";


export class SceneManager {


    private scenes : Map<string, Scene>;
    private activeScene : Scene | undefined = undefined;


    constructor() {

        this.scenes = new Map<string, Scene> ();
    }


    public addScene(name : string, scene : Scene, makeActive = false) : void {

        this.scenes.set(name, scene);
        if (makeActive || this.activeScene === undefined) {

            this.activeScene = scene;
        }
    }


    public init(event : ProgramEvent) : void {

        this.activeScene?.init(undefined, event);
    }


    public update(event : ProgramEvent) : void {

        this.activeScene?.update(event);
    }


    public redraw(canvas : Canvas, assets : AssetManager) : void {

        this.activeScene?.redraw(canvas, assets);
    }


    public changeScene(name : string, event : ProgramEvent) : void {

        const s = this.scenes.get(name);
        if (s === undefined) {

            throw new Error("Error: there is no scene named " + name + " in the scene manager!");
        }

        const param = s.dispose();
        this.activeScene = s;
        this.activeScene.init(param, event)
    }
}
