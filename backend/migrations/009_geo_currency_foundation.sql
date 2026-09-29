CREATE TABLE currencies (
    code varchar(3) PRIMARY KEY,
    name varchar(100) NOT NULL,
    symbol varchar(10),
    decimal_places smallint NOT NULL DEFAULT 2,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT currencies_code_format_check
        CHECK (code ~ '^[A-Z]{3}$'),
    CONSTRAINT currencies_decimal_places_check
        CHECK (decimal_places BETWEEN 0 AND 4)
);

CREATE TABLE geo_countries (
    iso_code varchar(2) PRIMARY KEY,
    iso3_code varchar(3) NOT NULL UNIQUE,
    iso_numeric varchar(3),
    country_name varchar(200) NOT NULL,
    capital varchar(200),
    continent varchar(2),
    currency_code varchar(3),
    phone_prefix varchar(20),
    languages varchar(500),
    geoname_id integer UNIQUE,
    neighbours varchar(200),
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT geo_countries_iso_code_check
        CHECK (iso_code ~ '^[A-Z]{2}$'),
    CONSTRAINT geo_countries_iso3_code_check
        CHECK (iso3_code ~ '^[A-Z]{3}$'),
    CONSTRAINT geo_countries_currency_fk
        FOREIGN KEY (currency_code)
        REFERENCES currencies(code)
);

CREATE TABLE geo_cities (
    geoname_id integer PRIMARY KEY,
    name varchar(200) NOT NULL,
    ascii_name varchar(200),
    alternate_names text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    feature_class char(1),
    feature_code varchar(10),
    country_code varchar(2) NOT NULL,
    admin1_code varchar(20),
    population bigint NOT NULL DEFAULT 0,
    elevation integer,
    timezone varchar(100),
    modification_date date,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT geo_cities_country_fk
        FOREIGN KEY (country_code)
        REFERENCES geo_countries(iso_code),
    CONSTRAINT geo_cities_population_check
        CHECK (population >= 0)
);

CREATE INDEX geo_countries_country_name_idx
    ON geo_countries (country_name);

CREATE INDEX geo_countries_currency_code_idx
    ON geo_countries (currency_code);

CREATE INDEX geo_cities_country_code_idx
    ON geo_cities (country_code);

CREATE INDEX geo_cities_country_name_idx
    ON geo_cities (country_code, name);

CREATE INDEX geo_cities_ascii_name_idx
    ON geo_cities (country_code, ascii_name);

CREATE INDEX geo_cities_population_idx
    ON geo_cities (population DESC);

CREATE TABLE exchange_rates (
    base_currency_code varchar(3) NOT NULL,
    target_currency_code varchar(3) NOT NULL,
    rate numeric(20,10) NOT NULL,
    effective_at timestamp with time zone NOT NULL,
    source varchar(100),
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (
        base_currency_code,
        target_currency_code,
        effective_at
    ),
    CONSTRAINT exchange_rates_base_currency_fk
        FOREIGN KEY (base_currency_code)
        REFERENCES currencies(code),
    CONSTRAINT exchange_rates_target_currency_fk
        FOREIGN KEY (target_currency_code)
        REFERENCES currencies(code),
    CONSTRAINT exchange_rates_rate_check
        CHECK (rate > 0),
    CONSTRAINT exchange_rates_different_currency_check
        CHECK (base_currency_code <> target_currency_code)
);

CREATE INDEX exchange_rates_target_currency_idx
    ON exchange_rates (target_currency_code, effective_at DESC);
