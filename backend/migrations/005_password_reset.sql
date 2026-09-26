CREATE TABLE public.password_reset_tokens (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL,
    token_hash character varying(64) NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT password_reset_tokens_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE
);

CREATE INDEX password_reset_tokens_user_id_idx
    ON public.password_reset_tokens(user_id);

CREATE INDEX password_reset_tokens_expires_at_idx
    ON public.password_reset_tokens(expires_at);
