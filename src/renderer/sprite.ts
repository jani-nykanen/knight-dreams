

export class Sprite {


    private frame : number = 0;
    private timer : number = 0.0;


    private nextFrame(dir : number, startFrame : number, endFrame : number) : void {

        this.frame += dir;

        const min = Math.min(startFrame, endFrame);
        const max = Math.max(startFrame, endFrame);

        if (this.frame < min)
            this.frame = max;
        else if (this.frame > max)
            this.frame = min;
    } 

    
    public animate(startFrame : number, endFrame : number, 
        frameTime : number, step : number) : void {

        const dir = Math.sign(endFrame - startFrame);

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

    public setFrame(frame : number) : void {

        this.frame = frame;
    }


    public getFrame = () : number => this.frame;
}
