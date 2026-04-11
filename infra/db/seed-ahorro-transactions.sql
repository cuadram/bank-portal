-- Añadir movimientos realistas a la Cuenta Ahorro
BEGIN;

INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
VALUES
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '6 months', 'Apertura cuenta ahorro',       500.00,   500.00, 'OTROS',       'ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '5 months', 'Transferencia ahorro mensual', 200.00,   700.00, 'TRANSFERENCIA','ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '4 months', 'Transferencia ahorro mensual', 200.00,   900.00, 'TRANSFERENCIA','ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '3 months', 'Transferencia ahorro mensual', 200.00,  1100.00, 'TRANSFERENCIA','ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '3 months 5 days', 'Retirada emergencia', -300.00,   800.00, 'OTROS',       'CARGO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '2 months', 'Transferencia ahorro mensual', 200.00,  1000.00, 'TRANSFERENCIA','ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '1 month',  'Transferencia ahorro mensual', 200.00,  1200.00, 'TRANSFERENCIA','ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '20 days',  'Intereses 2026',                12.50,  1212.50, 'OTROS',       'ABONO'),
    ('acc00000-0000-0000-0000-000000000002', NOW()-INTERVAL '5 days',   'Transferencia ahorro extra',   200.00,  1412.50, 'TRANSFERENCIA','ABONO');

SELECT 'Cuenta Ahorro — movimientos:' AS info, COUNT(*) FROM transactions WHERE account_id='acc00000-0000-0000-0000-000000000002';

COMMIT;
