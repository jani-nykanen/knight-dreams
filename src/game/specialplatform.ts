import { Vector } from "../common/vector.js";
import { ExistingObject } from "./existingobject.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap.js";
import { GameObject } from "./gameobject.js";


export const enum SpecialPlatformType {

    Mushroom = 0,
    FloatingPlatform = 1
};


export class SpecialPlatform extends ExistingObject {


    private pos : Vector;
    private hatWidth : number = 0;


    constructor() {

        super();

        this.pos = new Vector();
    }


    public spawn(x : number, y : number, hatWidth : number, type = SpecialPlatformType.Mushroom) : void {

        this.pos.x = x;
        this.pos.y = y;

        this.hatWidth = hatWidth;

        this.exist = true;
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {
        
        if (!this.exist)
            return;
    
        if ((this.pos.x -= globalSpeed*event.tick) <= -this.hatWidth*8) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x);
        const dy = canvas.height - this.pos.y;

        // Hat
        let sx : number;
        for (let j = 0; j < this.hatWidth; ++ j) {

            sx = 128;
            if (j == 0)
                sx -= 16;
            else if (j == this.hatWidth-1)
                sx += 16;

            canvas.drawBitmap(bmp, dx - this.hatWidth*8 + j*16, dy, sx, 0, 16, 16);
        }

        // Ring
        canvas.drawBitmap(bmp, dx - 12, dy + 16, 124, 16, 24, 16);

        // Leg
        const count = ((canvas.height - dy) / 16) | 0;

        for (let y = 2; y < count; ++ y) {

            canvas.drawBitmap(bmp, dx - 8, dy + y*16, 128, 32, 16, 16);
        }
    }


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        const y = event.screenHeight - this.pos.y;

        o.floorCollision(this.pos.x - this.hatWidth*8, y, 
            this.pos.x + this.hatWidth*8, y, globalSpeed, event);
    }
}
