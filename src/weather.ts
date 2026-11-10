import { fetchWeatherApi } from "openmeteo";
import { fromFile, GeoTIFFImage } from "geotiff";
import { Coordinates } from "./types/index.js";
import { Season, Weather, Temperature, WeatherCondition, ClimateClassification, PrecipitationIntensity, PrecipitationFrequency, MultiDurationalReport, TemperatureVariation } from "./types/weather.js";

export default class EnvyEnvWeather {
    private static readonly ClimateClassificationLegend: Record<number, ClimateClassification> = {
        1: ClimateClassification.Tropical_Rainforest,
        2: ClimateClassification.Tropical_Monsoon,
        3: ClimateClassification.Tropical_Savannah,
        4: ClimateClassification.Arid_HotDesert,
        5: ClimateClassification.Arid_ColdDesert,
        6: ClimateClassification.Arid_HotSteppe,
        7: ClimateClassification.Arid_ColdSteppe,
        8: ClimateClassification.Temperate_DryHotSummer,
        9: ClimateClassification.Temperate_DryWarmSummer,
        10: ClimateClassification.Temperate_DryColdSummer,
        11: ClimateClassification.Temperate_DryWinterHotSummer,
        12: ClimateClassification.Temperate_DryWinterWarmSummer,
        13: ClimateClassification.Temperate_DryWinterColdSummer,
        14: ClimateClassification.Temperate_HotSummer,
        15: ClimateClassification.Temperate_WarmSummer,
        16: ClimateClassification.Temperate_ColdSummer,
        17: ClimateClassification.Cold_DryHotSummer,
        18: ClimateClassification.Cold_DryWarmSummer,
        19: ClimateClassification.Cold_DryColdSummer,
        20: ClimateClassification.Cold_DrySummerColdWinter,
        21: ClimateClassification.Cold_DryWinterHotSummer,
        22: ClimateClassification.Cold_DryWinterWarmSummer,
        23: ClimateClassification.Cold_DryWinterColdSummer,
        24: ClimateClassification.Cold_DryColdWinter,
        25: ClimateClassification.Cold_HotSummer,
        26: ClimateClassification.Cold_WarmSummer,
        27: ClimateClassification.Cold_ColdSummer,
        28: ClimateClassification.Cold_ColdWinter,
        29: ClimateClassification.Polar_Tundra,
        30: ClimateClassification.Polar_Frost
    };

    private static readonly AnalysisDuration_Years: number = 30;

    private static async GetAnnualClimate(Coordinates: Coordinates, StartYear: number, EndYear: number): Promise<MultiDurationalReport> {
        const Response = (await fetchWeatherApi(
            'https://archive-api.open-meteo.com/v1/archive',
            {
                latitude: Coordinates.Latitude,
                longitude: Coordinates.Longitude,
                daily: [ "temperature_2m_mean", "precipitation_sum", "rain_sum", "snowfall_sum" ],
                start_date: `${StartYear}-01-01`,
                end_date: `${EndYear}-12-31`,
                timezone: 'auto',
                models: 'era5'
            }
        ))[0];
        const Report = Response.daily()!

        const Time_s = Array.from(
			{ length: (Number(Report.timeEnd()) - Number(Report.time())) / Report.interval() }, 
			(_ , i) => new Date((Number(Report.time()) + i * Report.interval() + Response.utcOffsetSeconds()) * 1000)
		);
        const Temp_C = Report.variables(0)!.valuesArray()!;
        const Prec_mm = Report.variables(1)!.valuesArray()!;
        const Rain_mm = Report.variables(2)!.valuesArray()!;
        const Snow_cm = Report.variables(3)!.valuesArray()!;

        const Data: MultiDurationalReport = {};

        Time_s.forEach(
            (Time, Index) => {
                const Month = Time.getUTCMonth();

                const Temperature = Temp_C[Index];
                const Precipitation = Prec_mm[Index];
                const Rain = Rain_mm[Index];
                const Snowfall = Snow_cm[Index];

                if (!Data[Month]) Data[Month] = { Temp_C: Temperature, Prec_mm: Precipitation, Rain_mm: Rain, Snow_cm: Snowfall, Days: 1, WetDays: Precipitation >= 1 ? 1 : 0 };
                else {
                    Data[Month].Temp_C += Temperature;
                    Data[Month].Prec_mm += Precipitation;
                    Data[Month].Rain_mm += Rain;
                    Data[Month].Snow_cm += Snowfall;
                    Data[Month].Days += 1;
                    Data[Month].WetDays += Precipitation >= 1 ? 1 : 0
                }
            }
        );

        Object.values(Data).forEach(
            (Data) => {
                Data.Temp_C /= Data.Days;
                Data.Prec_mm /= Data.Days;
                Data.Rain_mm /= Data.Days;
                Data.Snow_cm /= Data.Days;
            }
        );

        return Data;
    };

