import { Ramp, Sample } from "./sample.js";


export class AudioPlayer {


    private ctx : AudioContext;

    private globalVolume : number;
    private enabled : boolean;

    // TODO: Remove in the final version?
    private errorLogged = false;


    constructor(globalVolume = 1.0) {

        this.ctx = new AudioContext();

        this.enabled = true;
        this.globalVolume = globalVolume;
    }


    public createSample = (sequence : number[], 
        baseVolume = 1.0,
        type : OscillatorType = "square",
        ramp : Ramp = Ramp.Exponential,
        fadeVolumeFactor : number = 0.5) : Sample => new Sample(this.ctx, sequence, baseVolume, type, ramp, fadeVolumeFactor);


    public playSample(s : Sample | undefined, volume = 1.0) : void {

        if (!this.enabled || s === undefined)
            return;

        try {

            s.play(volume * this.globalVolume);
        }
        catch (e) {

            // TODO: Possibly remove from the final version to save bytes
            if (!this.errorLogged) {

                console.log("Audio error: " + e);
                this.errorLogged = true;
            }
        }
    }


    public toggle = (state = !this.enabled) : boolean => (this.enabled = state);


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    public isEnabled = () : boolean => this.enabled;

}
