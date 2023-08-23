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

    private baseShift : number = 0;

    private typeWaitMin : number[];
    private typeWaitMax : number[];

    private readonly width : number;
    private readonly ref : GroundLayer | undefined = undefined;


    constructor(baseWidth : number, startHeight = 2, fillStart = true,
        baseShift = 0, ref : GroundLayer | undefined = undefined,
        typeWaitMin = [2, 2, 2], typeWaitMax = [4, 16, 6]) {

        this.width = baseWidth + 4;
        this.ref = ref;

        this.activeHeight = startHeight;
        this.activeType = Number(fillStart) as TileType;

        this.heights = (new Array<number> (this.width)).fill(this.activeHeight);
        this.types = (new Array<number> (this.width)).fill(this.activeType);
        this.directions = (new Array<number> (this.width)).fill(SlopeDirection.None);

        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);

        this.baseShift = baseShift;

        this.typeWaitMin = Array.from(typeWaitMin);
        this.typeWaitMax = Array.from(typeWaitMax);
    }


    private spawnTile() : void {

        const GAP_JUMP_MAX = 2;

        const BRIDGE_PROB = 0.25;

        const MIN_HEIGHT_DEFAULT = 1;
        const HEIGHT_VARY = 5;
        const REF_HEIGHT_DIFFERENCE = 2;

        const SLOPE_DURATION_MIN = 1;
        const SLOPE_DURATION_MAX = 2;

        let minHeight = MIN_HEIGHT_DEFAULT;
        if (this.ref !== undefined) {

            minHeight += this.ref.getRecentHeight() + REF_HEIGHT_DIFFERENCE;
        }
        let maxHeight = minHeight + HEIGHT_VARY;

        if (this.slopeDuration > 0) {

            if ((-- this.slopeDuration ) <= 0) {

                this.slopeDir = SlopeDirection.None;
            }
        }

        if (this.activeType == TileType.Surface && (-- this.slopeWait) <= 0) {

            this.slopeDuration = sampleUniform(SLOPE_DURATION_MIN, SLOPE_DURATION_MAX);
            this.slopeWait = (this.slopeDuration - 1) + sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);

            this.slopeDir = Math.random() < 0.5 ? SlopeDirection.Up : SlopeDirection.Down;
            if ((this.activeHeight <= minHeight + this.slopeDuration && this.slopeDir == SlopeDirection.Down) ||
                (this.activeHeight >= maxHeight - this.slopeDuration && this.slopeDir == SlopeDirection.Up)) {

                this.slopeDir *= -1;
            }

            // To avoid platforms ending in a slope
            this.typeWait += this.slopeDuration;
        }
        this.activeHeight -= this.slopeDir;

        let min : number;
        let max : number;

        if (this.slopeDir == SlopeDirection.None && (-- this.typeWait) <= 0) {

            if (this.activeType != TileType.Surface) {

                if (this.activeType != TileType.Bridge) {

                    min = Math.max(minHeight, this.activeHeight - GAP_JUMP_MAX);
                    max = Math.min(maxHeight, this.activeHeight + GAP_JUMP_MAX);

                    this.activeHeight = sampleUniform(min, max);
                }
                this.activeType = TileType.Surface;
            }
            else {

                this.activeType = Math.random() < BRIDGE_PROB ? TileType.Bridge : TileType.None;
            }
            this.typeWait = sampleUniform(
                this.typeWaitMin[this.activeType], 
                this.typeWaitMax[this.activeType]);
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
        let left : boolean;
        let right : boolean;

        for (let x = 0; x < this.width; ++ x) {

            i = (x + this.tilePointer) % this.width;
            dir = this.directions[i];

            dx = x*16 - (this.tileOffset | 0) - X_SHIFT*16 + this.baseShift;
            dy = h - this.heights[i];

            left = this.types[negMod(i - 1, this.width)] != TileType.Surface;
            right = this.types[(i + 1) % this.width] != TileType.Surface;

            switch (this.types[i]) {

            case TileType.Surface:

                sx = BASE_SRC_X[dir + 1];
                if (left)
                    sx -= 16;
                else if (right)
                    sx += 16;

                canvas.drawBitmap(bmp, dx, dy*16 + YOFF[dir + 1]*16, sx, 0, 16, 32);

                // TODO: Find a way to avoid having to compute the same shit twice...
                sx = 32;
                if (left)
                    sx -= 16;
                else if (right)
                    sx += 16;

                for (let y = dy + YOFF[dir + 1] + 2; y < h; ++ y) {
                    
                    canvas.drawBitmap(bmp, dx, y*16, sx, y == dy ? 0 : 16, 16, 16);
                }

                // Grass edges
                if (left) {

                    canvas.drawBitmap(bmp, dx - 16, dy*16, 0, 0, 16, 16);
                }
                if (right) {

                    canvas.drawBitmap(bmp, dx + 16, dy*16, 64, 0, 16, 16);
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


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        const OFFSET = 2;

        let i : number;
        let dx : number;
        let dy : number;

        const h = (event.screenHeight / 16) | 0;
        const px = (( (o.getPosition().x - this.baseShift) / 16) | 0) + X_SHIFT;

        let left = 0;
        let right = 0;

        for (let x = px - OFFSET; x <= px + OFFSET; ++ x) {

            i = negMod(x + this.tilePointer, this.width);

            // Ground collision
            if (this.types[i] == TileType.None)
                continue;

            left = Number(this.types[negMod(i - 1, this.width)] == TileType.None);
            right = Number(this.types[(i + 1) % this.width] == TileType.None);

            dx = x*16 - this.tileOffset - X_SHIFT*16 + this.baseShift;
            dy = (h - this.heights[i])*16;

            switch (this.directions[i]) {

            case SlopeDirection.None:

                o.floorCollision(dx, dy, dx + 16, dy, globalSpeed, event, left, right);
                break;

            case SlopeDirection.Up:

                o.floorCollision(dx, dy + 16, dx + 16, dy, globalSpeed, event, 0, 0);
                break;

            case SlopeDirection.Down:

                o.floorCollision(dx, dy - 16, dx + 16, dy, globalSpeed, event, 0, 0);
                break;

            default:
                break;
            }
        }
    }


    public getRecentHeight = () : number => this.heights[this.tilePointer];
}
