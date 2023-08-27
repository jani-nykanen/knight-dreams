

export type Bitmap = HTMLImageElement | HTMLCanvasElement;


const unpackPalette = (palette : string[]) : number[][] => {

    let out = new Array<number[]> ();
    let len : number;

    for (let j = 0; j < palette.length; ++ j) {

        len = (palette[j].length/2) | 0;
        out.push(new Array<number> (len));
        for (let i = 0; i < len; ++ i) {

            out[j][i] = parseInt(palette[j].substring(i*2, i*2 + 2), 16);
        }
    }
    return out;
}   


const convertTile = (imageData : ImageData, 
    dx : number, dy : number, dw : number, dh : number, offset : number,
    colorTable : number[], palette : number[][]) : void => {

    let paletteEntry : number[];
    let i : number;

    for (let y = dy; y < dy + dh; ++ y) {

        for (let x = dx; x < dx + dw; ++ x) {

            i = y * offset + x;
            paletteEntry = palette[colorTable[(imageData.data[i*4] / 85) | 0]];

            for (let j = 0; j < 4; ++ j) {

                imageData.data[i*4 + j] = paletteEntry[j];
            }
        }
    }
}


// Unused (for now)
/*
const convertToRGB222 = (imageData : ImageData, len : number, alphaThreshold = 128) : void => {

    for (let i = 0; i < len; ++ i) {

        for (let j = 0; j < 3; ++ j) {

            imageData.data[i*4 + j] = Math.floor(imageData.data[i*4 + j] / 85) * 85;
        }
        imageData.data[i*4 + 3] = imageData.data[i*4 + 3] < alphaThreshold ? 0 : 255;
    }
} 
*/


const convertToMonochrome = (imageData : ImageData, 
    color : [number, number, number],
    len : number, alphaThreshold = 128) : void => {

    for (let i = 0; i < len; ++ i) {

        for (let j = 0; j < 3; ++ j) {

            imageData.data[i*4 + j] = color[j];
        }
        imageData.data[i*4 + 3] = imageData.data[i*4 + 3] < alphaThreshold ? 0 : 255;
    }
} 



const applyPalette = (image : Bitmap | undefined,
    colorTables: (string | undefined) [], packedPalette : string[],
    gridWidth : number = 8, gridHeight : number = 8, 
    startLine : number = 0, endLine : number = ( (image?.height ?? 0) / gridHeight) | 0) : Bitmap | undefined => {

    if (image === undefined)
        return undefined;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    const w = (canvas.width / gridWidth) | 0;
    const h = (canvas.height / gridHeight) | 0;

    // Faster than accessing image each tile?
    const imgWidth = image.width;

    const palette = unpackPalette(packedPalette);
    let colorTable : number[];

    let j = 0;
    for (let y = Math.max(0, startLine); y < Math.min(y + h, endLine + 1); ++ y) {

        for (let x = 0; x < w; ++ x) {

            if (j >= colorTables.length)
                continue;

            colorTable = (colorTables[j] ?? "0000").split("").map((s : string) => parseInt(s, 32));
            convertTile(imageData, 
                x*gridWidth, y*gridWidth, gridWidth, gridHeight, 
                imgWidth, colorTable, palette);

            ++ j;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas as Bitmap;
} 


const createCustom = (width : number, height : number, params : (Bitmap | undefined) [] | undefined,
    event : (c : CanvasRenderingContext2D, width : number, height : number, params : (Bitmap | undefined) [] | undefined) => void,
    monochromeColor : [number, number, number] | undefined = undefined, alphaThreshold = 128) : Bitmap => {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = width;
    canvas.height = height;

    event(ctx, width, height, params);

    let imageData : ImageData;
    if (monochromeColor) {

        ctx.drawImage(canvas, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        convertToMonochrome(imageData, 
            monochromeColor, width*height, alphaThreshold);
        ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
}


export const BitmapGenerator ={

    applyPalette: applyPalette,
    createCustom: createCustom
};
