import { Vector } from "../common/vector.js";
import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/input.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {


    private spr : Sprite;


    constructor(x : number, y : number) {

        super(x, y);

        this.friction = new Vector(0.15, 0.15);
        this.hitbox = new Vector(12, 16);
        this.center = new Vector();

        this.spr = new Sprite();
    }


    private control(event : ProgramEvent) : void {

        const BASE_SPEED = 1.5;
        const BASE_GRAVITY = 4.0;

        let dir = 0;
        if ((event.input.getAction("right") & InputState.DownOrPressed) != 0) {

            dir = 1;
        }
        else if ((event.input.getAction("left") & InputState.DownOrPressed) != 0) {

            dir = -1;
        }

        this.target.x = BASE_SPEED * dir;
        this.target.y = BASE_GRAVITY;
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent) : void {
        
        this.control(event);

        if (this.pos.y > event.screenHeight+16) {

            this.pos.y -= event.screenHeight;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7

        canvas.fillColor("#000000");
        canvas.fillRect(dx, dy, 16, 16);

        canvas.fillColor("#ff0000");
        canvas.fillRect(dx + 1, dy + 1, 14, 14);
    }
}
