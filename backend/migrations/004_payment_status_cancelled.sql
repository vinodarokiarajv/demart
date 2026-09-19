ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_payment_status_valid;

ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_valid
CHECK (
    payment_status IN (
        'PENDING',
        'PAID',
        'FAILED',
        'CANCELLED'
    )
);
