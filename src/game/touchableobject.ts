import { Vector } from "../common/vector.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { drawPropeller } from "./propeller.js";


export const enum TouchableType {

    None = 0,
    Gem = 1,

    // The rest are enemies
    StaticBall = 2,
    JumpingBall = 3,
    DrivingBall = 4,
    StoneBall = 5,
    FlyingBall = 6,

    LastGroundEnemy = 5
}


// Yes, this contains both enemies and gems. Saves a lot of
// bytes this way
export class TouchableObject extends GameObject {


    private type : TouchableType = TouchableType.None;

    private specialTimer : number = 0;
    private deathTimer : number = 0;
    private yoff : number = 0;
    private initialY : number = 0;

    private didTouchGround : boolean = false;


    constructor() {

        super();
        this.exist = false;

        this.friction = new Vector(0.15, 0.125);
    }


    private kill(player : Player, event : ProgramEvent) : void {

        event.audio.playSample(event.assets.getSample("ak"), 0.50);

        this.dying = true;
        this.deathTimer = 0.0;

        player.addScore(100);
    }


    protected die(globalSpeed : number, event: ProgramEvent) : boolean {
        
        const DEATH_SPEED = 1.0/12.0;

        this.pos.x -= globalSpeed*event.tick;

        return (this.deathTimer += DEATH_SPEED*event.tick) >= 1.0;
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent): void {
        
        const FLOAT_SPEED = Math.PI*2/60.0;
        const BOUNCING_SPEED = 4.0/40.0;
        const JUMP_WAIT_SPEED = 3.0/30.0;
        const JUMP_SPEED = -3.25;
        const DRIVE_SPEED = 0.5;
        const TIRE_ANIM_SPEED = 2.0/15.0;
        const LEDGE_JUMP = -2.5;
        const STONE_BALL_SPEED = 0.5;
        const FLY_BALL_FLOAT_SPEED = Math.PI*2/150;
        const FLY_SPEED_X = -0.25;

        let jumpWaitFactor = 1;
        let jumpFactor = 1;

        switch (this.type) {

        case TouchableType.Gem:

            this.specialTimer = (this.specialTimer + FLOAT_SPEED*event.tick) % (Math.PI*2);
            break;

         case TouchableType.StaticBall:

            this.specialTimer = (this.specialTimer + BOUNCING_SPEED*event.tick) % 4;
            break;

        case TouchableType.StoneBall:

            this.speed.x = 0;
            if (!this.touchSurface) {

                this.speed.x = -STONE_BALL_SPEED;
            }
            this.target.x = this.speed.x;

            jumpWaitFactor = 2;
            jumpFactor = 0.75;
            
        case TouchableType.JumpingBall:

            if (this.touchSurface) {

                if ((this.specialTimer += jumpWaitFactor*JUMP_WAIT_SPEED*event.tick) >= 3.0) {

                    this.specialTimer = 0.0;
                    this.speed.y = JUMP_SPEED*jumpFactor;

                    // This sounds annoying
                    // event.audio.playSample(event.assets.getSample("ab"), 0.50);
                }
            }
            break;

        case TouchableType.DrivingBall:

            this.specialTimer = (this.specialTimer + TIRE_ANIM_SPEED*event.tick) % 2;
            
            this.target.x = (this.speed.x = -DRIVE_SPEED);

            if (this.didTouchGround && !this.touchSurface) {

                this.speed.y = LEDGE_JUMP;
            }
            break;

        case TouchableType.FlyingBall:

            this.specialTimer = (this.specialTimer + FLY_BALL_FLOAT_SPEED*event.tick) % (Math.PI*2);

            this.target.x = (this.speed.x = FLY_SPEED_X);
            this.yoff = Math.sin(this.specialTimer) * 12;
            this.pos.y = this.initialY + this.yoff;

            break;

        default:
            break;
        }

        if ((this.pos.x -= globalSpeed*event.tick) < -8) {

            this.exist = false;
        }

        this.didTouchGround = this.touchSurface;
    }


