CREATE TABLE geo_admin1_regions (
    country_code varchar(2) NOT NULL,
    admin1_code varchar(20) NOT NULL,
    name varchar(200) NOT NULL,
    ascii_name varchar(200),
    geoname_id integer UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (country_code, admin1_code),

    CONSTRAINT geo_admin1_regions_country_fk
        FOREIGN KEY (country_code)
        REFERENCES geo_countries(iso_code)
);

CREATE INDEX geo_admin1_regions_name_idx
    ON geo_admin1_regions (country_code, name);
