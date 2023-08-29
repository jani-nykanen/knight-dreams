import { negMod, sampleUniform, weightedProbability } from "../common/math.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { next } from "./existingobject.js";
import { GameObject } from "./gameobject.js";
import { BASE_SHIFT_X, GroundLayer, GroundLayerType } from "./groundlayer.js";
import { Player } from "./player.js";
import { SpecialPlatform, SpecialPlatformType } from "./specialplatform.js";
import { TouchableObject, TouchableType } from "./touchableobject.js";


const SPECIAL_WAIT_MIN = 4;
const SPECIAL_WAIT_MAX = 16;

const GEM_TIMER_MIN = 4;
const GEM_TIMER_MAX = 16;


export class Terrain {


    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private layers : GroundLayer[];

    private specialPlatforms : SpecialPlatform[];
    private specialWait : number = 0;

    private gems : TouchableObject[];
    private gemTimer : number;
    private gemRepeat : number = 0;
    private gemLayer : number = 0;

    private readonly width : number;


    constructor(event : ProgramEvent) {

        const EXTRA_MARGIN = 5;

        this.width = ((event.screenWidth / 16) | 0) + EXTRA_MARGIN;

        this.layers = new Array<GroundLayer> (2);
        this.layers[0] = new GroundLayer( this.width, GroundLayerType.Foreground);
        this.layers[1] = new GroundLayer( this.width, GroundLayerType.Background, 8);

        this.layers[0].setReferenceLayer(this.layers[1]);
        this.layers[1].setReferenceLayer(this.layers[0]);

        this.specialWait = sampleUniform(SPECIAL_WAIT_MIN, SPECIAL_WAIT_MAX);
        this.specialPlatforms = new Array<SpecialPlatform> ();

        this.gemTimer = sampleUniform(GEM_TIMER_MIN, GEM_TIMER_MAX);
        this.gems = new Array<TouchableObject> ();
    }


    private getObjectPos = () : number => this.width*16 - BASE_SHIFT_X*16 + (this.tileOffset % 16);


    private spawnSpecialPlatform() : void {

        const MIN_HEIGHT = 3;
        const MAX_HEIGHT = 5;

        const MIN_WIDTH = 1;
        const MAX_WIDTH = 5;

        const MUSHROOM_MAX_HEIGHT = 6;
        
        const TYPE_PROB = [0.75, 0.25];

        if ((-- this.specialWait) > 0)
            return;

        let width = sampleUniform(MIN_WIDTH, MAX_WIDTH);
        if (this.layers[1].getDistanceFromPlatform() <= width/2 + 1) {

            return;
        }

        let groundHeight = this.layers[0].getHeight();
        if (!this.layers[1].hasGap()) {
            // this.layers[1].getGapTimer() <= width/2 ???

            groundHeight = this.layers[1].getHeight();
        }

        const height = groundHeight + sampleUniform(MIN_HEIGHT, MAX_HEIGHT);

        // Determine type
        let type = weightedProbability(TYPE_PROB) as SpecialPlatformType;
        if (width == MAX_WIDTH) {

            type = SpecialPlatformType.Mushroom;
        }
        else if (height >= this.layers[0].getHeight() + MUSHROOM_MAX_HEIGHT ||
            width <= 2) {

            type = SpecialPlatformType.FloatingPlatform;
        }

        next<SpecialPlatform>(SpecialPlatform, this.specialPlatforms)
            .spawn(this.getObjectPos(), height*16, width, type);

        this.specialWait = sampleUniform(width + 2, SPECIAL_WAIT_MAX);
    }


    private spawnGem(event : ProgramEvent) : void {

        const GEM_OFF_Y = -10;

        const layer = this.gemLayer;
        next<TouchableObject>(TouchableObject, this.gems)
            .spawn(this.getObjectPos() + 8 - 16*(1 - layer) - 8*layer, 
                event.screenHeight - this.layers[layer].getHeight()*16 + GEM_OFF_Y,
                TouchableType.Gem);
    }


    private spawnGems(event : ProgramEvent) : void {

        if ((-- this.gemRepeat) > 0) {

            if (!this.layers[this.gemLayer].isFlatSurfaceOrBridge()) {

                this.gemRepeat = 0;
            }
            else {

                this.spawnGem(event);
            }
            return;
        }

        if ((-- this.gemTimer) > 0) 
            return;

        let layer = (Math.random()*2) | 0;
        if (!this.layers[layer].isFlatSurfaceOrBridge()) {

            layer = 1 - layer;
            if (!this.layers[layer].isFlatSurfaceOrBridge()) {

                return;
            }
        }

        this.gemLayer = layer;
        this.gemRepeat = sampleUniform(1, 3);
        this.gemTimer = this.gemRepeat + sampleUniform(GEM_TIMER_MIN, GEM_TIMER_MAX);

        this.spawnGem(event);
    }


    public update(player : Player, globalSpeed : number, event : ProgramEvent) : void {

        for (let p of this.specialPlatforms) {

            p.update(globalSpeed, event);
        }

        for (let o of this.gems) {

            o.update(globalSpeed, event);
            o.playerCollision(player, event);
        }

        if ((this.tileOffset += globalSpeed*event.tick) >= 16) {

            // TODO: In the old code tileOffset was updated accidentally
            // *afterwards*. See that this does not break anything.
            this.tileOffset -= 16;
            for (let l of this.layers) {

                l.update(this.tilePointer);
            }
            this.spawnSpecialPlatform();
            this.spawnGems(event);

            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }


    public draw(canvas : Canvas, assets : AssetManager) : void {

        const bmpTerrain = assets.getBitmap("t");

        for (let p of this.specialPlatforms) {

            p.draw(canvas, bmpTerrain);
        }

        for (let i = 1; i >= 0; -- i) {

            this.layers[i].draw(canvas, bmpTerrain, this.tilePointer, this.tileOffset);
        }

        for (let o of this.gems) {

            o.draw(canvas, assets);
        }
    } 


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        if (!o.doesExist() || o.isDying())
            return;

        for (let l of this.layers) {

            l.objectCollision(o, globalSpeed, this.tilePointer, this.tileOffset, event);
        }

        for (let p of this.specialPlatforms) {

            p.objectCollision(o, globalSpeed, event);
        }
    }


    // Also waste of bytes
    /*
    public reset() : void {

        for (let p of this.specialPlatforms) {

            p.forceKill();
        }

        for (let l of this.layers) {

            l.recreate();
        }
    }
    */
}
