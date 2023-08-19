import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";



export const drawBox = (canvas : Canvas, 
    x : number, y : number, w : number, h : number, 
    colors : string[], shadowOffset = 0) : void => {

    const len = colors.length;

    if (shadowOffset > 0) {

        canvas.fillColor("rgba(0, 0, 0, 0.33)");
        canvas.fillRect(x + shadowOffset, y + shadowOffset, w, h);
    }

    for (let i = 0; i < len; ++ i) {

        canvas.fillColor(colors[i]);
        canvas.fillRect(x + i, y + i, w - i*2, h - i*2);
    }
}


export const drawTextBox = (canvas : Canvas, font : Bitmap | undefined,
    text : string, dx : number, dy : number, xoff : number, yoff : number, 
    colors : string[], shadowOffset = 0) : void => {

    const BOX_OFFSET = 3;

    // TODO: Computing the width every frame might be a waste
    // of computing power, even though it saves some space.
    const lines = text.split("\n");
    const width = Math.max(...lines.map(l => l.length)) * (8 + xoff);
    const height = lines.length * yoff;

    const x = dx - width/2;
    const y = dy - height/2;

    drawBox(canvas, 
        x - BOX_OFFSET, 
        y - BOX_OFFSET, 
        width + BOX_OFFSET*2, 
        height + BOX_OFFSET*2, colors,
        shadowOffset);

    canvas.drawText(font, text, x + 1, y + 1, xoff, yoff - 8);
}
