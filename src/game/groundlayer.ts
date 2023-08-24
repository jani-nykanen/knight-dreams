import { clamp, negMod, sampleUniform, weightedProbability } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { next } from "./existingobject.js";
import { GameObject } from "./gameobject.js";
import { SpecialPlatform } from "./specialplatform.js";


const X_SHIFT = 2;

const SLOPE_WAIT_MIN = 2;
const SLOPE_WAIT_MAX = 12;

const MIN_HEIGHT = 1;
const MAX_HEIGHT = 6;

const BACKGROUND_WAIT_MIN = [4, 2];
const BACKGROUND_WAIT_MAX = [12, 6];

const SPECIAL_WAIT_MIN = 4;
const SPECIAL_WAIT_MAX = 12;


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

    private activeHeight : number = 2;
    private activeType : TileType = TileType.Surface;
    private typeWait : number = 0;
        
    private slopeWait : number;
    private slopeDuration : number = 0;
    private slopeDir : SlopeDirection = SlopeDirection.None;

    private backgroundHeight : number[];
    private backgroundType : number[];

    private backgroundWait : number = 0;
    private activebackgroundType : TileType = TileType.Surface;
    private activeBackgroundHeight : number = 0;

    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private specialPlatforms : SpecialPlatform[];
    private specialWait : number = 0;
    

    private readonly width : number;


    constructor(baseWidth : number) {

        this.width = baseWidth + 4;

        this.heights = (new Array<number> (this.width)).fill(this.activeHeight);
        this.types = (new Array<number> (this.width)).fill(this.activeType);
        this.directions = (new Array<number> (this.width)).fill(SlopeDirection.None);

        this.backgroundHeight = (new Array<number> (this.width)).fill(0);
        this.backgroundType = (new Array<number> (this.width)).fill(TileType.None);

        this.specialPlatforms = new Array<SpecialPlatform> ();
        
        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
        this.backgroundWait = sampleUniform(BACKGROUND_WAIT_MIN[0], BACKGROUND_WAIT_MAX[0]);
        this.specialWait = sampleUniform(SPECIAL_WAIT_MIN, SPECIAL_WAIT_MAX);
    }


    private updateSlope() : void {

        const SLOPE_DURATION_MIN = 1;
        const SLOPE_DURATION_MAX = 2;

        if (this.slopeDuration > 0) {

            if ((-- this.slopeDuration ) <= 0) {

                this.slopeDir = SlopeDirection.None;
            }
        }

        if (this.activeType == TileType.Surface && 
            this.typeWait >= 2 &&
            (-- this.slopeWait) <= 0) {

            this.slopeDuration = Math.min(this.typeWait - 1, sampleUniform(SLOPE_DURATION_MIN, SLOPE_DURATION_MAX));
            this.slopeWait = (this.slopeDuration - 1) + sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);

            this.slopeDir = Math.random() < 0.5 ? SlopeDirection.Up : SlopeDirection.Down;
            if ((this.activeHeight <= MIN_HEIGHT + this.slopeDuration && this.slopeDir == SlopeDirection.Down) ||
                (this.activeHeight >= MAX_HEIGHT - this.slopeDuration && this.slopeDir == SlopeDirection.Up)) {

                this.slopeDir *= -1;
            }

            ++ this.backgroundWait;
        }
        this.activeHeight -= this.slopeDir;
    }


    private updateType() : void {

        const TYPE_WAIT_MIN = [2, 2, 2];
        const TYPE_WAIT_MAX = [4, 16, 6]

        const GAP_JUMP_MAX = 2;
        const BRIDGE_PROB = 0.25;

        let min : number;
        let max : number;

        if (this.slopeDir == SlopeDirection.None && (-- this.typeWait) <= 0) {

            if (this.activeType != TileType.Surface) {

                this.activeType = TileType.Surface;
            }
            else {

                this.activeType = Math.random() < BRIDGE_PROB ? TileType.Bridge : TileType.None;
                if (this.activeType == TileType.None) {

                    min = Math.max(MIN_HEIGHT, this.activeHeight - GAP_JUMP_MAX);
                    max = Math.min(MAX_HEIGHT, this.activeHeight + GAP_JUMP_MAX);

                    this.activeHeight = sampleUniform(min, max);
                }
            }
            this.typeWait = sampleUniform(
                TYPE_WAIT_MIN[this.activeType], 
                TYPE_WAIT_MAX[this.activeType]);
        }
    }


    private updateBackground() : void {

        const BACKGROUND_MIN_HEIGHT = 2;
        const BACKGROUND_MAX_HEIGHT = 4;

        if (this.slopeDir == SlopeDirection.None && (-- this.backgroundWait) <= 0) {

            this.activebackgroundType = (1 - this.activebackgroundType) as TileType;
            if (this.activebackgroundType == TileType.Surface) {

                this.activeBackgroundHeight = this.activeHeight + sampleUniform(BACKGROUND_MIN_HEIGHT, BACKGROUND_MAX_HEIGHT);
            }

            this.backgroundWait = sampleUniform(
                BACKGROUND_WAIT_MIN[this.activebackgroundType as number], 
                BACKGROUND_WAIT_MAX[this.activebackgroundType as number]);
        }

        this.activeBackgroundHeight -= this.slopeDir;
        
        this.backgroundHeight[this.tilePointer] = this.activeBackgroundHeight;
        this.backgroundType[this.tilePointer] = this.activebackgroundType;
    }


    private spawnSpecialPlatform(event : ProgramEvent) : void {

        const MIN_HEIGHT = 3;
        const MAX_HEIGHT = 6;

        if (this.typeWait <= 2 || this.backgroundWait <= 2)
            return;

        if ((-- this.specialWait) > 0) 
            return;

        let groundHeight = this.activeHeight;
        if (this.activebackgroundType == TileType.Surface) {

            groundHeight = this.activeBackgroundHeight;
        }
        
        const height = groundHeight + sampleUniform(MIN_HEIGHT, MAX_HEIGHT);
        const hatWidth = sampleUniform(3, 5);
        const shift = this.activebackgroundType == TileType.None ? 0 : 8;

        next<SpecialPlatform>(SpecialPlatform, this.specialPlatforms)
            .spawn(event.screenWidth + hatWidth*8 + shift + this.tileOffset, height*16, hatWidth);

        this.specialWait = sampleUniform(SPECIAL_WAIT_MIN, SPECIAL_WAIT_MAX);
    }


    private spawnTile(event : ProgramEvent) : void {
        
        this.updateSlope();
        this.updateType();
        this.updateBackground();
        this.spawnSpecialPlatform(event);

        this.heights[this.tilePointer] = this.activeHeight;
        this.types[this.tilePointer] = this.activeType;
        this.directions[this.tilePointer] = this.slopeDir; 
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {

        for (let o of this.specialPlatforms) {

            o.update(globalSpeed, event);
        }

        if ((this.tileOffset += globalSpeed*event.tick) >= 16) {

            this.spawnTile(event);

            this.tileOffset -= 16;
            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }


    private drawLayer(canvas : Canvas, bmp : Bitmap | undefined,
        types : TileType[], heights : number[], directions : SlopeDirection[],
        xshift = 0) : void {

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
            dir = directions[i];

            dx = x*16 - (this.tileOffset | 0) - X_SHIFT*16 + xshift;
            dy = h - heights[i];

            left = types[negMod(i - 1, this.width)] != TileType.Surface;
            right = types[(i + 1) % this.width] != TileType.Surface;

            switch (types[i]) {

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


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let o of this.specialPlatforms) {

            o.draw(canvas, bmp);
        }

        this.drawLayer(canvas, bmp, this.backgroundType, this.backgroundHeight, this.directions, 8);
        this.drawLayer(canvas, bmp, this.types, this.heights, this.directions);
    }


    public objectLayerCollision(o : GameObject, globalSpeed : number, 
        heights : number[], types : TileType[], directions : SlopeDirection[],
        event : ProgramEvent, shift = 0) : void {

        const OFFSET = 2;

        let i : number;
        let dx : number;
        let dy : number;

        const h = (event.screenHeight / 16) | 0;
        const px = (( (o.getPosition().x - shift) / 16) | 0) + X_SHIFT;

        let left = 0;
        let right = 0;

        for (let x = px - OFFSET; x <= px + OFFSET; ++ x) {

            i = negMod(x + this.tilePointer, this.width);

            // Ground collision
            if (types[i] == TileType.None)
                continue;

            left = Number(types[negMod(i - 1, this.width)] == TileType.None);
            right = Number(types[(i + 1) % this.width] == TileType.None);

            dx = x*16 - this.tileOffset - X_SHIFT*16 + shift;
            dy = (h - heights[i])*16;

            switch (directions[i]) {

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


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        this.objectLayerCollision(o, globalSpeed, this.backgroundHeight, this.backgroundType, this.directions, event, 8);
        this.objectLayerCollision(o, globalSpeed, this.heights, this.types, this.directions, event);
    }
}
