import { clamp, negMod, sampleUniform, weightedProbability } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";


const X_SHIFT = 1;


const enum TileType {

    None = 0,
    Surface = 1,
    Bridge = 2
};


const enum SlopeDirection {

    Up = -1,
    None = 0,
    Down = 1
};


export class GroundLayer {


    private heights : number[];
    private directions : SlopeDirection[];
    private types : TileType[];

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private activeHeight : number = 0;
    private activeType : TileType = TileType.Surface;
    private typeWait : number = 0;

    private slopeWait : number = 0;
    private slopeDir : SlopeDirection = SlopeDirection.None;


    private readonly width : number;
    private readonly ref : GroundLayer | undefined = undefined;


    constructor(baseWidth : number, ref? : GroundLayer) {

        this.width = baseWidth + 2;
        this.ref = ref;

        this.activeHeight = 2;
        this.heights = (new Array<number> (this.width)).fill(this.activeHeight);
        this.types = (new Array<number> (this.width)).fill(TileType.Surface);
        this.directions = (new Array<number> (this.width)).fill(SlopeDirection.None);
    }


    private spawnTile() : void {

        const SLOPE_WAIT_MIN = 1;
        const SLOPE_WAIT_MAX = 2;
        const SLOPE_DIR_PROB = [0.125, 0.75, 0.125];
        const GAP_JUMP_MAX = 4;

        const TYPE_WAIT_MIN = [2, 2, 2];
        const TYPE_WAIT_MAX = [4, 6, 16];

        const MAX_HEIGHT = 9;

        if (this.activeType == TileType.Surface && (-- this.slopeWait) <= 0) {

            this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
            if (this.slopeDir != SlopeDirection.None) {

                this.slopeDir = SlopeDirection.None;
            }
            else {

                this.slopeDir = (weightedProbability(SLOPE_DIR_PROB) - 1) as SlopeDirection;
                if ((this.slopeDir == SlopeDirection.Down && this.activeHeight <= 1 + this.slopeWait) ||
                    (this.slopeDir == SlopeDirection.Up && this.activeHeight >= MAX_HEIGHT - this.slopeWait)) {

                    this.slopeDir *= -1;
                }
            }
        }

        if ((-- this.typeWait) <= 0) {

            if (this.activeType != TileType.Surface) {

                if (this.activeType != TileType.Bridge) {

                    this.activeHeight += Math.round((Math.random()*2 - 1)*GAP_JUMP_MAX);
                }
                this.activeType = TileType.Surface;
            }
            else {

                this.activeType = Math.random() < 0.5 ? TileType.Bridge : TileType.None;
            }
            this.typeWait = sampleUniform(TYPE_WAIT_MIN[this.activeType], TYPE_WAIT_MAX[this.activeType]);
        }

        this.activeHeight = clamp(this.activeHeight - this.slopeDir, 2, MAX_HEIGHT);

        this.heights[this.tilePointer] = this.activeHeight;
        this.directions[this.tilePointer] = this.slopeDir;
        this.types[this.tilePointer] = this.activeType;
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {

        if ((this.tileOffset += globalSpeed*event.tick) >= 16) {

            this.spawnTile();

            this.tileOffset -= 16;
            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const BRIDGE_Y_OFF = -2;
        const SX = [80, 32, 96];
        const YOFF = [0, 0, -16];

        let i : number;
        let dx : number;
        let dy : number;
        let dir : number;

        const h = (canvas.height / 16) | 0;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;
            dir = this.directions[i];

            dx = x*16 - (this.tileOffset | 0) + X_SHIFT*16;
            dy = h - this.heights[i];

            switch (this.types[i]) {

            case TileType.Surface:

                canvas.drawBitmap(bmp, dx, dy*16 + YOFF[dir + 1], SX[dir + 1], 0, 16, 32);

                for (let y = dy + 2; y < h; ++ y) {
                    
                    canvas.drawBitmap(bmp, dx, y*16, 32, y == dy ? 0 : 16, 16, 16);
                }
                break;

            case TileType.Bridge:

                canvas.drawBitmap(bmp, dx, dy*16 + BRIDGE_Y_OFF, 96, 32, 16, 16);
                break;

            default:
                break;
            }

        }
    }
}
