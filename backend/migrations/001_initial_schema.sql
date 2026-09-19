SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0)
);

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.order_items_id_seq
    OWNED BY public.order_items.id;

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(30) DEFAULT 'PENDING' NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    shipping_amount numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_name character varying(200),
    shipping_street character varying(255),
    shipping_postal_code character varying(20),
    shipping_city character varying(100),
    shipping_country character varying(100),
    delivery_method character varying(20) DEFAULT 'standard' NOT NULL,
    payment_method character varying(20) DEFAULT 'card' NOT NULL,
    payment_status character varying(20) DEFAULT 'PENDING' NOT NULL,
    CONSTRAINT orders_delivery_method_valid
        CHECK (delivery_method IN ('standard', 'express')),
    CONSTRAINT orders_payment_method_valid
        CHECK (payment_method IN ('card', 'paypal')),
    CONSTRAINT orders_payment_status_valid
        CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
    CONSTRAINT orders_shipping_amount_non_negative
        CHECK (shipping_amount >= 0)
);

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.orders_id_seq
    OWNED BY public.orders.id;

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    rating numeric(2,1),
    stock_quantity integer DEFAULT 0 NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.products_id_seq
    OWNED BY public.products.id;

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    street character varying(255),
    postal_code character varying(20),
    city character varying(100),
    country character varying(100),
    role character varying(20) DEFAULT 'CUSTOMER' NOT NULL,
    account_status character varying(20) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT users_account_status_check
        CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq
    OWNED BY public.users.id;

ALTER TABLE ONLY public.order_items
    ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);

ALTER TABLE ONLY public.orders
    ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);

ALTER TABLE ONLY public.products
    ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);

ALTER TABLE ONLY public.users
    ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX products_active_name_unique_idx
    ON public.products USING btree (lower((name)::text))
    WHERE (is_active = true);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id);
