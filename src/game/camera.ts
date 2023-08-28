import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject} from "./gameobject.js";


export class Camera {


    private y : number;
    private speed : number = 1.0;


    constructor(y = 0) {

        this.y = y;
    }


    public reachInitialPoint(event : ProgramEvent) : boolean {

        const DELTA = 0.1;
        const MAX_SPEED = 4.0;

        this.speed = Math.min(MAX_SPEED, this.speed + DELTA*event.tick);

        if ((this.y += this.speed*event.tick) >= 0) {

            this.y = 0;
            return true;
        }
        return false;
    }


    public followObject(o : GameObject, event : ProgramEvent) : void {

        const VERTICAL_DEADZONE = 16;
        const RANGE_OFFSET = 24;

        const py = o.getPosition().y - event.screenHeight/2 + RANGE_OFFSET;

        // TEMP (or not?)
        let d = this.y - py;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {

            this.y = py + VERTICAL_DEADZONE * Math.sign(d);
        }
        
        this.y = Math.min(0, this.y);
    }


    public use(canvas : Canvas) : void {

        canvas.moveTo(0, -Math.round(this.y));
    }


    public getPosition = () : number => this.y;


    public reset() : void {

        this.y = 0;
    }
}
