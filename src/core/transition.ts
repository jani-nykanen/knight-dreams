import { Canvas } from "../renderer/canvas.js";
import { ProgramEvent } from "./event.js";


export const enum TransitionType {
    None = 0,
    Fade = 1,
    Circle = 2
};


export class TransitionManager {


    private timer : number = 1.0;
    private fadeOut : boolean = false;
    private effectType : TransitionType = TransitionType.None;
    private active : boolean = false;
    private speed : number = 1.0;

    private callback : ((event : ProgramEvent) => void) | undefined = undefined;


    public activate(fadeOut : boolean, type : TransitionType, speed : number, 
        callback : ((event : ProgramEvent) => void) | undefined = undefined) : void {

        this.fadeOut = fadeOut;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;

        this.active = true;
    }


    public update(event : ProgramEvent) : void {

        if (!this.active) return;

        if ((this.timer -= this.speed * event.tick) <= 0) {

            if (!(this.fadeOut = !this.fadeOut)) {

                this.timer += 1.0;
                this.callback?.(event);
                return;
            }

            this.active = false;
            this.timer = 0;
        }
    }


    public draw(canvas : Canvas) : void {

        if (!this.active || this.effectType == TransitionType.None)
            return;

        let t = this.timer;
        if (this.fadeOut)
            t = 1.0 - t;

        let maxRadius : number;
        let radius : number;
        
        switch (this.effectType) {

        case TransitionType.Fade:

            canvas.clear("rgba(0, 0, 0, " + String(t) + ")");
            break;

        case TransitionType.Circle:

            maxRadius = Math.max(
                Math.hypot(canvas.width/2, canvas.height/2),
                Math.hypot(canvas.width - canvas.width/2, canvas.height/2),
                Math.hypot(canvas.width - canvas.width/2, canvas.height - canvas.height/2),
                Math.hypot(canvas.width/2, canvas.height - canvas.height/2)
            );

            // TODO: Use sqrt(t) or t*t instead (or even sin(t * Math.PI/2)) for a smoother
            // transition?
            radius = (1 - t) * maxRadius;
            canvas.fillColor("black");
            canvas.fillCircleOutside(radius);

            break;

        default:
            break;
        }
    }


    public isActive = () : boolean => this.active;
    public isFadingOut = () : boolean => this.active && this.fadeOut;

    
    public deactivate() : void {

        this.active = false;
    }
}
