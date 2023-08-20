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


const MUSHROOM_TIME_MIN = 6;
const MUSHROOM_TIME_MAX = 16;

const X_SHIFT = -2;


export class Terrain {


    private groundHeight : number[];
    private groundType : GroundType[];
    private activeHeight : number = 0;
    private activeType : GroundType = GroundType.Gap;

    private groundTimer : number = 1;
    private groundSlopeTimer : number = 0;
    private bridgeEnabled : boolean = false;

    private mushrooms : number[];
    private mushroomHats : number[];
    private mushroomTimer : number;

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private readonly width : number;
    private readonly height : number;


    constructor(event : ProgramEvent) {

        const HEIGHT_MARGIN = 5;

        this.width = ((event.screenWidth / 16) | 0) + HEIGHT_MARGIN;
        this.height = (event.screenHeight / 16) | 0;

        this.groundHeight = (new Array<number> (this.width)).fill(-1);
        this.groundType = (new Array<GroundType> (this.width)).fill(GroundType.Gap);

        this.mushroomTimer = sampleUniform(MUSHROOM_TIME_MIN, MUSHROOM_TIME_MAX);
        this.mushrooms = (new Array<number> (this.width)).fill(-1);
        this.mushroomHats = (new Array<number> (this.width)).fill(1);
    }


    private getGroundType = (x : number) : GroundType => this.groundType[negMod(x, this.width)];
    private getGroundHeight = (x : number) : number => this.groundHeight[negMod(x, this.width)];


    private updateGroundGenerator() : void {

        const MAX_HEIGHT = 8;

        const GROUND_MIN = 1;
        const GROUND_MAX = 4;

        const TIMER_MIN = [2, 3, 2];
        const TIMER_MAX = [4, 6, 10];

        const NEW_GROUND_TYPE = [2, 2, 0];

        const BRIDGE_PROB = 0.25;
        const SLOPE_PROB_FACTOR = 0.1;

        let oldType = this.activeType;
        let dir : number;

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
            this.groundSlopeTimer = 0;
        }
        else if (this.activeType == GroundType.Ground && this.groundTimer > 1) {

            ++ this.groundSlopeTimer;
            if (Math.random() < SLOPE_PROB_FACTOR*this.groundSlopeTimer) {

                dir = Math.random() < 0.5 ? 1 : -1;
                if ( (this.activeHeight >= this.height - 1 && dir > 0) ||
                     (this.activeHeight <= this.height - MAX_HEIGHT && dir < 0)) 
                    dir *= -1;

                this.activeHeight += dir;

                // Setting this to 0 might create double slopes, whcch
                // are bad since they can "zig-zag" and thus look a bit
                // out-of-place
                this.groundSlopeTimer = -1;
            }
        }

        this.groundHeight[this.tilePointer] = this.activeHeight;
        this.groundType[this.tilePointer] = this.activeType;
    }


    private updateMushroomGenerator() : void {

        const MUSHROOM_HEIGHT_MIN = 3;
        const MUSHROOM_HEIGHT_MAX = 5;

        const MUSHROOM_HAT_WIDTH_MIN = 1;
        const MUSHROOM_HAT_WIDTH_MAX = 3;

        this.mushrooms[this.tilePointer] = -1;
        if ((-- this.mushroomTimer) <= 0) {

            this.mushroomTimer = sampleUniform(MUSHROOM_TIME_MIN, MUSHROOM_TIME_MAX);

            this.mushrooms[this.tilePointer] = sampleUniform(
                this.activeHeight - MUSHROOM_HEIGHT_MAX, 
                this.activeHeight - MUSHROOM_HEIGHT_MIN);
            this.mushroomHats[this.tilePointer] = sampleUniform(
                MUSHROOM_HAT_WIDTH_MIN, MUSHROOM_HAT_WIDTH_MAX);
        }
    }


    private drawMushrooms(canvas : Canvas, bmp : Bitmap | undefined) : void {

        let i : number;
        let dy : number;
        let dx : number;

        let hatWidth : number;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;

            dx = x*16 + X_SHIFT*16 - (this.tileOffset | 0);
            dy = this.mushrooms[i];

            if (dy == -1)
                continue;

            // Ring
            canvas.drawBitmap(bmp, dx - 4, (dy + 1)*16, 124, 16, 24, 16);
            // Leg
            for (let y = dy + 2; y < this.height; ++ y) {

                canvas.drawBitmap(bmp, dx, y*16, 128, 32, 16, 16);
            }

            // Hat
            hatWidth = this.mushroomHats[i] - 1;
            for (let j = 0; j < hatWidth + 1; ++ j) {

                canvas.drawBitmap(bmp, dx - hatWidth*8 + j*16, dy*16, 128, 0, 16, 16);
            }
            canvas.drawBitmap(bmp, dx - hatWidth*8 - 16, dy*16, 112, 0, 16, 16);
            canvas.drawBitmap(bmp, dx + hatWidth*8 + 16, dy*16, 144, 0, 16, 16);
        }
    }


    private drawGround(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const BRIDGE_Y_OFF = -2;

        let dx : number;
        let dy : number;
        let i : number;

        let sx : number;

        let left : GroundType;
        let right : GroundType;
        let leftHeight : number;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;

            dx = x*16 - (this.tileOffset | 0) + X_SHIFT*16;
            dy = this.groundHeight[i];

            left = this.getGroundType(i - 1);
            right = this.getGroundType(i + 1);
            leftHeight = this.getGroundHeight(i - 1);

            switch (this.groundType[i]) {

            // Gap
            case 0:
                break;

            // Bridge
            case 1:
                canvas.drawBitmap(bmp, dx, dy*16 + BRIDGE_Y_OFF, 96, 32, 16, 16);
                break;

            // Ground
            case 2:

                for (let y = dy; y < this.height; ++ y) {

                    sx = 32;
                    if (left != GroundType.Ground) {

                        sx = 16;
                        if (y == dy)
                            canvas.drawBitmap(bmp, dx - 16, y*16, 0, 0, 16, 16);
                    }
                    else if (right != GroundType.Ground) {

                        sx = 48;
                        if (y == dy)
                            canvas.drawBitmap(bmp, dx + 16, y*16, 64, 0, 16, 16);
                    }

                    // Slopes
                    // TODO: This has no real reason to be inside the for loop,
                    // but it simplifies the rendering order...
                    if (y == dy && left == GroundType.Ground && leftHeight != dy) {

                        if (leftHeight > dy) {

                            canvas.drawBitmap(bmp, dx, dy*16, 80, 0, 16, 32);
                            ++ y; // Also update y to skip the next tile
                        }
                        else {

                            canvas.drawBitmap(bmp, dx, (dy - 1)*16, 96, 0, 16, 32);
                        }
                        continue;
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
            this.updateMushroomGenerator();

            this.tileOffset -= 16;
            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }


    public draw(canvas : Canvas, assets : AssetManager) : void {

        const bmpTerrain = assets.getBitmap("terrain");
        
        this.drawMushrooms(canvas, bmpTerrain);
        this.drawGround(canvas, bmpTerrain);
    } 
}
