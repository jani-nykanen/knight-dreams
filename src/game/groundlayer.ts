import { clamp, negMod, sampleUniform, sampleUniformInterpolate, weightedProbability } from "../common/math.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";
import { Decoration, drawDecoration } from "./decoration.js";


export const BASE_SHIFT_X = 2;

const SLOPE_WAIT_MIN = 4;
const SLOPE_WAIT_MAX = 16;

const MIN_HEIGHT = [1, 2];
const MAX_HEIGHT = [5, 4];

const DECORATION_WAIT_MIN = 8;
const DECORATION_WAIT_MAX = 16;

const SPIKE_WAIT_MIN = [12, 6];
const SPIKE_WAIT_MAX = [18, 12];

const INITIAL_HEIGHT = [2, 0];
const INITIAL_TYPE = [TileType.Surface, TileType.None];


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


export const enum GroundLayerType {

    Foreground = 0,
    Background = 1
};


export class GroundLayer {


    private height : number[];
    private slope : SlopeDirection[];
    private type : TileType[];
    private decorations : Decoration[];
    private spikes : boolean[];

    private activeHeight : number;
    private activeType : TileType;
    private typeWait : number = 0;

    private slopeWait : number;
    private slopeDuration : number = 0;
    private activeSlope : SlopeDirection = SlopeDirection.None;
    private lastSlope : SlopeDirection = SlopeDirection.None;

    private gapTimer : number = 0;

    private decorationWait : number;

    private spikeWait : number;
    private spikeCount : number = 0;
    private hadSpike : boolean = false;

    private ref : GroundLayer = this; // Saves space vs undefined

    private readonly layerType : GroundLayerType;
    private readonly width : number;
    private readonly shift : number;


    constructor(width : number, type : GroundLayerType, shift = 0) {

        this.width = width;

        this.activeHeight = INITIAL_HEIGHT[type as number];
        this.activeType = INITIAL_TYPE[type as number];

        this.height = (new Array<number> (this.width)).fill(this.activeHeight);
        this.type = (new Array<TileType> (this.width)).fill(this.activeType);
        this.slope = (new Array<SlopeDirection> (this.width)).fill(SlopeDirection.None);
        this.decorations = (new Array<Decoration> (this.width)).fill(Decoration.None);
        this.spikes = (new Array<boolean> (this.width)).fill(false);

        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
        this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);
        this.spikeWait = sampleUniform(SPIKE_WAIT_MIN[0], SPIKE_WAIT_MAX[0]);
    
        this.layerType = type;
        this.shift = shift;

