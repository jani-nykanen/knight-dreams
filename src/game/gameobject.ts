import { Vector } from "../common/vector.js";
import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";
import { ExistingObject } from "./existingobject.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {

    if (speed < target) {

        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
}


export class GameObject extends ExistingObject {


    protected pos : Vector;
    protected speed : Vector;
    protected target : Vector;
    protected friction : Vector;

    protected hitbox : Vector;
    protected center : Vector;

    protected dying : boolean = false;
    protected touchSurface : boolean = false;

    protected getCollision : boolean = true;


    constructor(x = 0, y = 0) {

        super();

        this.pos = new Vector(x, y);

        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);

        this.hitbox = new Vector();
        this.center = new Vector();
    }


    protected updateEvent?(globalSpeed : number, event : ProgramEvent) : void;
    protected die(globalSpeed : number, event : ProgramEvent) : boolean { return true; }


    protected move(event : ProgramEvent) : void {

        this.speed.x = updateSpeedAxis(
            this.speed.x, this.target.x, 
            this.friction.x*event.tick);
        this.speed.y = updateSpeedAxis(
            this.speed.y, this.target.y, 
            this.friction.y*event.tick);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    protected floorCollisionEvent(event : ProgramEvent) : void {}


    public update(globalSpeed : number, event : ProgramEvent) : void {

        if (!this.exist) 
            return;

        if (this.dying) {

            if (this.die(globalSpeed, event)) {

                this.dying = false;
                this.exist = false;
            }
            return;
        }

        this.updateEvent?.(globalSpeed, event);
        this.move(event);

        this.touchSurface = false;
    }


    public draw?(canvas : Canvas, assets : AssetManager) : void;


    public forceKill() : void {

        this.exist = false;
        this.dying = false;
    }
    

    public isDying = () : boolean => this.dying;
    public getPosition = () : Vector => this.pos.clone();


    public doesOverlayRect= (pos : Vector, center : Vector, hitbox : Vector) : boolean => 
        this.pos.x + this.center.x + this.hitbox.x/2 >= pos.x + center.x - hitbox.x/2 &&
        this.pos.x + this.center.x - this.hitbox.x/2 <= pos.x + center.x + hitbox.x/2 &&
        this.pos.y + this.center.y + this.hitbox.y/2 >= pos.y + center.y - hitbox.y/2 &&
        this.pos.y + this.center.y - this.hitbox.y/2 <= pos.y + center.y + hitbox.y/2;


    public doesOverlay = (o : GameObject) : boolean => this.doesOverlayRect(o.pos, o.center, o.hitbox);


    public floorCollision(x1 : number, y1 : number, x2 : number, y2 : number, 
        globalSpeed : number, event : ProgramEvent,
        leftMargin = 1, rightMargin = 1, 
        speedCheckLimit = 0.0,
        topMargin = 2, bottomMargin = 8) : boolean {

        // The case x1 > x2 can be ignored since it never happens anyway
        // But to save bytes, let's just pretend it never happens anyway!
        // if (x1 >= x2)
        //    return false;

        if (!this.getCollision ||
            !this.exist || this.dying ||
            this.speed.y <= speedCheckLimit ||
            this.pos.x + this.center.x + this.hitbox.x/2*leftMargin < x1 ||
            this.pos.x + this.center.x - this.hitbox.x/2*rightMargin > x2)
            return false;

        const k = (y2 - y1) / (x2 - x1);
        const b = y1 - k*x1;
        const y0 = this.pos.x*k + b;

        const bottom = this.pos.y + this.center.y + this.hitbox.y/2;

        const hmod = Math.abs(k*(this.speed.x + globalSpeed))*event.tick;
        const vmod = Math.abs(this.speed.y)*event.tick;

        if (bottom < y0 + bottomMargin + vmod + hmod && 
            bottom >= y0 - topMargin - hmod) {

            this.pos.y = y0 - this.center.y - this.hitbox.y/2;
            this.speed.y = 0;

            this.touchSurface = true;

            this.floorCollisionEvent(event);

            return true;
        }
        return false;
    }


    public hurtCollision?(x : number, y : number, w : number, h : number, event : ProgramEvent) : boolean;
}
