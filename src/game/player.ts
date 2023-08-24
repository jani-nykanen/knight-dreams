import { Vector } from "../common/vector.js";
import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/input.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {

    private jumpTimer : number = 0;
    private ledgeTimer : number = 0;
    private canJump : boolean = false;

    private spr : Sprite;


    constructor(x : number, y : number) {

        super(x, y);

        this.friction = new Vector(0.15, 0.15);
        this.hitbox = new Vector(12, 16);
        this.center = new Vector();

        this.spr = new Sprite();
    
        this.exist = true;
    }


    private control(event : ProgramEvent) : void {

        const BASE_SPEED = 1.5;
        const BASE_GRAVITY = 4.0;
        const JUMP_TIME = 20;

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

        if (this.ledgeTimer > 0 && jumpButtonState == InputState.Pressed) {

            this.jumpTimer = JUMP_TIME;
            this.canJump = false
            this.ledgeTimer = 0;
        }
        else if ((jumpButtonState & InputState.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    protected updateTimers(event : ProgramEvent) : void {

        const JUMP_SPEED = 3.0;

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


    private animate(event : ProgramEvent) : void {

        const WALK_SPEED = 4;
        const JUMP_EPS = 0.5;

        let frame : number;

        if (this.canJump) {

            this.spr.animate(0, 3, WALK_SPEED, event.tick);
        }
        else {

            frame = 5;
            if (this.speed.y < -JUMP_EPS)
                frame = 4;
            else if (this.speed.y > JUMP_EPS)
                frame = 6;

            this.spr.setFrame(frame);
        }
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent) : void {
        
        this.control(event);
        this.updateTimers(event);
        this.checkScreenCollisions(event);
        this.animate(event);

        this.canJump = false;

        // TEMP
        if (this.pos.y > event.screenHeight+16) {

            this.pos.y -= event.screenHeight;
        }
    }


    protected floorCollisionEvent(event: ProgramEvent): void {
        
        const LEDGE_TIME = 8;

        this.canJump = true;
        this.ledgeTimer = LEDGE_TIME;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const SX = [0, 1, 0, 2, 0, 0, 1];
        const SY = [0, 0, 0, 0, 1, 0, 1];
        const FEATHER = [0, 1, 0, 2, 1, 0, 2];
        
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
        canvas.drawBitmap(bmp, dx, dy - 6, fsx, 32, 16, 8);

        // Eyes
        canvas.fillColor("#aa0000");
        for (let i = 0; i < 2; ++ i) {

            canvas.fillRect(dx + 7 + i*4, dy + 6, 1, 1);
        }
    }
}
