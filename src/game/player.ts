import { clamp } from "../common/math.js";
import { Vector } from "../common/vector.js";
import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/input.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {


    private initialPos : Vector;

    private jumpTimer : number = 0;
    private ledgeTimer : number = 0;
    private touchSurface : boolean = true;

    private propelling : boolean = false;
    private propellerTimer : number = 0;
    private propellerRelease : boolean = false;
    private canFly : boolean = true;

    private spr : Sprite;
    private propeller : Sprite;


    constructor(x : number, y : number) {

        super(x, y);

        this.friction = new Vector(0.15, 0.15);
        this.hitbox = new Vector(12, 16);
        this.center = new Vector();

        this.spr = new Sprite();
        this.propeller = new Sprite();
    
        this.exist = true;

        this.initialPos = new Vector(x, y);
    }


    private control(event : ProgramEvent) : void {

        const BASE_SPEED = 1.5;
        const BASE_GRAVITY = 4.0;
        const JUMP_TIME = 20;

        const PROPELLER_FALL_SPEED = 1.0;
        const FLY_DELTA = 0.30;
        const FLY_SPEED_MAX = -1.5;
        const FLY_SPEED_LOW = 2.5;
        const FLY_TIME = 60;

        let dir = 0;
        if ((event.input.getAction("right") & InputState.DownOrPressed) != 0) {

            dir = 1;
        }
        else if ((event.input.getAction("left") & InputState.DownOrPressed) != 0) {

            dir = -1;
        }

        this.target.x = BASE_SPEED * dir;
        this.target.y = BASE_GRAVITY;

        const jumpButtonState = event.input.getAction("jump");
        const jumpButtonDown = (jumpButtonState & InputState.DownOrPressed) != 0;
        
        if (this.propellerRelease && !jumpButtonDown) {

            this.propellerRelease = false;
        } 
        this.propelling = !this.propellerRelease && jumpButtonDown;

        // Jump
        if (this.ledgeTimer > 0 && jumpButtonState == InputState.Pressed) {

            this.jumpTimer = JUMP_TIME;
            this.touchSurface = false
            this.ledgeTimer = 0;
        }
        else if ((jumpButtonState & InputState.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }

        // Propelling
        if (this.propelling) {

            if (this.propellerTimer > 0) {

                this.propellerTimer -= event.tick;
                this.speed.y = clamp(this.speed.y - FLY_DELTA*event.tick, FLY_SPEED_MAX, FLY_SPEED_LOW);
            }
            else if (!this.canFly && this.speed.y >= PROPELLER_FALL_SPEED) {

                this.speed.y = PROPELLER_FALL_SPEED;
                this.target.y = this.speed.y;
            }
            else if (this.canFly) {

                this.propellerTimer = FLY_TIME;
                this.canFly = false;
            }
        }
        else {

            this.propellerTimer = 0;
        }
    }


    private updateTimers(event : ProgramEvent) : void {

        const JUMP_SPEED = 2.75;

        if (this.jumpTimer > 0) {

            this.speed.y = -JUMP_SPEED;
            this.jumpTimer -= event.tick;
        }

        if (this.ledgeTimer > 0) {

            this.ledgeTimer -= event.tick;
        }
    }


    private checkScreenCollisions(event : ProgramEvent) : void {

        if (this.pos.x - this.hitbox.x/2 <= 0) {

            this.pos.x = this.hitbox.x/2;
        }
        else if (this.pos.x + this.hitbox.x/2 >= event.screenWidth) {

            this.pos.x = event.screenWidth - this.hitbox.x/2;
        }
    }


    private animate(globalSpeed : number, event : ProgramEvent) : void {

        const JUMP_EPS = 0.5;
        const PROPELLER_SPEED = 2;

        let frame : number;

        if (this.touchSurface) {

            this.spr.animate(0, 3, 8 - globalSpeed*2, event.tick);
        }
        else {

            frame = 5;
            if (this.speed.y < -JUMP_EPS)
                frame = 4;
            else if (this.speed.y > JUMP_EPS)
                frame = 6;

            this.spr.setFrame(frame);
        }

        if (this.propelling) {

            this.propeller.animate(0, 3, PROPELLER_SPEED, event.tick);
        }
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent) : void {
        
        this.control(event);
        this.updateTimers(event);
        this.checkScreenCollisions(event);
        this.animate(globalSpeed, event);

        this.touchSurface = false;

        // TEMP
        if (this.pos.y > event.screenHeight+16) {

            this.pos.y -= event.screenHeight;
        }
    }


    protected die(globalSpeed : number, event : ProgramEvent) : boolean { 
        
        return false; // Never die! 
    }


    protected floorCollisionEvent(event: ProgramEvent): void {
        
        const LEDGE_TIME = 8;

        this.touchSurface = true;
        this.ledgeTimer = LEDGE_TIME;

        this.propellerRelease = true;
        this.propelling = false;
        this.canFly = true;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const SX = [0, 1, 0, 2, 0, 0, 1];
        const SY = [0, 0, 0, 0, 1, 0, 1];
        const FEATHER = [0, 1, 0, 2, 1, 0, 2];

        const PROPELLER_FLIP = [Flip.None, Flip.None, Flip.None, Flip.Horizontal];
        const PROPELLER_SX = [32, 48, 56, 48];
        const PROPELLER_SW = [16, 8, 8, 8];
        
        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        const sx = SX[this.spr.getFrame()]*16;
        const sy = 40 + SY[this.spr.getFrame()]*8;
        const fsx = FEATHER[this.spr.getFrame()]*16

        // Body
        canvas.drawBitmap(bmp, dx, dy, 48, 32, 16, 16);

        // Legs
        canvas.drawBitmap(bmp, dx, dy + 8, sx, sy, 16, 8);
        
        // Feather
        let sw : number;
        let propellerFrame : number;
        if (this.propelling) {

            propellerFrame = this.propeller.getFrame();
            sw = PROPELLER_SW[propellerFrame];

            canvas.drawBitmap(bmp, 
                dx + (16 - sw)/2, dy - 6, 
                PROPELLER_SX[propellerFrame], 48, sw, 8, 
                PROPELLER_FLIP[propellerFrame]);
        }
        else {

            canvas.drawBitmap(bmp, dx, dy - 6, fsx, 32, 16, 8);
        }

        // Eyes
        canvas.fillColor("#aa0000");
        for (let i = 0; i < 2; ++ i) {

            canvas.fillRect(dx + 7 + i*4, dy + 6, 1, 1);
        }
    }


    public hurtCollision(x : number, y : number, w : number, h : number, event : ProgramEvent) : boolean {

        if (!this.exist || this.dying)
            return false;

        if (this.doesOverlayRect(new Vector(x + w/2, y + h/2), new Vector(), new Vector(w, h))) {

            this.dying = true;
        }
    }


    public recreate() : void {

        this.pos = this.initialPos.clone();
        this.speed.zero();
        this.target.zero();

        this.canFly = false;
        this.touchSurface = true;
        this.propelling = false;
        this.propellerTimer = 0;
        this.propellerRelease = false;
        this.ledgeTimer = 0;
        this.jumpTimer = 0;

        this.spr.setFrame(0);
        this.propeller.setFrame(0);
        
        this.dying = false;
        this.exist = true;
    }
}
