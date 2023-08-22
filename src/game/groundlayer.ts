import { clamp, negMod, sampleUniform, weightedProbability } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";


const X_SHIFT = 2;

const SLOPE_WAIT_MIN = 2;
const SLOPE_WAIT_MAX = 12;


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
    private slopeWait : number;
    private slopeDuration : number = 0;
    private slopeDir : SlopeDirection = SlopeDirection.None;

    private readonly width : number;
    private readonly ref : GroundLayer | undefined = undefined;


    constructor(baseWidth : number, ref? : GroundLayer) {

        this.width = baseWidth + 4;
        this.ref = ref;

        this.activeHeight = 2;
        this.heights = (new Array<number> (this.width)).fill(this.activeHeight);
        this.types = (new Array<number> (this.width)).fill(TileType.Surface);
        this.directions = (new Array<number> (this.width)).fill(SlopeDirection.None);

        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
    }


    private spawnTile() : void {

        const GAP_JUMP_MAX = 2;

        const TYPE_WAIT_MIN = [2, 2, 2];
        const TYPE_WAIT_MAX = [4, 16, 6];

        const BRIDGE_PROB = 0.25;

        const MIN_HEIGHT = 1;
        const MAX_HEIGHT = 6;

        const SLOPE_DURATION_MIN = 1;
        const SLOPE_DURATION_MAX = 2;

        let min : number;
        let max : number;

        if (this.slopeDuration > 0) {

            if ((-- this.slopeDuration ) <= 0) {

                this.slopeDir = SlopeDirection.None;
            }
        }

        if (this.activeType == TileType.Surface && (-- this.slopeWait) <= 0) {

            this.slopeDuration = sampleUniform(SLOPE_DURATION_MIN, SLOPE_DURATION_MAX);
            this.slopeWait = (this.slopeDuration - 1) + sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);

            this.slopeDir = Math.random() < 0.5 ? SlopeDirection.Up : SlopeDirection.Down;
            if ((this.activeHeight < MIN_HEIGHT + this.slopeDuration && this.slopeDir == SlopeDirection.Down) ||
                (this.activeHeight > MAX_HEIGHT - this.slopeDuration && this.slopeDir == SlopeDirection.Up)) {

                this.slopeDir *= -1;
            }

            // To avoid platforms ending in a slope
            this.typeWait += this.slopeDuration;
        }
        this.activeHeight -= this.slopeDir;

        if (this.slopeDir == SlopeDirection.None && (-- this.typeWait) <= 0) {

            if (this.activeType != TileType.Surface) {

                if (this.activeType != TileType.Bridge) {

                    min = Math.max(MIN_HEIGHT, this.activeHeight - GAP_JUMP_MAX);
                    max = Math.min(MAX_HEIGHT, this.activeHeight + GAP_JUMP_MAX);

                    this.activeHeight = sampleUniform(min, max);
                }
                this.activeType = TileType.Surface;
            }
            else {

                this.activeType = Math.random() < BRIDGE_PROB ? TileType.Bridge : TileType.None;
            }
            this.typeWait = sampleUniform(TYPE_WAIT_MIN[this.activeType], TYPE_WAIT_MAX[this.activeType]);
        }

        this.heights[this.tilePointer] = this.activeHeight;
        this.types[this.tilePointer] = this.activeType;
        this.directions[this.tilePointer] = this.slopeDir; 
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
        const BASE_SRC_X = [80, 32, 96];
        const YOFF = [0, 0, -1];

        let i : number;
        let dx : number;
        let dy : number;
        let dir : number;

        const h = (canvas.height / 16) | 0;

        let sx : number;
        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;
            dir = this.directions[i];

            dx = x*16 - (this.tileOffset | 0) - X_SHIFT*16;
            dy = h - this.heights[i];

            switch (this.types[i]) {

            case TileType.Surface:

                sx = BASE_SRC_X[dir + 1];
                if (this.types[negMod(i - 1, this.width)] != TileType.Surface)
                    sx -= 16;
                else if (this.types[(i + 1) % this.width] != TileType.Surface)
                    sx += 16;

                canvas.drawBitmap(bmp, dx, dy*16 + YOFF[dir + 1]*16, sx, 0, 16, 32);

                // TODO: Find a way to avoid having to compute the same shit twice...
                sx = 32;
                if (this.types[negMod(i - 1, this.width)] != TileType.Surface)
                    sx -= 16;
                else if (this.types[(i + 1) % this.width] != TileType.Surface)
                    sx += 16;

                for (let y = dy + YOFF[dir + 1] + 2; y < h; ++ y) {
                    
                    canvas.drawBitmap(bmp, dx, y*16, sx, y == dy ? 0 : 16, 16, 16);
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


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        const OFFSET = 2;

        let i : number;
        let j : number;
        let dx : number;

        let y1 : number;
        let y2 : number;

        const h = (event.screenHeight / 16) | 0;
        const px = ((o.getPosition().x / 16) | 0) + X_SHIFT;

        for (let x = px - OFFSET; x <= px + OFFSET; ++ x) {

            i = negMod(x + this.tilePointer, this.width);
            j = negMod(i - 1, this.width);

            // Ground collision
            if (this.types[i] != TileType.None) {

                dx = x*16 - this.tileOffset - X_SHIFT*16;
                
                y2 = this.heights[i];
                y1 = this.types[j] != TileType.None ? this.heights[j] : y2;

                y2 = h - y2;
                y1 = h - y1;

                o.floorCollision(dx, y1*16, dx + 16, y2*16, event, 0.0, Number(y1 == y2));
            }
        }
    }
}