    private static SeasonalAnalysis = {
        Temperature:
            (Data: MultiDurationalReport): { Variation: TemperatureVariation, Temperatures: number[], Hot: number[], Warm: number[], Mild: number[], Cool: number[], Cold: number[] } => {
                const TempVariation = (Deviation: number): TemperatureVariation => {
                    if (Deviation >= 15) return TemperatureVariation.VeryHigh;
                    else if (Deviation >= 10) return TemperatureVariation.High;
                    else if (Deviation >= 5) return TemperatureVariation.Moderate;
                    else if (Deviation >= 2) return TemperatureVariation.Low;
                    else return TemperatureVariation.VeryLow;
                };

                const Hot: number[] = [];
                const Warm: number[] = [];
                const Mild: number[] = [];
                const Cool: number[] = [];
                const Cold: number[] = [];

                const Temperatures = Object.values(Data).map(_ => _.Temp_C);

                const Days = Object.values(Data).reduce((A, B) => (A + B.Days), 0);

                const AnnualTemp_C = Object.values(Data).reduce((A, B) => A + B.Temp_C * B.Days, 0) / Days;
                const StandardDeviation = Math.sqrt(Temperatures.reduce((A, B) => (A + ((B - AnnualTemp_C) ** 2)), 0) / 12);

                Object.values(Data).forEach(
                    (Month, Index) => {
                        const Difference = Month.Temp_C - AnnualTemp_C;
                        if (Difference >= 6) Hot.push(Index);
                        else if (Difference >= 3) Warm.push(Index);
                        else if (Difference >= -3) Mild.push(Index);
                        else if (Difference >= -6) Cool.push(Index);
                        else Cold.push(Index);
                    }
                )

                return {
                    Variation: TempVariation(StandardDeviation),
                    Temperatures: Temperatures,
                    Hot: Hot,
                    Warm: Warm,
                    Mild: Mild,
                    Cool: Cool,
                    Cold: Cold
                };
            },

        Precipitation:
            (Data: MultiDurationalReport): {
                Intensity: PrecipitationIntensity,
                Frequency: PrecipitationFrequency,
                Precipitation: { High: number[], Low: number[] },
                Rain: { High: number[], Low: number[] },
                Snowfall: { High: number[], Low: number[] }
            } => {
                const CalculateVariation = (Data: number[]): { High: number[], Low: number[] } => {
                    const High: number[] = [];
                    const Low: number[] = [];

                    const Average = Data.reduce((A, B) => (A + B), 0) / 12;
                    const StandardDeviation = Math.sqrt(Data.reduce((A, B) => (A + ((B - Average) ** 2)), 0) / 12);
                    const CoefficientVariation = StandardDeviation / Average;

                    if (Average !== 0 && CoefficientVariation >= 0.5) {
                        Data.forEach((Data, Index) => {
                            if (Data >= Average) High.push(Index);
                            else Low.push(Index);
                        });
                    }

                    return {
                        High: High,
                        Low: Low
                    }
                };
                const PrecIntensity = (AnnualPrec_mm: number): PrecipitationIntensity => {
                    if (AnnualPrec_mm >= 2000) return PrecipitationIntensity.VeryWet;
                    else if (AnnualPrec_mm >= 1000) return PrecipitationIntensity.Wet;
                    else if (AnnualPrec_mm >= 500) return PrecipitationIntensity.Moderate;
                    else if (AnnualPrec_mm >= 250) return PrecipitationIntensity.Dry;
                    else return PrecipitationIntensity.VeryDry
                };
                const PrecFrequency = (WetFrequency: number): PrecipitationFrequency => {
                    if (WetFrequency >= 0.8) return PrecipitationFrequency.Continuous;
                    else if (WetFrequency >= 0.6) return PrecipitationFrequency.VeryFreqeunt;
                    else if (WetFrequency >= 0.4) return PrecipitationFrequency.Frequent;
                    else if (WetFrequency >= 0.25) return PrecipitationFrequency.Moderate;
                    else if (WetFrequency >= 0.1) return PrecipitationFrequency.Infrequent;
                    else return PrecipitationFrequency.VeryInfrequent;
                };

                const Precipitations = Object.values(Data).map(_ => _.Prec_mm);
                const Rains = Object.values(Data).map(_ => _.Rain_mm);
                const Snowfalls = Object.values(Data).map(_ => _.Snow_cm);
                
                const Days = Object.values(Data).map(_ => _.Days).reduce((A, B) => (A + B), 0);
                const WetDays = Object.values(Data).map(_ => _.WetDays).reduce((A, B) => (A + B), 0);

                const AnnualPrec_mm = Object.values(Data).reduce((A, B) => A + B.Prec_mm * B.Days, 0) / this.AnalysisDuration_Years;
                const AnnualRain_mm = Object.values(Data).reduce((A, B) => A + B.Rain_mm * B.Days, 0) / this.AnalysisDuration_Years;
                const AnnualSnow_cm = Object.values(Data).reduce((A, B) => A + B.Snow_cm * B.Days, 0) / this.AnalysisDuration_Years;


                const Precipitation = CalculateVariation(Precipitations);
                const Rain = CalculateVariation(Rains);
                const Snowfall = CalculateVariation(Snowfalls);
        
                return { Intensity: PrecIntensity(AnnualPrec_mm), Frequency: PrecFrequency(WetDays / Days), Precipitation: Precipitation, Rain: Rain, Snowfall: Snowfall };
            }
    };