    public spawn(x : number, y : number, type : TouchableType) : void {

        const BASE_GRAVITY = 2.5;

        /*
        if (type == 0 || type >= TouchableType.FlyingBall) {

            return;
        }
        */

        this.pos = new Vector(x, y);
        this.speed.zero();
        this.target.zero();
        this.center.zero();
        
        this.initialY = y;

        this.type = type;

        this.exist = true;
        this.dying = false;

        const isGem = type == TouchableType.Gem;
        const isFlying = type == TouchableType.FlyingBall;

        const w = isGem ? 12 : 8;
        this.hitbox = new Vector(w, 12);

        this.specialTimer = 0;
        if (!isGem && !isFlying) {

            this.target.y = BASE_GRAVITY;
            this.center.y = 2;
        }

        this.specialTimer = (((x / 16) | 0) % 2)*(Math.PI*(isFlying ? 0.5 : 1.0));
        
        this.touchSurface = true;
        this.didTouchGround = false;

        this.getCollision = !isFlying;
        this.friction.y = isFlying ? 0.05 : 0.15;
    }


    public draw(canvas : Canvas, assets : AssetManager): void {
        
        const DEATH_WEIGHT = 0.75;
        const DEATH_RING_RADIUS = 16;
        const FACE_EPS = 1.0;

        const BODY_FRAME = [0, 1, 0, 2];
        const FACE_SX = [0, 8, 0, 24, 16];
        const FACE_SH = [8, 8, 4, 8, 8];
        const FACE_SHIFT_Y = [0, 1, -1];

        if (!this.exist || this.type == TouchableType.None)
            return;

        const bmpBase = assets.getBitmap("b");

        let dx = Math.round(this.pos.x);
        let dy = Math.round(this.pos.y);
        const isGem = this.type == TouchableType.Gem;

        let t : number;
        if (this.dying) {

            t = (1.0 - DEATH_WEIGHT) + this.deathTimer * DEATH_WEIGHT;

            canvas.fillColor(isGem ? "#ffaaff" : "#ff0000");
            canvas.fillRing(dx, dy, t*t*DEATH_RING_RADIUS, t*DEATH_RING_RADIUS);    
            return;
        }

        if (isGem) {

            canvas.drawBitmap(bmpBase, 
                dx - 8, 
                dy - 8 + Math.round(Math.sin(this.specialTimer)*2), 
                48, 88, 16, 16);
            return;
        }

        const bmpBody = assets.getBitmap("b" + String(this.type-1));

        let faceShiftX = 0;
        let faceShiftY = 0;
        let frame = 0;
        let bsh = 16;

        if ([2,3,5].includes(this.type)) {

            frame = BODY_FRAME[(this.specialTimer | 0)];
            faceShiftY = Math.abs(this.speed.y) > FACE_EPS ? Math.sign(this.speed.y)*2 : 0;
        }
        else if (this.type == TouchableType.DrivingBall) {

            // -- dy;
            bsh = 14;
            faceShiftY = 2;
            faceShiftX = -1;
        }

        // Body
        canvas.drawBitmap(bmpBody, dx - 8, dy - 7, frame*16, 0, 16, bsh);

        // Face
        canvas.drawBitmap(bmpBase, dx - 5 + faceShiftX, dy - 3 + faceShiftY + FACE_SHIFT_Y[frame], 
            16 + FACE_SX[this.type - 2], 112, 8, FACE_SH[this.type - 2]);

        if (this.type == TouchableType.DrivingBall) {

            frame = (this.specialTimer | 0);
            canvas.drawBitmap(bmpBase, dx - 8, dy + 1, 48, 104 + frame*8, 16, 8);
        }
        else if (this.type == TouchableType.FlyingBall) {

            drawPropeller(canvas, bmpBase, 
                (((this.specialTimer/(Math.PI*2))*32) | 0) % 4,
                dx - 8, dy - 5);
        }
    }


    public playerCollision(globalSpeed : number, player : Player, event : ProgramEvent) : void {

        const STOMP_W = 20;
        const STOMP_Y = -6;

        if (!this.exist || !player.doesExist() || 
            this.isDying() || player.isDying())
            return;

        const isGem = this.type == TouchableType.Gem;

        let stompx = this.pos.x - STOMP_W/2;
        let stompy = this.pos.y + this.center.y + STOMP_Y;

        if (!isGem && player.doesOverlaySpear(this)) {

            this.kill(player, event);
            return;
        }

        if (!isGem &&
            player.floorCollision(stompx, stompy, 
                stompx + STOMP_W, stompy, globalSpeed,
                event, 1, 1, -1.0)) {

            this.kill(player, event);
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
    }
}