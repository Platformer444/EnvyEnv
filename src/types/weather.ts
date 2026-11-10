import { Coordinates, Pair } from "./index.js";

export enum Temperature {
    Cold = "Cold",
    Normal = "Normal",
    Hot = "Hot"
};
export enum WeatherCondition {
    Clear = "Clear",
    Cloudy = "Cloudy",
    Fog = "Foggy",
    Rain = "Rainy",
    Snow = "Snowy",
    Thunderstorm = "Thunderstorms",
    FreezingPrecipitation = "Freezing Precipitation",
    Unknown = "Unknown"
};
export enum Season {
    Wet = "Wet",
    Dry = "Dry",

    PreMonsoon = "Pre-Monsoon",
    Monsoon = "Monsoon",
    PostMonsoon = "Post-Monsoon",

    Hot = "Hot",
    Warm = "Warm",
    Mild = "Mild",
    Cool = "Cool",
    Cold = "Cold",

    Spring = "Spring",
    Autumn = "Autumn",
    Summer = "Summer",
    Winter = "Winter",
    PolarThaw = "Polar Thaw",
    PolarFrost = "Polar Frost",

    Unknown = "Unknown"
};
export enum ClimateClassification {
    Tropical_Rainforest = "Af",
    Tropical_Monsoon = "Am",
    Tropical_Savannah = "Aw",
    Arid_HotDesert = "BWh",
    Arid_ColdDesert = "BWk",
    Arid_HotSteppe = "BSh",
    Arid_ColdSteppe = "BSk",
    Temperate_DryHotSummer = "Csa",
    Temperate_DryWarmSummer = "Csb",
    Temperate_DryColdSummer = "Csc",
    Temperate_DryWinterHotSummer = "Cwa",
    Temperate_DryWinterWarmSummer = "Cwb",
    Temperate_DryWinterColdSummer = "Cwc",
    Temperate_HotSummer = "Cfa",
    Temperate_WarmSummer = "Cfb",
    Temperate_ColdSummer = "Cfc",
    Cold_DryHotSummer = "Dsa",
    Cold_DryWarmSummer = "Dsb",
    Cold_DryColdSummer = "Dsc",
    Cold_DrySummerColdWinter = "Dsd",
    Cold_DryWinterHotSummer = "Dwa",
    Cold_DryWinterWarmSummer = "Dwb",
    Cold_DryWinterColdSummer = "Dwc",
    Cold_DryColdWinter = "Dwd",
    Cold_HotSummer = "Dfa",
    Cold_WarmSummer = "Dfb",
    Cold_ColdSummer = "Dfc",
    Cold_ColdWinter = "Dfd",
    Polar_Tundra = "ET",
    Polar_Frost = "EF"
};
export enum TemperatureVariation {
    VeryHigh = "Very High",
    High = "High",
    Moderate = "Moderate",
    Low = "Low",
    VeryLow = "Very Low"
};
export enum PrecipitationIntensity {
    VeryWet = "Very Wet",
    Wet = "Wet",
    Moderate = "Moderate",
    Dry = "Dry",
    VeryDry = "Very Dry"
};
export enum PrecipitationFrequency {
    VeryInfrequent = "Very Infrequent",
    Infrequent = "Infrequent",
    Moderate = "Moderate",
    Frequent = "Frequent",
    VeryFreqeunt = "Very Frequent",
    Continuous = "Continuous"
};

export type MultiDurationalReport = Record<
    number,
    {
        Temp_C: number,
        Prec_mm: number,
        Rain_mm: number,
        Snow_cm: number,
        Days: number,
        WetDays: number
    }
>;
export type Weather = {
    Coordinates: Coordinates,
    Time: Date,
    Timezone: string,
    ClimateClassification: ClimateClassification,
    Season: Season,
    Temperature: Pair<Temperature, number>,
    WeatherCondition: Pair<WeatherCondition, number>,
    RelativeHumidity: number,
    CloudCover: number,
    WindSpeed: number
};