import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";
import { Terrain } from "./terrain.js";


export class Game implements Scene {


    private terrain : Terrain;


    constructor(event : ProgramEvent) {

        this.terrain = new Terrain(event);
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: (Re)set terrain
    }


    public update(event : ProgramEvent) : void {

        const globalSpeed = 1.0; // TEMP

        this.terrain.update(globalSpeed, event);
    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        canvas.moveTo();
        canvas.clear("rgb(85, 170, 255)");

        // canvas.drawBitmap(assets.getBitmap("terrain"), 0, 0);

        this.terrain.draw(canvas, assets);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    } 
}

