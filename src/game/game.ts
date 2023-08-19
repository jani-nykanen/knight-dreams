import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";


export class Game implements Scene {



    constructor(event : ProgramEvent) {


    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

    }


    public update(event : ProgramEvent) : void {

    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        canvas.moveTo();
        canvas.clear("rgb(85, 170, 255)");

        canvas.drawBitmap(assets.getBitmap("base"), 0, 0);
        canvas.drawBitmap(assets.getBitmap("terrain"), 0, 64);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    } 
}

