import { Coordinates } from "./types/index.js";
import { Weather } from "./types/weather.js";
import EnvyEnvWeather from "./weather.js";

export default class EnvyEnv {
    public static readonly Weather: { GetWeather: (Coordinates: Coordinates) => Promise<Weather> } = EnvyEnvWeather;
};