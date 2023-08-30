import { Bitmap } from "../renderer/bitmap.js";
import { Canvas, Flip } from "../renderer/canvas.js";


export const drawPropeller = (canvas : Canvas, bmp : Bitmap, 
    frame : number, dx : number, dy : number) : void => {

    const PROPELLER_FLIP = [Flip.None, Flip.None, Flip.None, Flip.Horizontal];
    const PROPELLER_SX = [32, 48, 56, 48];
    const PROPELLER_SW = [16, 8, 8, 8];

    const sw = PROPELLER_SW[frame];

    canvas.drawBitmap(bmp, 
        dx + (16 - sw)/2, dy - 6, 
        PROPELLER_SX[frame], 48, sw, 8, 
        PROPELLER_FLIP[frame]);
}