        if (type == GroundLayerType.Foreground) {

            this.generateInitialDecorations();
        }
    }


    private generateInitialDecorations() : void {

        let x1 = sampleUniform(2, this.width/2);
        const type = sampleUniform(1, 3);
        this.decorations[x1] = type;

        x1 = sampleUniform(x1 + 4, this.width - 4);
        this.decorations[x1] = 1 + (((type - 1) + sampleUniform(1, 2)) % 3);
    }


    private getHeightRange () : [number, number] {

        let min = MIN_HEIGHT[this.layerType as number];
        let max = MAX_HEIGHT[this.layerType as number];
        if (this.layerType == GroundLayerType.Background) {

            min += this.ref.activeHeight ?? 0;
            max += this.ref.activeHeight ?? 0;
        }
        return [min, max];
    }


    private updateSlope() : void {

        const SLOPE_DURATION_WEIGHTS = [0.67, 0.33];

        this.lastSlope = this.activeSlope;

        if ((-- this.slopeDuration ) <= 0) {

            this.activeSlope = SlopeDirection.None;
        }

        let nextHeight : number;
        let dif : number;
        const [min, max] = this.getHeightRange();

        if (this.activeType == TileType.Surface && 
            this.layerType == GroundLayerType.Background) {

            // TODO: Add slope direction to the ref height?
            dif = this.activeHeight - this.ref.activeHeight;
            if ((this.ref.activeSlope == SlopeDirection.Up &&
                dif <= 2) || dif <= 1) {

                this.activeSlope = SlopeDirection.Up;
                this.slopeWait = 2;
                this.slopeDuration = 0;

                this.activeHeight -= this.activeSlope;
                ++ this.typeWait;

                return;
            }
        }

        if (this.activeType == TileType.Surface && 
            this.typeWait >= 2 &&
            (-- this.slopeWait) <= 0) {

            this.slopeDuration = Math.min(this.typeWait - 1, 1 + weightedProbability(SLOPE_DURATION_WEIGHTS));
            this.slopeWait = (this.slopeDuration - 1) + sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);

            this.activeSlope = Math.random() < 0.5 ? SlopeDirection.Up : SlopeDirection.Down;

            nextHeight = this.activeHeight - this.activeSlope*this.slopeDuration;
            if (nextHeight != clamp(nextHeight, min, max)) {

                this.activeSlope *= -1;
            }

            ++ this.typeWait;
        }
        this.activeHeight -= this.activeSlope;
    }


    private updateType() : void {

        const TYPE_WAIT_MIN = [[2, 2, 2], [4, 2, 0]];
        const TYPE_WAIT_MAX = [[4, 16, 6], [16, 10, 0]];

        const GAP_JUMP_MAX = 2;
        const BRIDGE_PROB = [0.33, 0];

        // let min : number;
        // let max : number;

        const [minHeight, maxHeight] = this.getHeightRange();

        if (this.activeType == TileType.None) {

            ++ this.gapTimer;
        }

        if ((-- this.typeWait) <= 0 && this.lastSlope == SlopeDirection.None) {

            if (this.activeType != TileType.Surface) {

                this.activeType = TileType.Surface;
                if (this.layerType == GroundLayerType.Background) {

                    this.activeHeight = sampleUniform(minHeight, maxHeight);
                }
                this.gapTimer = 0;
            }
            else {

                this.activeType = (!this.hadSpike && Math.random() < BRIDGE_PROB[this.layerType as number]) ? TileType.Bridge : TileType.None;
                if (this.layerType == GroundLayerType.Foreground &&
                    this.activeType == TileType.None) {

                    // min = Math.max(minHeight, this.activeHeight - GAP_JUMP_MAX);
                    // max = Math.min(maxHeight, this.activeHeight + GAP_JUMP_MAX);

                    this.activeHeight = sampleUniform(
                        Math.max(minHeight, this.activeHeight - GAP_JUMP_MAX),  
                        Math.min(maxHeight, this.activeHeight + GAP_JUMP_MAX));

                    // Try to avoid cases where the background layer goes behind
                    // the front layer
                    /*
                    if (this.ref !== undefined) {

                        if (this.ref.activeHeight <= this.activeHeight) {

                            if ((-- this.activeHeight) < MIN_HEIGHT[0]) {

                                this.activeHeight = MIN_HEIGHT[0];
                                ++ this.typeWait;
                                return;
                            }
                        }
                    }
                    */
                }
            }
            this.typeWait = sampleUniform(
                TYPE_WAIT_MIN[this.layerType as number][this.activeType], 
                TYPE_WAIT_MAX[this.layerType as number][this.activeType]);
        }
    }
    

    private updateDecorations(tilePointer : number) : boolean {

        const DECORATION_PROB_WEIGHTS = [0.20, 0.30, 0.50];

        if ((-- this.decorationWait) > 0 ||
            this.activeType != TileType.Surface ||
            this.activeSlope != SlopeDirection.None ||
            (this.layerType == GroundLayerType.Foreground &&
             this.ref.activeType !== TileType.None))
            return false;

        let type = (weightedProbability(DECORATION_PROB_WEIGHTS) + 1) as Decoration;
        // No room for a palmtree
        // (NOTE: There is no empirical evidence that this even works)
        // Note: the following expression has some unnecessary question marks after ref
        // to silent Closure...
        if (this.layerType == GroundLayerType.Foreground && 
            this.ref.activeType == TileType.Surface &&
            this.ref.activeHeight - this.activeHeight <= 2) {

            type = Decoration.BigBush;
        }
        // No room for a big bush
        if (type == Decoration.BigBush && (this.slopeWait <= 2 || this.typeWait <= 1)) {

            type = Decoration.SmallBush;
        }

        this.decorations[tilePointer] = type;
        this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);

        if (type == Decoration.BigBush) {

            this.spikeWait = Math.max(this.spikeWait + 1, 1);
        }

        return true;
    }


    private updateSpikes(t : number) : boolean {

        const SPIKE_COUNT_WEIGHTS = [0.67, 0.33];

        if (this.activeType != TileType.Surface ||
            this.activeSlope != SlopeDirection.None) {

            this.spikeCount = 0;
            return false;
        }

        if ((-- this.spikeCount) > 0) {

            return true;
        }

        if ((-- this.spikeWait) <= 0) {

            this.spikeWait = sampleUniformInterpolate(t, SPIKE_WAIT_MIN, SPIKE_WAIT_MAX);
            this.spikeCount = 1 + weightedProbability(SPIKE_COUNT_WEIGHTS);

            return true;
        }
        return false;
    }


    public update(tilePointer : number, interpolationWeight : number) : void {

        this.updateSlope();
        this.updateType();

        this.decorations[tilePointer] = Decoration.None;
        if (!(this.spikes[tilePointer] = (this.hadSpike = this.updateSpikes(interpolationWeight)))) {

            this.updateDecorations(tilePointer);
        }

        this.height[tilePointer] = this.activeHeight;
        this.type[tilePointer] = this.activeType;
        this.slope[tilePointer] = this.activeSlope; 
    }


    public setReferenceLayer(ref : GroundLayer) : void {

        this.ref = ref;
    }


    public draw(canvas : Canvas, bmp : Bitmap, 
        tilePointer : number, tileOffset : number) : void {

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

            i = (x + tilePointer) % this.width;
            dir = this.slope[i];

            dx = x*16 - (tileOffset | 0) - BASE_SHIFT_X*16 + this.shift;
            dy = h - this.height[i];

            left = this.type[negMod(i - 1, this.width)] != TileType.Surface;
            right = this.type[(i + 1) % this.width] != TileType.Surface;

            // Decorations
            if (this.decorations[i] != Decoration.None) {

                drawDecoration(canvas, bmp, this.decorations[i], dx, dy*16);
            }

            switch (this.type[i]) {

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

                // Fence
                if (!left) {

                    canvas.drawBitmap(bmp, dx - 16, dy*16 + BRIDGE_Y_OFF - 14, 0, 64, 16, 16);
                }
                if (!right) {

                    canvas.drawBitmap(bmp, dx + 16, dy*16 + BRIDGE_Y_OFF - 14, 32, 64, 16, 16);
                }
                canvas.drawBitmap(bmp, dx, dy*16 + BRIDGE_Y_OFF - 14, 16, 64, 16, 16);

                canvas.drawBitmap(bmp, dx, dy*16 + BRIDGE_Y_OFF, 96, 32, 16, 16);
                break;

            default:
                break;
            }

            // Spikes
            if (this.spikes[i]) {

                canvas.drawBitmap(bmp, dx, (dy - 1)*16, 112 + (tilePointer % 2)*16, 48, 16, 16);
            }

        }
    }


    public objectCollision(o : GameObject, globalSpeed : number, 
        tilePointer : number, tileOffset : number, event : ProgramEvent,) : void {

        const OFFSET = 2;

        let i : number;
        let dx : number;
        let dy : number;

        const h = (event.screenHeight / 16) | 0;
        const px = (( (o.getPosition().x - this.shift) / 16) | 0) + BASE_SHIFT_X;

        let left = 0;
        let right = 0;

        for (let x = px - OFFSET; x <= px + OFFSET; ++ x) {

            i = negMod(x + tilePointer, this.width);

            // Ground collision
            if (this.type[i] == TileType.None)
                continue;

            left = Number(this.type[negMod(i - 1, this.width)] == TileType.None);
            right = Number(this.type[(i + 1) % this.width] == TileType.None);

            dx = x*16 - tileOffset - BASE_SHIFT_X*16 + this.shift;
            dy = (h - this.height[i])*16;

            switch (this.slope[i]) {

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

            // Palmtree collisions mess up everything
            /*
            if (this.decorations[i] == Decoration.Palmtree) {

                o.floorCollision(dx - 4, dy - 30, dx + 20, dy - 30, globalSpeed, event);
            }
            */

            if (this.spikes[i]) {

                o.hurtCollision?.(dx + 2, dy - 6, 12, 6, event);
            }
        }
    }
    

    // It hurts to comment these out
    /*
    public recreate() : void {

        this.activeHeight = INITIAL_HEIGHT[this.layerType as number];
        this.activeType = INITIAL_TYPE[this.layerType as number];

        this.height.fill(this.activeHeight);
        this.type.fill(this.activeType);
        this.slope.fill(SlopeDirection.None);
        this.decorations.fill(Decoration.None);
        this.spikes = (new Array<boolean> (this.width)).fill(false);

        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
        this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);
        this.spikeWait = sampleUniform(SPIKE_WAIT_MIN, SPIKE_WAIT_MAX);
    }
    */


    public getHeight = () : number => this.activeHeight;
    public hasGap = () : boolean => this.activeType == TileType.None;
    public isFlatSurfaceOrBridge = () : boolean => 
        this.activeType != TileType.None && 
        this.activeSlope == SlopeDirection.None &&
        !this.hadSpike;

    
    public getDistanceFromPlatform = () : number => Math.min(this.gapTimer, this.typeWait);
}
