import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";


export class Terrain {


    private groundLayer : number[];
    private bridge : boolean[];

    private groundTimer : number = 1;
    private groundSlopeTimer : number = 0;
    private groundHeight : number = 0;
    private groundMode : boolean = false;
    private bridgeEnabled : boolean = false;

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private readonly width : number;
    private readonly height : number;


    constructor(event : ProgramEvent) {

        this.width = ((event.screenWidth / 16) | 0) + 1;
        this.height = (event.screenHeight / 16) | 0;

        this.groundLayer = (new Array<number> (this.width)).fill(-1);
        this.bridge = (new Array<boolean> (this.width)).fill(false);
    }


    private updateGroundGenerator() : void {

        const GROUND_MIN = 1;
        const GROUND_VARY = 3;

        const GROUND_LENGTH_MIN = [2, 2];
        const GROUND_LENGTH_VARY = [4, 8];

        const BRIDGE_PROB = 0.25;

        if ((-- this.groundTimer) <= 0) {

            this.groundMode = !this.groundMode;
            if (this.groundMode) {

                if (!this.bridgeEnabled) {

                    this.groundHeight = this.height - (GROUND_MIN + ((Math.random()*(GROUND_VARY + 1)) | 0));
                }
                this.bridgeEnabled = false;
            }
            else {

                this.bridgeEnabled = Math.random() < BRIDGE_PROB;
                if (!this.bridgeEnabled) {

                    this.groundHeight = -1;
                }
            }

            this.groundTimer = GROUND_LENGTH_MIN[Number(this.groundMode)] + 
                ((Math.random()*(GROUND_LENGTH_VARY[Number(this.groundMode)] + 1)) | 0);
        }
        
        this.groundLayer[this.tilePointer] = this.groundHeight;
        this.bridge[this.tilePointer] = !this.groundMode && this.bridgeEnabled;
    }


    private drawGroundLayer(canvas : Canvas, bmp : Bitmap | undefined) : void {

        let dx : number;
        let dy : number;
        let i : number;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;

            dx = x*16 - this.tileOffset;
            dy = this.groundLayer[i];

            if (dy == -1) 
                continue;
            
            if (this.bridge[i]) {

                canvas.drawBitmap(bmp, dx, dy*16, 96, 32, 16, 16);
                continue;
            }

            for (let y = dy; y < this.height; ++ y) {

                canvas.drawBitmap(bmp, 
                    dx, y*16, 
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
