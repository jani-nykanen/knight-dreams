import { negMod, sampleUniform } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";



const enum GroundType {

    Gap = 0,
    Bridge = 1,
    Ground = 2
};


export class Terrain {


    private groundHeight : number[];
    private groundType : GroundType[];
    private activeHeight : number = 0;
    private activeType : GroundType = GroundType.Gap;

    private groundTimer : number = 1;
    private groundSlopeTimer : number = 0;
    private groundMode : boolean = false;
    private bridgeEnabled : boolean = false;

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private readonly width : number;
    private readonly height : number;


    constructor(event : ProgramEvent) {

        this.width = ((event.screenWidth / 16) | 0) + 1;
        this.height = (event.screenHeight / 16) | 0;

        this.groundHeight = (new Array<number> (this.width)).fill(-1);
        this.groundType = (new Array<GroundType> (this.width)).fill(GroundType.Gap);
    }


    private getGroundType = (x : number) : GroundType => this.groundType[negMod(x, this.width)];


    private updateGroundGenerator() : void {

        const GROUND_MIN = 1;
        const GROUND_MAX = 4;

        const TIMER_MIN = [2, 3, 2];
        const TIMER_MAX = [4, 6, 8];

        const NEW_GROUND_TYPE = [2, 2, 0];

        const BRIDGE_PROB = 0.25;

        let oldType = this.activeType;

        if ((-- this.groundTimer) <= 0) {

            this.activeType = NEW_GROUND_TYPE[oldType as number];
            this.bridgeEnabled = this.activeType == GroundType.Gap && Math.random() < BRIDGE_PROB;
            if (this.bridgeEnabled) {

                this.activeType = GroundType.Bridge;
            }

            this.groundType[this.tilePointer] = this.activeType;

            if (this.activeType == GroundType.Ground && 
                oldType == GroundType.Gap) {

                this.activeHeight = this.height - sampleUniform(GROUND_MIN, GROUND_MAX);
            }

            this.groundTimer = sampleUniform(
                TIMER_MIN[this.activeType as number], 
                TIMER_MAX[this.activeType as number]);
        }

        this.groundHeight[this.tilePointer] = this.activeHeight;
        this.groundType[this.tilePointer] = this.activeType;
    }


    private drawgroundHeight(canvas : Canvas, bmp : Bitmap | undefined) : void {

        let dx : number;
        let dy : number;
        let i : number;

        let sx : number;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;

            dx = x*16 - this.tileOffset;
            dy = this.groundHeight[i];

            switch (this.groundType[i]) {

            // Gap
            case 0:
                break;

            // Bridge
            case 1:
                canvas.drawBitmap(bmp, dx, dy*16, 96, 32, 16, 16);
                break;

            // Ground
            case 2:

                for (let y = dy; y < this.height; ++ y) {

                    sx = 32;
                    if (this.getGroundType(i - 1) != GroundType.Ground) {

                        sx = 16;
                    }
                    else if (this.getGroundType(i + 1) != GroundType.Ground) {

                        sx = 48;
                    }

                    canvas.drawBitmap(bmp, 
                        dx, y*16, 
                        sx, (y == dy ? 0 : 1)*16, 16, 16);
                }
                break;

            default:
                break;
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
    
        this.drawgroundHeight(canvas, bmpTerrain);
    } 
}