    private static Temperature(Report: MultiDurationalReport, Temperature_C: number): Temperature {
        const Temperatures = Object.values(Report).map(_ => _.Temp_C).toSorted();
        const TemperatureThresholds = {
            Cold: Temperatures[Math.floor((Temperatures.length - 1) * (10 / 100))],
            Hot: Temperatures[Math.floor((Temperatures.length - 1) * (90 / 100))]
        };

        if (Temperature_C <= TemperatureThresholds.Cold) return Temperature.Cold;
        else if (Temperature_C >= TemperatureThresholds.Hot) return Temperature.Hot;
        else return Temperature.Normal;
    };

    private static WeatherCondition(WeatherCode: number): WeatherCondition {
        switch(WeatherCode) {
            case 0:
            case 1:
                return WeatherCondition.Clear;

            case 2:
            case 3:
                return WeatherCondition.Cloudy;

            case 45:
            case 48:
                return WeatherCondition.Fog;

            case 51:
            case 53:
            case 55:
            case 61:
            case 63:
            case 65:
            case 80:
            case 81:
            case 82:
                return WeatherCondition.Rain;

            case 71:
            case 73:
            case 75:
            case 77:
            case 85:
            case 86:
                return WeatherCondition.Snow;

            case 56:
            case 57:
            case 66:
            case 67:
                return WeatherCondition.FreezingPrecipitation;

            case 95:
            case 96:
            case 97:
            case 99:
                return WeatherCondition.Thunderstorm;

            default:
                return WeatherCondition.Unknown;
        }
    };

    private static async ClimateClassification(Coordinates: Coordinates): Promise<ClimateClassification> {
        const GeoImage: GeoTIFFImage = await (await fromFile(process.env.GEOTIFF_FILE || "./data/Koppen-Geiger.tif")).getImage();

        const [MinX, MinY, MaxX, MaxY] = GeoImage.getBoundingBox();
        const Width = GeoImage.getWidth();
        const Height = GeoImage.getHeight();

        const x = Math.min(Width - 1, Math.floor(((Coordinates.Longitude - MinX) / (MaxX - MinX)) * Width));
        const y = Math.min(Height - 1, Math.floor(((MaxY - Coordinates.Latitude) / (MaxY - MinY)) * Height));

        const Value = Number((await GeoImage.readRasters({ window: [ x, y, x + 1, y + 1 ] }))[0]![0]);

        return this.ClimateClassificationLegend[Value];
    };

