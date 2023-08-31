import {  Sample } from "../audio/sample.js";
import { Bitmap } from "../renderer/bitmap.js";


export class AssetManager {

    
    private bitmaps : Map<string, Bitmap>;
    private samples : Map<string, Sample>;

    private loaded : number = 0;
    private totalAssets : number = 0;

    // private emptyImage : Bitmap;


    constructor() {

        this.bitmaps = new Map<string, Bitmap> ();
        this.samples = new Map<string, Sample> ();

        // Faster than dealing with undefined
        // this.emptyImage = new Image(1, 1);
    }


    public addBitmap(name : string, bmp : Bitmap) : void {

        this.bitmaps.set(name, bmp);
    }


    public loadBitmap(name : string, path : string) : void {

        const img = new Image();

        img.onload = () => {

            this.addBitmap(name, img);
            ++ this.loaded;
        }
        img.src = path;

        ++ this.totalAssets;
    }


    public addSample(name : string, sample : Sample) : void {

        this.samples.set(name, sample);
    }


    public getBitmap = (name : string) : Bitmap => this.bitmaps.get(name) as Bitmap; // ?? this.emptyImage;
    public getSample = (name : string) : Sample | undefined => this.samples.get(name);


    public hasLoaded = () : boolean => this.loaded >= this.totalAssets;
}
