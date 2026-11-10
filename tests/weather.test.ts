import EnvyEnv from "../src/index.js";

async function main(): Promise<void> {
    const Arguments = process.argv.splice(2);

    console.log(await EnvyEnv.Weather.GetWeather({ Latitude: Number(Arguments[0]), Longitude: Number(Arguments[1]) }))

    /*EnvyEnv.Season(
        {
            0: {
                Temp_C: 23.1,
                Prec_mm: 1.2,
                Rain_mm: 1.2,
                Snow_cm: 0,
                Days: 930,
                WetDays: 42
            },
            1: {
                Temp_C: 24.2,
                Prec_mm: 1.5,
                Rain_mm: 1.5,
                Snow_cm: 0,
                Days: 840,
                WetDays: 39
            },
            2: {
                Temp_C: 26.8,
                Prec_mm: 2.1,
                Rain_mm: 2.1,
                Snow_cm: 0,
                Days: 930,
                WetDays: 55
            },
            3: {
                Temp_C: 29.1,
                Prec_mm: 3.8,
                Rain_mm: 3.8,
                Snow_cm: 0,
                Days: 900,
                WetDays: 75
            },
            4: {
                Temp_C: 30.2,
                Prec_mm: 5.4,
                Rain_mm: 5.4,
                Snow_cm: 0,
                Days: 930,
                WetDays: 105
            },
            5: {
                Temp_C: 29.5,
                Prec_mm: 12.8,
                Rain_mm: 12.8,
                Snow_cm: 0,
                Days: 900,
                WetDays: 270
            },
            6: {
                Temp_C: 28.7,
                Prec_mm: 18.5,
                Rain_mm: 18.5,
                Snow_cm: 0,
                Days: 930,
                WetDays: 390
            },
            7: {
                Temp_C: 28.4,
                Prec_mm: 16.2,
                Rain_mm: 16.2,
                Snow_cm: 0,
                Days: 930,
                WetDays: 360
            },
            8: {
                Temp_C: 28.1,
                Prec_mm: 10.4,
                Rain_mm: 10.4,
                Snow_cm: 0,
                Days: 900,
                WetDays: 270
            },
            9: {
                Temp_C: 27.3,
                Prec_mm: 5.2,
                Rain_mm: 5.2,
                Snow_cm: 0,
                Days: 930,
                WetDays: 120
            },
            10: {
                Temp_C: 25.4,
                Prec_mm: 2.1,
                Rain_mm: 2.1,
                Snow_cm: 0,
                Days: 900,
                WetDays: 60
            },
            11: {
                Temp_C: 23.8,
                Prec_mm: 1.4,
                Rain_mm: 1.4,
                Snow_cm: 0,
                Days: 930,
                WetDays: 45
            }
        }, ClimateClassification.Arid_ColdDesert
    )*/
}

main().catch(
    (Error: Error) => {
        console.error(Error ? Error.message : "An Unknown Error occurred!");
        process.exitCode = 1;
    }
)