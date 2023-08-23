import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { GameObject} from "./gameobject.js";


export class Camera {


    private y : number;


    constructor(y = 0) {

        this.y = 0;
    }


    public followObject(o : GameObject, event : ProgramEvent) : void {

        const VERTICAL_DEADZONE = 16;
        const RANGE_OFFSET = 24;

        const py = o.getPosition().y - event.screenHeight/2 + RANGE_OFFSET;

        // TEMP
        let d = this.y - py;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {

            this.y = py + VERTICAL_DEADZONE * Math.sign(d);
        }
        
        this.y = Math.min(0, this.y);
    }


    public use(canvas : Canvas) : void {

        canvas.moveTo(0, -Math.round(this.y));
    }

}
