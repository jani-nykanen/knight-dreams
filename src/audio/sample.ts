import { clamp } from "../common/math.js";


export const enum Ramp {

    Instant = 0,
    Linear = 1,
    Exponential = 2
};


export class Sample {


    private readonly ctx : AudioContext;

    private baseSequence : number[];
    private baseVolume : number;
    private type : OscillatorType;
    private ramp : Ramp;
    private attackTime : number;

    private oscillator : OscillatorNode | undefined = undefined;


    constructor(ctx : AudioContext, sequence : number[], 
        baseVolume : number, type : OscillatorType,
        ramp : Ramp, attackTime : number) {

        this.ctx = ctx;

        this.baseSequence = Array.from(sequence);

        this.baseVolume = baseVolume;
        this.type = type;
        this.ramp = ramp;
        this.attackTime = attackTime;
    }


    public play(volume : number) : void {

        const INITIAL_VOLUME = 0.20;
        const FUNC = [ "setValueAtTime", "linearRampToValueAtTime", "exponentialRampToValueAtTime" ];

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = this.type;

        volume *= this.baseVolume;

        osc.frequency.setValueAtTime(this.baseSequence[0], time);
        gain.gain.setValueAtTime(INITIAL_VOLUME*volume, time);
        gain.gain.exponentialRampToValueAtTime(clamp(volume, 0.01, 1.0), time + this.attackTime/60.0);

        let timer = 0.0;
        let freq : number;
        let len : number;
        for (let i = 0; i < this.baseSequence.length; i += 2) {

            freq = this.baseSequence[i];
            len = this.baseSequence[i + 1];
/*
            switch (this.ramp) {
            
            case Ramp.Instant:
                osc.frequency.setValueAtTime(freq, time + timer);
                break;

            case Ramp.Linear:
                osc.frequency.linearRampToValueAtTime(freq, time + timer);
                break;

            case Ramp.Exponential:
                osc.frequency.exponentialRampToValueAtTime(freq, time + timer);
                break;

            default:
                break;
            }
            */
            
            osc.frequency[FUNC[this.ramp]](freq, time + timer);
            timer += 1.0/60.0*len;
        }
        gain.gain.exponentialRampToValueAtTime(volume*0.50, time + timer);
        
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(time);

        osc.stop(time + timer);
        osc.onended = () : void => osc.disconnect();
        
        this.oscillator?.disconnect();
        this.oscillator = osc;
    }
}
