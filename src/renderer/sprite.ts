import { Bitmap } from "./bitmap.js";
import { Canvas, Flip } from "./canvas.js";


export class Sprite {


    private column : number = 0;
    private row : number = 0;
    private timer : number = 0.0;

    public readonly width : number;
    public readonly height : number;


    constructor(width : number, height : number) {

        this.width = width;
        this.height = height;
    }


    private nextFrame(dir : number, startFrame : number, endFrame : number) : void {

        this.column += dir;

        const min = Math.min(startFrame, endFrame);
        const max = Math.max(startFrame, endFrame);

        if (this.column < min)
            this.column = max;
        else if (this.column > max)
            this.column = min;
    } 

    
    public animate(row : number,
        startFrame : number, endFrame : number, 
        frameTime : number, step : number) : void {

        const dir = Math.sign(endFrame - startFrame);

        if (row != this.row) {
            
            this.column = startFrame;
            this.timer = 0;

            this.row = row;
        }

        if (frameTime <= 0) {

            this.nextFrame(dir, startFrame, endFrame);
            return;
        }

        this.timer += step;
        while (this.timer >= frameTime) {

            this.timer -= frameTime;
            this.nextFrame(dir, startFrame, endFrame);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined, 
        dx : number, dy : number, flip : Flip = Flip.None, angle = 0,
        centerx = this.width/2, centery = this.height/2) : void {

        canvas.drawBitmap(bmp, dx, dy,
            this.column*this.width, this.row*this.height, this.width, this.height, 
            flip, angle, centerx, centery);
    }


    public setFrame(column : number, row : number) : void {

        this.column = column;
        this.row = row;
    }


    public getColumn = () : number => this.column;
    public getRow = () : number => this.row;
}
