import { negMod, sampleUniform, sampleUniformInterpolate, weightedProbability, weightedProbabilityInterpolate } from "../common/math.js";
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

const TOUCHABLE_TIMER_MIN = [4, 1];
const TOUCHABLE_TIMER_MAX = [12, 6];

const FLYING_ENEMY_TIMER_MIN = [16, 6];
const FLYING_ENEMY_TIMER_MAX = [32, 12];

const REPEAT_WEIGHT = [[0.50, 0.30, 0.20], [0.10, 0.50, 0.40]];
const ENEMY_WEIGHTS = [[0.40, 0.30, 0.20, 0.10], [0.25, 0.25, 0.25, 0.25]];

const GEM_OFF_Y = -10;


export class Terrain {


    private tilePointer : number = 0;
    private tileOffset : number = 0;

    private layers : GroundLayer[];

    private specialPlatforms : SpecialPlatform[];
    private specialWait : number = 0;

    private touchables : TouchableObject[];
    private touchableTimer : number;
    private touchableRepeat : number = 0;
    private touchableLayer : number = 0;
    private touchableType : TouchableType = TouchableType.Gem;

    private flyingEnemyTimer : number = 0;

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

        this.touchableTimer = sampleUniform(TOUCHABLE_TIMER_MIN[0], TOUCHABLE_TIMER_MAX[0]);
        this.flyingEnemyTimer = sampleUniform(FLYING_ENEMY_TIMER_MIN[0], FLYING_ENEMY_TIMER_MAX[0]);
        this.touchables = new Array<TouchableObject> ();
    }


    private getObjectPos = () : number => this.width*16 - BASE_SHIFT_X*16 + (this.tileOffset % 16);


    private spawnSpecialPlatform(event : ProgramEvent) : void {

        const MIN_HEIGHT = 3;
        const MAX_HEIGHT = 5;

        const MIN_WIDTH = 1;
        const MAX_WIDTH = 5;

        const MUSHROOM_MAX_HEIGHT = 6;
        
        const TYPE_PROB = [0.75, 0.25];

        const OBJECT_PROB = 0.5;

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

        const opos = this.getObjectPos();
        next<SpecialPlatform>(SpecialPlatform, this.specialPlatforms)
            .spawn(opos, height*16, width, type);

        this.specialWait = sampleUniform(width + 2, SPECIAL_WAIT_MAX);

        let x : number;
        let y : number;
        let count : number;

        if (Math.random() < OBJECT_PROB) {

            count = Math.min(3, sampleUniform(1, width));

            x = opos + 8 - width*16/2 + ((Math.random()*(width - count + 1)) | 0)*16;
            y = event.screenHeight - height*16 + (this.touchableType == TouchableType.Gem ? GEM_OFF_Y : -8);
            
            for (let i = 0; i < count; ++ i) {

                next<TouchableObject>(TouchableObject, this.touchables).spawn(x + i*16, y, this.touchableType);
            }
        }
    }


    private spawnTouchableObject(event : ProgramEvent) : void {

        const yoff = this.touchableType == TouchableType.Gem ? GEM_OFF_Y : -8;
        const layer = this.touchableLayer;

        next<TouchableObject>(TouchableObject, this.touchables)
            .spawn(this.getObjectPos() + 8 - 16*(1 - layer) - 8*layer, 
                event.screenHeight - this.layers[layer].getHeight()*16 + yoff, 
                this.touchableType);
    }


    private layerCheck() : boolean {

        return (!this.layers[this.touchableLayer].isFlatSurfaceOrBridge() &&
            !this.layers[this.touchableLayer = 1 - this.touchableLayer].isFlatSurfaceOrBridge());
    }


    private spawnTouchables(t : number, event : ProgramEvent) : boolean {

        if (this.touchableRepeat > 0) {

            if (this.layerCheck()) {

                return false;
            }
            -- this.touchableRepeat;
            this.spawnTouchableObject(event);
            return true;
        }

        if ((-- this.touchableTimer) > 0) 
            return false;

        this.touchableLayer = 1 - this.touchableLayer;
        if (this.layerCheck()) {
            
            return false;
        }

        this.touchableType = this.touchableType == TouchableType.Gem ? 
            2 + weightedProbabilityInterpolate(ENEMY_WEIGHTS[0], ENEMY_WEIGHTS[1], t) : 
            TouchableType.Gem;

        this.touchableRepeat = weightedProbabilityInterpolate(REPEAT_WEIGHT[0], REPEAT_WEIGHT[1], t); // + 1?
        this.touchableTimer = this.touchableRepeat + sampleUniformInterpolate(t, TOUCHABLE_TIMER_MIN, TOUCHABLE_TIMER_MAX);

        this.spawnTouchableObject(event);

        return true;
    }


    private spawnFlyingEnemies(t : number, event : ProgramEvent) : void {

        const OFFSET_Y = 32;    

        if ((-- this.flyingEnemyTimer) > 0)
            return;

        const layer = Math.random() < 0.5 ? 0 : 1;
        const y = event.screenHeight - this.layers[layer].getHeight()*16 - OFFSET_Y;
        const repeat = weightedProbabilityInterpolate(REPEAT_WEIGHT[0], REPEAT_WEIGHT[1], t);

        this.flyingEnemyTimer = sampleUniformInterpolate(t, FLYING_ENEMY_TIMER_MIN, FLYING_ENEMY_TIMER_MAX);

        for (let i = 0; i < repeat; ++ i) {

            next<TouchableObject>(TouchableObject, this.touchables)
            .spawn(this.getObjectPos() + 8 - 16*(1 - layer) - 8*layer + i*16, y, 
                TouchableType.FlyingBall);
        }
    }


    public update(player : Player, playTimeFactor : number, globalSpeed : number, event : ProgramEvent) : void {

        for (let p of this.specialPlatforms) {

            p.update(globalSpeed, event);
        }

        for (let o of this.touchables) {
            
            o.update(globalSpeed, event);
            o.playerCollision(globalSpeed, player, event);

            this.objectCollision(o, globalSpeed, event);
        }

        if ((this.tileOffset += globalSpeed*event.tick) >= 16) {

            // TODO: In the old code tileOffset was updated accidentally
            // *afterwards*. See that this does not break anything.
            this.tileOffset -= 16;
            for (let l of this.layers) {

                l.update(this.tilePointer, playTimeFactor);
            }
            this.spawnSpecialPlatform(event);
            if (!this.spawnTouchables(playTimeFactor, event)) {
                
                this.spawnFlyingEnemies(playTimeFactor, event);
            }

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

        for (let o of this.touchables) {

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
