import { Coordinates, Pair } from "./index.js";

export enum Slope {
    Veritcal,
    Steep,
    Uniform,
    Gentle,
    Convex,
    Concave
};

export interface Terrain {
    Coordinates: Coordinates,
    Elevation: number,
    Slope: Pair<Slope, number>,
    Aspect: number
};