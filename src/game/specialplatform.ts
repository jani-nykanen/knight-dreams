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
    private width : number = 0;
    private type : SpecialPlatformType = SpecialPlatformType.Mushroom;


    constructor() {

        super();

        this.pos = new Vector();
    }


    public spawn(x : number, y : number, width : number, type : SpecialPlatformType) : void {

        this.pos.x = x;
        this.pos.y = y;

        this.width = width;
        this.type = type;

        this.exist = true;
    }


    public update(globalSpeed : number, event : ProgramEvent) : void {
        
        if (!this.exist)
            return;
    
        if ((this.pos.x -= globalSpeed*event.tick) <= -this.width*8) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {

        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x);
        const dy = canvas.height - this.pos.y;
        // const mushroomHeight = ((canvas.height - dy) / 16) | 0;

        let sx : number;

        switch (this.type) {

        // Mushroom
        case SpecialPlatformType.Mushroom:
            
            // Hat
            for (let j = 0; j < this.width; ++ j) {

                sx = 128;
                if (j == 0)
                    sx -= 16;
                else if (j == this.width-1)
                    sx += 16;

                canvas.drawBitmap(bmp, dx - this.width*8 + j*16, dy, sx, 0, 16, 16);
            }
            // Ring
            canvas.drawBitmap(bmp, dx - 12, dy + 16, 124, 16, 24, 16);
            // Leg
            for (let y = 2; y < (((canvas.height - dy) / 16) | 0); ++ y) {

                canvas.drawBitmap(bmp, dx - 8, dy + y*16, 128, 32, 16, 16);
            }
            break;

        // Floating platform
        case SpecialPlatformType.FloatingPlatform:

            // Soil edges
            canvas.drawBitmap(bmp, dx - this.width*8 - 16, dy, 0, 32, 16, 16);
            canvas.drawBitmap(bmp, dx + this.width*8, dy, 64, 32, 16, 16);

            if (this.width == 1) {

                canvas.drawBitmap(bmp, dx - 8, dy, 80, 32, 16, 16);
                break;
            }

            for (let j = 0; j < this.width; ++ j) {

                sx = 32;
                if (j == 0)
                    sx -= 16;
                else if (j == this.width-1)
                    sx += 16;

                canvas.drawBitmap(bmp, dx - this.width*8 + j*16, dy, sx, 32, 16, 16);
            }

            break;

        default:
            break;
        }
    }


    public objectCollision(o : GameObject, globalSpeed : number, event : ProgramEvent) : void {

        if (!this.exist)
            return;

        const y = event.screenHeight - this.pos.y;

        o.floorCollision(this.pos.x - this.width*8, y, 
            this.pos.x + this.width*8, y, globalSpeed, event);
    }
}