    private static Season(Report: MultiDurationalReport, ClimateClass: ClimateClassification, Month: number): Season {
        const SpringSummerAutumnWinter = (Temperatures: number[], Month: number): Season => {
            const M = Math.max(...Temperatures);
            const m = Math.min(...Temperatures);
            const T1 = Temperatures[Math.floor((Temperatures.length - 1) * (75 / 100))];
            const T2 = Temperatures[Math.floor((Temperatures.length - 1) * (25 / 100))];

            const Temp_C = Temperatures[Month];

            if (Temp_C > T1 && Temp_C <= M) return Season.Summer;
            else if (Temp_C < T2 && Temp_C >= m) return Season.Winter;
            else {
                const Base = Temperatures.indexOf(m);
                const Peak = Temperatures.indexOf(M);
                if ((((Peak - Base) + 12) % 12) > (((Month - Base) + 12) % 12)) return Season.Spring;
                else return Season.Autumn;
            }
        };

        const Temperature = this.SeasonalAnalysis.Temperature(Report);
        const Precipitation = this.SeasonalAnalysis.Precipitation(Report);

        switch (ClimateClass) {
            case ClimateClassification.Tropical_Rainforest:
                return Season.Wet;
            case ClimateClassification.Tropical_Monsoon:
            case ClimateClassification.Tropical_Savannah:
                if (Precipitation.Precipitation.High.includes(Month)) return Season.Wet;
                else if (Precipitation.Precipitation.Low.includes(Month)) return Season.Dry;
                else {
                    if (Precipitation.Frequency === PrecipitationFrequency.Continuous || Precipitation.Frequency === PrecipitationFrequency.VeryFreqeunt) {
                        if (Precipitation.Intensity === PrecipitationIntensity.VeryWet || Precipitation.Intensity === PrecipitationIntensity.Wet) return Season.Wet;
                        else return Season.Dry;
                    }
                    else return Season.Dry;
                }
            
            case ClimateClassification.Arid_HotDesert:
            case ClimateClassification.Arid_ColdDesert:
            case ClimateClassification.Arid_HotSteppe:
            case ClimateClassification.Arid_ColdSteppe:
                if (Temperature.Hot.includes(Month)) return Season.Hot;
                if (Temperature.Warm.includes(Month)) return Season.Warm;
                if (Temperature.Mild.includes(Month)) return Season.Mild;
                if (Temperature.Cool.includes(Month)) return Season.Cool;
                if (Temperature.Cold.includes(Month)) return Season.Cold;
            
            case ClimateClassification.Temperate_DryHotSummer:
            case ClimateClassification.Temperate_DryWarmSummer:
            case ClimateClassification.Temperate_DryColdSummer:
            case ClimateClassification.Temperate_DryWinterHotSummer:
            case ClimateClassification.Temperate_DryWinterWarmSummer:
            case ClimateClassification.Temperate_DryWinterColdSummer:
            case ClimateClassification.Temperate_HotSummer:
            case ClimateClassification.Temperate_WarmSummer:
            case ClimateClassification.Temperate_ColdSummer:
                return SpringSummerAutumnWinter(Temperature.Temperatures, Month);
            
            case ClimateClassification.Cold_DryHotSummer:
            case ClimateClassification.Cold_DryWarmSummer:
            case ClimateClassification.Cold_DryColdSummer:
            case ClimateClassification.Cold_DrySummerColdWinter:
            case ClimateClassification.Cold_DryWinterHotSummer:
            case ClimateClassification.Cold_DryWinterWarmSummer:
            case ClimateClassification.Cold_DryWinterColdSummer:
            case ClimateClassification.Cold_DryColdWinter:
            case ClimateClassification.Cold_HotSummer:
            case ClimateClassification.Cold_WarmSummer:
            case ClimateClassification.Cold_ColdSummer:
            case ClimateClassification.Cold_ColdWinter:
                return SpringSummerAutumnWinter(Temperature.Temperatures, Month);

            case ClimateClassification.Polar_Tundra:
                if (Temperature.Temperatures[Month] >= 0) return Season.PolarThaw;
                else return Season.PolarFrost;
            case ClimateClassification.Polar_Frost:
                return Season.PolarFrost;
        }

        return Season.Unknown;
    };

    public static async GetWeather(Coordinates: Coordinates): Promise<Weather> {
        const Response = (await fetchWeatherApi(
            'https://api.open-meteo.com/v1/forecast',
            {
                latitude: Coordinates.Latitude,
                longitude: Coordinates.Longitude,
                current: [ "temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover", "wind_speed_10m", "weather_code" ],
                timezone: 'auto'
            }
        ))[0];
        const Report = Response.current()!;

        const CurrentTime = new Date((Number(Report.time()) + Response.utcOffsetSeconds()) * 1000);

        const ReportDurational = await this.GetAnnualClimate(Coordinates, CurrentTime.getUTCFullYear() - this.AnalysisDuration_Years, CurrentTime.getUTCFullYear() - 1);

        const ClimateClassification = await this.ClimateClassification(Coordinates);
        const Season = this.Season(ReportDurational, ClimateClassification, CurrentTime.getUTCMonth());
        const Temperature_C = Report.variables(0)!.value();
        const RelativeHumidity = Report.variables(1)!.value();
        const Precipitation_mm = Report.variables(2)!.value();
        const CloudCover = Report.variables(3)!.value();
        const WindSpeed = Report.variables(4)!.value();
        const WeatherCode = Report.variables(5)!.value();

        return {
            Coordinates: Coordinates,
            Time: new Date(Number(Report.time()) * 1000),
            Timezone: Response.timezone()!,
            ClimateClassification: ClimateClassification,
            Season: Season,
            Temperature: [
                this.Temperature(ReportDurational, Temperature_C),
                Temperature_C
            ],
            RelativeHumidity: RelativeHumidity,
            WeatherCondition: [
                this.WeatherCondition(WeatherCode),
                Precipitation_mm
            ],
            CloudCover: CloudCover,
            WindSpeed: WindSpeed
        };
    };
};