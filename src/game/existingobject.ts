


export class ExistingObject {


    protected exist : boolean = false;


    public doesExist = () : boolean => this.exist;


    public forceKill() : void {

        this.exist = false;
    }
}



export function next<T extends ExistingObject> (type : Function, arr : T[]) : T {

    for (let o of arr) {

        if (!o.doesExist())
            return o;
    }

    let o = new type.prototype.constructor();
    arr.push(o);

    return o;
}
