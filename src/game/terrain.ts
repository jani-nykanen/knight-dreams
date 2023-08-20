import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";


export class Terrain {


    private groundLayer : number[];
    private bridge : boolean[];

    private groundTimer : number = 0;
    private groundSlopeTimer : number = 0;
    private groundMode : boolean = true;

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private readonly width : number;
    private readonly height : number;


    constructor(event : ProgramEvent) {

        this.width = ((event.screenWidth / 16) | 0) + 1;
        this.height = (event.screenHeight / 16) | 0;

        this.groundLayer = (new Array<number> (this.width)).fill(-1);
        this.bridge = new Array<boolean> ();
    }


    private updateGroundGenerator() : void {

        // TEMP
        const h = this.height - ((1 + Math.random()*4) | 0);
        this.groundLayer[this.tilePointer] = h;
    }


    private drawGroundLayer(canvas : Canvas, bmp : Bitmap | undefined) : void {

        let dy : number;

        for (let x = 0; x < this.width; ++ x) {

            dy = this.groundLayer[(x + this.tilePointer) % this.width];
            if (dy == -1)
                continue;

            for (let y = dy; y < this.height; ++ y) {

                canvas.drawBitmap(bmp, 
                    x*16 - this.tileOffset, y*16, 
                    32, (y == dy ? 0 : 1)*16, 16, 16);
            }
        }
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {

        if ((this.tileOffset += globalSpeed*event.tick) >= 16) {

            this.updateGroundGenerator();

            this.tileOffset -= 16;
            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }


    public draw(canvas : Canvas, assets : AssetManager) : void {

        const bmpTerrain = assets.getBitmap("terrain");
    
        this.drawGroundLayer(canvas, bmpTerrain);
    } 
}
