import { clamp } from "../common/math.js";
import { Vector } from "../common/vector.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/input.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";


export const enum TouchableType {

    None = 0,

    Gem = 1,

    // The rest are enemies
    StaticBall = 2,
    FlyingBall = 3,
    JumpingBall = 4,
    DrivingBall = 5,
    StoneBall = 6
}


// Yes, this contains both enemies and gems. Saves a lot of
// bytes this way
export class TouchableObject extends GameObject {


    private type : TouchableType = TouchableType.None;

    private specialTimer : number = 0;
    private deathTimer : number = 0;


    constructor() {

        super();
        this.exist = false;

        this.friction = new Vector(0.15, 0.15);

        this.hitbox = new Vector(12, 12);
    }


    protected die(globalSpeed : number, event: ProgramEvent) : boolean {
        
        const DEATH_SPEED = 1.0/12.0;

        this.pos.x -= globalSpeed*event.tick;

        return (this.deathTimer += DEATH_SPEED*event.tick) >= 1.0;
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent): void {
        
        const FLOAT_SPEED = Math.PI*2/60.0;

        switch (this.type) {

        case TouchableType.Gem:

            this.specialTimer = (this.specialTimer + FLOAT_SPEED*event.tick) % (Math.PI*2);
            break;

        default:
            break;
        }

        if ((this.pos.x -= globalSpeed*event.tick) < -8) {

            this.exist = false;
        }
    }


    public spawn(x : number, y : number, type : TouchableType) : void {

        this.pos = new Vector(x, y);
        this.speed.zero();
        this.target.zero();

        this.type = type;

        this.exist = true;
        this.dying = false;
    }


    public draw(canvas : Canvas, assets : AssetManager): void {
        
        const DEATH_WEIGHT = 0.75;
        const DEATH_RING_RADIUS = 16;

        if (!this.exist)
            return;

        const bmpBase = assets.getBitmap("b");
        let bmpBody : Bitmap;

        const dx = Math.round(this.pos.x);
        const dy = Math.round(this.pos.y);

        let t : number;
        if (this.dying) {

            t = (1.0 - DEATH_WEIGHT) + this.deathTimer * DEATH_WEIGHT;

            canvas.fillColor("#ffaaff");
            canvas.fillRing(dx, dy, t*t*DEATH_RING_RADIUS, t*DEATH_RING_RADIUS);    
            return;
        }


        if (this.type == TouchableType.Gem) {

            canvas.drawBitmap(bmpBase, 
                dx - 8, 
                dy - 8 + Math.round(Math.sin(this.specialTimer)*2), 
                48, 88, 16, 16);
        }
        else if (this.type >= TouchableType.StaticBall && 
            this.type <= TouchableType.StoneBall) {

            bmpBody = assets.getBitmap("b" + String(this.type-1));
            canvas.drawBitmap(bmpBody, dx - 8, dy - 6);
        }
    }


    public playerCollision(globalSpeed : number, player : Player, event : ProgramEvent) : void {

        const STOMP_W = 20;
        const STOMP_Y = -4;

        if (!this.exist || !player.doesExist() || this.isDying() || player.isDying())
            return;

        const isGem = this.type == TouchableType.Gem;

        let stompx = this.pos.x - STOMP_W/2;
        let stompy = this.pos.y + STOMP_Y;

        if (!isGem &&
            player.floorCollision(stompx, stompy, stompx + STOMP_W, stompy, globalSpeed,
                event, 1, 1, -1.0)) {

            this.dying = true;
            this.deathTimer = 0.0;

            player.stompJump();

            return;
        }

        if (this.doesOverlay(player)) {

            // Kill player or give them an orb
            player.touchTouchableEvent(isGem, event);

            if (isGem) {

                this.dying = true;
                this.deathTimer = 0.0;
            }
        }

        // TODO: Stomp and kill with a spear (if I ever implement a spear, that is)
    }
}