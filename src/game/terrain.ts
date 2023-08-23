import { negMod, sampleUniform } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";
import { GroundLayer } from "./groundlayer.js";


export class Terrain {


    private groundLayers : GroundLayer[];


    constructor(event : ProgramEvent) {

        const baseWidth = (event.screenWidth / 16) | 0;

        this.groundLayers = new Array<GroundLayer> (2);
        this.groundLayers[0] = new GroundLayer(baseWidth, 2);
        this.groundLayers[1] = new GroundLayer(baseWidth, 6, false, 8,
             this.groundLayers[0], [4, 2, 2], [16, 6, 6]);
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {

        // The reverse order seems to fix some bugs with the ground
        // generator
        for (let i = this.groundLayers.length-1; i >= 0; -- i) {
            
            this.groundLayers[i].update(globalSpeed, event);
        }
    }


    public draw(canvas : Canvas, assets : AssetManager) : void {

        const bmpTerrain = assets.getBitmap("terrain");

        for (let i = this.groundLayers.length-1; i >= 0; -- i) {
            
            this.groundLayers[i].draw(canvas, bmpTerrain);
        }
    } 


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        if (!o.doesExist() || o.isDying())
            return;

        for (let g of this.groundLayers) {

            g.objectCollision(o, globalSpeed, event);
        }
    }
}
