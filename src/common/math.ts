

export const negMod = (m : number, n : number) : number => ((m % n) + n) % n;


export const clamp = (x : number, min : number, max : number) : number => Math.max(Math.min(x, max), min);
