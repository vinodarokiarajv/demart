ALTER TABLE users
    ADD COLUMN phone character varying(30),
    ADD COLUMN address_line_2 character varying(255),
    ADD COLUMN landmark character varying(255);
