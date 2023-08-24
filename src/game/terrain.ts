import { negMod, sampleUniform } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";
import { GroundLayer } from "./groundlayer.js";


// TODO: Merge GroundLayer to Terrain
export class Terrain {


    private ground : GroundLayer;


    constructor(event : ProgramEvent) {

        const baseWidth = (event.screenWidth / 16) | 0;

        this.ground = new GroundLayer(baseWidth);
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {

        this.ground.update(globalSpeed, event);
    }


    public draw(canvas : Canvas, assets : AssetManager) : void {

        const bmpTerrain = assets.getBitmap("terrain");

        this.ground.draw(canvas, bmpTerrain);
    } 


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        if (!o.doesExist() || o.isDying())
            return;

        this.ground.objectCollision(o, globalSpeed, event);
    }
}
