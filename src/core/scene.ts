import { Canvas } from "../renderer/canvas.js";
import { AssetManager } from "./assets.js";
import { ProgramEvent } from "./event.js";


export type SceneParameter = number | string | undefined;


export interface Scene {
    
    // init?(param : SceneParameter, event : ProgramEvent) : void;
    update(event : ProgramEvent) : void;
    redraw(canvas : Canvas, assets : AssetManager) : void;
    // dispose() : SceneParameter;
}
