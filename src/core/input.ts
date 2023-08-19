

export const enum InputState {

    Up = 0,
    Down = 1,
    Released = 2,
    Pressed = 3,

    DownOrPressed = 1,
}


class InputAction {


    public readonly keys : string[];
    // gamepadButtons : number[]


    constructor(keys : string[]) {

        this.keys = Array.from(keys);
    }
}


export class InputManager {


    private keys : Map<string, InputState>;
    private prevent : Array<string>;
    private actions : Map<string, InputAction>;

    private anyKeyPressed : boolean = false;


    public get anyPressed() : boolean {

        return this.anyKeyPressed; // || this.anyGamepadButtonPressed;
    }


    constructor() {

        this.keys = new Map<string, InputState> ();
        this.prevent = new Array<string> ();
        this.actions = new Map<string, InputAction> ();

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            if (this.prevent.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Pressed);
        });

        window.addEventListener("keyup", (e : KeyboardEvent) => {

            if (this.prevent.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Released);
        });

        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());
        // The bottom two are mostly needed if this game is ever being
        // run inside an iframe
        window.addEventListener("mousemove", () => window.focus());
        window.addEventListener("mousedown", () => window.focus());
    }


    private keyEvent(key : string, state : InputState) : void {

        if (this.keys.get(key) === state-2)
            return;

        this.keys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    public update() : void {

        let v : InputState | undefined;

        for (let k of this.keys.keys()) {

            if ((v = this.keys.get(k) as InputState) > 1) {
                
                this.keys.set(k, v-2);
            }
        }

        this.anyKeyPressed = false;
    }


    public addAction(name : string, keys : string[]) : void {

        this.actions.set(name, new InputAction(keys));
    }


    public getAction(name : string) : InputState {

        const a = this.actions.get(name);
        if (a === undefined)
            return InputState.Up;

        let state = InputState.Up;
        for (let k of a.keys) {
            
            if ( ( state = (this.keys.get(k) ?? InputState.Up) ) != InputState.Up)
                break;
        }
        return state;
    }
}
