import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";
import { Terrain } from "./terrain.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";


export class Game implements Scene {


    private terrain : Terrain;
    private player : Player;
    private camera : Camera;


    constructor(event : ProgramEvent) {

        this.terrain = new Terrain(event);
        this.player = new Player(64, 64);
        this.camera = new Camera();
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: (Re)set terrain
    }


    public update(event : ProgramEvent) : void {

        const globalSpeed = 2.0; // TEMP

        this.terrain.update(globalSpeed, event);

        this.player.update(globalSpeed, event);
        this.terrain.objectCollision(this.player, globalSpeed, event);

        this.camera.followObject(this.player, event);
    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        canvas.moveTo();
        canvas.clear("rgb(85, 170, 255)");

        // canvas.drawBitmap(assets.getBitmap("terrain"), 0, 0);

        this.camera.use(canvas);

        this.terrain.draw(canvas, assets);
        this.player.draw(canvas, undefined);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    } 
}

