const fs = require("fs");
const path = require("path");
const readline = require("readline");
const pool = require("./db");

const DATA_DIR = path.join(__dirname, "../../data/geonames");
const COUNTRY_FILE = path.join(DATA_DIR, "countryInfo.txt");
const CITY_FILE = path.join(DATA_DIR, "cities500.txt");

const BATCH_SIZE = 500;

function getCurrencySymbol(code) {
    try {
        return new Intl.NumberFormat("en", {
            style: "currency",
            currency: code,
            currencyDisplay: "narrowSymbol"
        })
            .formatToParts(0)
            .find((part) => part.type === "currency")?.value || code;
    } catch {
        return code;
    }
}

async function readCountryData() {
    const countries = [];
    const currencies = new Map();

    const rl = readline.createInterface({
        input: fs.createReadStream(COUNTRY_FILE),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line || line.startsWith("#")) continue;

        const fields = line.split("\t");

        if (fields.length < 19) continue;

        const [
            isoCode,
            iso3Code,
            isoNumeric,
            fipsCode,
            countryName,
            capital,
            area,
            population,
            continent,
            tld,
            currencyCode,
            currencyName,
            phonePrefix,
            postalCodeFormat,
            postalCodeRegex,
            languages,
            geonameId,
            neighbours
        ] = fields;

        if (!isoCode || !iso3Code || !countryName) continue;

        countries.push({
            isoCode,
            iso3Code,
            isoNumeric: isoNumeric || null,
            countryName,
            capital: capital || null,
            continent: continent || null,
            currencyCode: currencyCode || null,
            phonePrefix: phonePrefix || null,
            languages: languages || null,
            geonameId: geonameId ? Number(geonameId) : null,
            neighbours: neighbours || null
        });

        if (currencyCode && currencyName) {
            currencies.set(currencyCode, currencyName);
        }
    }

    return { countries, currencies };
}

async function insertCurrencies(client, currencies) {
    for (const [code, name] of currencies) {
        await client.query(
            `
            INSERT INTO currencies (
                code,
                name,
                symbol,
                decimal_places
            )
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                symbol = EXCLUDED.symbol,
                decimal_places = EXCLUDED.decimal_places
            `,
            [
                code,
                name,
                getCurrencySymbol(code),
                2
            ]
        );
    }
}

async function insertCountries(client, countries) {
    const values = [];
    const placeholders = [];

    countries.forEach((country, index) => {
        const offset = index * 11;

        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, ` +
            `$${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, ` +
            `$${offset + 9}, $${offset + 10}, $${offset + 11})`
        );

        values.push(
            country.isoCode,
            country.iso3Code,
            country.isoNumeric,
            country.countryName,
            country.capital,
            country.continent,
            country.currencyCode,
            country.phonePrefix,
            country.languages,
            country.geonameId,
            country.neighbours
        );
    });

    await client.query(
        `
        INSERT INTO geo_countries (
            iso_code,
            iso3_code,
            iso_numeric,
            country_name,
            capital,
            continent,
            currency_code,
            phone_prefix,
            languages,
            geoname_id,
            neighbours
        )
        VALUES ${placeholders.join(",")}
        ON CONFLICT (iso_code) DO UPDATE SET
            iso3_code = EXCLUDED.iso3_code,
            iso_numeric = EXCLUDED.iso_numeric,
            country_name = EXCLUDED.country_name,
            capital = EXCLUDED.capital,
            continent = EXCLUDED.continent,
            currency_code = EXCLUDED.currency_code,
            phone_prefix = EXCLUDED.phone_prefix,
            languages = EXCLUDED.languages,
            geoname_id = EXCLUDED.geoname_id,
            neighbours = EXCLUDED.neighbours
        `,
        values
    );
}

async function insertCityBatch(client, cities) {
    const values = [];
    const placeholders = [];

    cities.forEach((city, index) => {
        const offset = index * 14;

        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, ` +
            `$${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, ` +
            `$${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, ` +
            `$${offset + 13}, $${offset + 14})`
        );

        values.push(
            city.geonameId,
            city.name,
            city.asciiName,
            city.alternateNames,
            city.latitude,
            city.longitude,
            city.featureClass,
            city.featureCode,
            city.countryCode,
            city.admin1Code,
            city.population,
            city.elevation,
            city.timezone,
            city.modificationDate
        );
    });

    await client.query(
        `
        INSERT INTO geo_cities (
            geoname_id,
            name,
            ascii_name,
            alternate_names,
            latitude,
            longitude,
            feature_class,
            feature_code,
            country_code,
            admin1_code,
            population,
            elevation,
            timezone,
            modification_date
        )
        VALUES ${placeholders.join(",")}
        ON CONFLICT (geoname_id) DO UPDATE SET
            name = EXCLUDED.name,
            ascii_name = EXCLUDED.ascii_name,
            alternate_names = EXCLUDED.alternate_names,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            feature_class = EXCLUDED.feature_class,
            feature_code = EXCLUDED.feature_code,
            country_code = EXCLUDED.country_code,
            admin1_code = EXCLUDED.admin1_code,
            population = EXCLUDED.population,
            elevation = EXCLUDED.elevation,
            timezone = EXCLUDED.timezone,
            modification_date = EXCLUDED.modification_date
        `,
        values
    );
}

async function importCities(client) {
    const rl = readline.createInterface({
        input: fs.createReadStream(CITY_FILE),
        crlfDelay: Infinity
    });

    let batch = [];
    let count = 0;

    for await (const line of rl) {
        if (!line) continue;

        const fields = line.split("\t");

        if (fields.length < 19) continue;

        const [
            geonameId,
            name,
            asciiName,
            alternateNames,
            latitude,
            longitude,
            featureClass,
            featureCode,
            countryCode,
            ,
            admin1Code,
            ,
            ,
            ,
            population,
            elevation,
            ,
            timezone,
            modificationDate
        ] = fields;

        batch.push({
            geonameId: Number(geonameId),
            name,
            asciiName: asciiName || null,
            alternateNames: alternateNames || null,
            latitude: latitude ? Number(latitude) : null,
            longitude: longitude ? Number(longitude) : null,
            featureClass: featureClass || null,
            featureCode: featureCode || null,
            countryCode,
            admin1Code: admin1Code || null,
            population: population ? Number(population) : 0,
            elevation: elevation ? Number(elevation) : null,
            timezone: timezone || null,
            modificationDate: modificationDate || null
        });

        if (batch.length >= BATCH_SIZE) {
            await insertCityBatch(client, batch);
            count += batch.length;
            batch = [];

            if (count % 10000 === 0) {
                console.log(`Imported ${count} cities...`);
            }
        }
    }

    if (batch.length > 0) {
        await insertCityBatch(client, batch);
        count += batch.length;
    }

    return count;
}

async function main() {
    const client = await pool.connect();

    try {
        console.log("Reading GeoNames country data...");
        const { countries, currencies } = await readCountryData();

        console.log(`Currencies found: ${currencies.size}`);
        console.log(`Countries found: ${countries.length}`);

        await client.query("BEGIN");

        console.log("Importing currencies...");
        await insertCurrencies(client, currencies);

        console.log("Importing countries...");
        await insertCountries(client, countries);

        console.log("Importing cities...");
        const cityCount = await importCities(client);

        await client.query("COMMIT");

        console.log(`Imported cities: ${cityCount}`);
        console.log("GeoNames import completed successfully.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("GeoNames import failed:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();
