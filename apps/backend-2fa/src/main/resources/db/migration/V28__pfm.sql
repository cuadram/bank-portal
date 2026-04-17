-- V28__pfm.sql — FEAT-023 Mi Dinero (PFM) · Sprint 25
-- Tablas: pfm_category_rules · pfm_user_rules · pfm_budgets · pfm_budget_alerts
-- Seed: ≥50 reglas de categorización del sistema (RN-F023-01)
-- ADR-037: categoría calculada on-the-fly; solo se persiste el override manual.
-- ADR-038: budget_month como varchar(7) YYYY-MM.

-- ── 1. Reglas de categorización del sistema ───────────────────────────────────
CREATE TABLE pfm_category_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_pattern VARCHAR(200) NOT NULL,
    category_code   VARCHAR(30)  NOT NULL,
    priority        INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pfm_category_rules_pattern ON pfm_category_rules (concept_pattern);

-- ── 2. Reglas personalizadas del usuario (RN-F023-17, GDPR Art.17) ────────────
CREATE TABLE pfm_user_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_pattern VARCHAR(200) NOT NULL,
    category_code   VARCHAR(30)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pfm_user_rules_user_pattern UNIQUE (user_id, concept_pattern)
);

CREATE INDEX idx_pfm_user_rules_user ON pfm_user_rules (user_id);

-- ── 3. Presupuestos mensuales (RN-F023-04/05/06/07) ──────────────────────────
CREATE TABLE pfm_budgets (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_code    VARCHAR(30)  NOT NULL,
    amount_limit     NUMERIC(15,2) NOT NULL CHECK (amount_limit > 0 AND amount_limit <= 99999.99),
    threshold_percent INT          NOT NULL DEFAULT 80 CHECK (threshold_percent BETWEEN 50 AND 95),
    budget_month     VARCHAR(7)   NOT NULL,  -- YYYY-MM (ADR-038)
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pfm_budgets_user_cat_month UNIQUE (user_id, category_code, budget_month)
);

CREATE INDEX idx_pfm_budgets_user ON pfm_budgets (user_id, budget_month);

-- ── 4. Alertas emitidas — control 1/presupuesto/mes (RN-F023-09) ─────────────
CREATE TABLE pfm_budget_alerts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id   UUID        NOT NULL REFERENCES pfm_budgets(id) ON DELETE CASCADE,
    alert_month VARCHAR(7)  NOT NULL,  -- YYYY-MM
    emitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pfm_budget_alerts_budget_month UNIQUE (budget_id, alert_month)
);

-- ── 5. Seed: ≥50 reglas de categorización del sistema ────────────────────────
INSERT INTO pfm_category_rules (concept_pattern, category_code, priority) VALUES
-- ALIMENTACION (prioridad 100)
('MERCADONA',      'ALIMENTACION', 100),
('CARREFOUR',      'ALIMENTACION', 100),
('LIDL',           'ALIMENTACION', 100),
('ALDI',           'ALIMENTACION', 100),
('EROSKI',         'ALIMENTACION', 100),
('ALCAMPO',        'ALIMENTACION', 100),
('HIPERCOR',       'ALIMENTACION', 100),
('CONSUM',         'ALIMENTACION', 100),
('DIA ',           'ALIMENTACION', 100),
('SUPERMERCADO',   'ALIMENTACION',  90),
('FRUTERIA',       'ALIMENTACION',  90),
('PANADERIA',      'ALIMENTACION',  90),
-- RESTAURANTES (prioridad 95)
('MCDONALDS',      'RESTAURANTES',  95),
('BURGER KING',    'RESTAURANTES',  95),
('KFC',            'RESTAURANTES',  95),
('TELEPIZZA',      'RESTAURANTES',  95),
('DOMINOS',        'RESTAURANTES',  95),
('JUST EAT',       'RESTAURANTES',  95),
('GLOVO',          'RESTAURANTES',  95),
('UBER EATS',      'RESTAURANTES',  95),
('RESTAURANTE',    'RESTAURANTES',  85),
('PIZZERIA',       'RESTAURANTES',  85),
('CAFETERIA',      'RESTAURANTES',  80),
-- TRANSPORTE (prioridad 90)
('RENFE',          'TRANSPORTE',    90),
('OUIGO',          'TRANSPORTE',    90),
('IRYO',           'TRANSPORTE',    90),
('IBERIA',         'VIAJES',        90),
('VUELING',        'VIAJES',        90),
('RYANAIR',        'VIAJES',        90),
('EASYJET',        'VIAJES',        90),
('UBER',           'TRANSPORTE',    85),
('CABIFY',         'TRANSPORTE',    85),
('BLABLACAR',      'TRANSPORTE',    85),
('GASOLINERA',     'TRANSPORTE',    80),
('REPSOL',         'TRANSPORTE',    80),
('CEPSA',          'TRANSPORTE',    80),
-- SALUD
('FARMACIA',       'SALUD',         90),
('CLINICA',        'SALUD',         90),
('DENTISTA',       'SALUD',         90),
('FISIOTERAPIA',   'SALUD',         85),
('SANITAS',        'SALUD',         80),
('ADESLAS',        'SALUD',         80),
-- HOGAR
('IKEA',           'HOGAR',         90),
('LEROY MERLIN',   'HOGAR',         90),
('BRICOMART',      'HOGAR',         90),
('COMUNIDAD',      'HOGAR',         85),
-- SUMINISTROS
('ENDESA',         'SUMINISTROS',   90),
('IBERDROLA',      'SUMINISTROS',   90),
('NATURGY',        'SUMINISTROS',   90),
('CANAL ISABEL',   'SUMINISTROS',   90),
('AQUALIA',        'SUMINISTROS',   85),
-- COMUNICACIONES
('MOVISTAR',       'COMUNICACIONES',90),
('VODAFONE',       'COMUNICACIONES',90),
('ORANGE',         'COMUNICACIONES',90),
('MASMOVIL',       'COMUNICACIONES',85),
('PEPEPHONE',      'COMUNICACIONES',85),
-- EDUCACION
('UNIVERSIDAD',    'EDUCACION',     90),
('ACADEMIA',       'EDUCACION',     85),
('LIBRERIA',       'EDUCACION',     80),
('UDEMY',          'EDUCACION',     80),
-- SEGUROS
('MAPFRE',         'SEGUROS',       90),
('GENERALI',       'SEGUROS',       90),
('ALLIANZ',        'SEGUROS',       90),
('LINEA DIRECTA',  'SEGUROS',       90),
-- VIAJES
('BOOKING',        'VIAJES',        90),
('AIRBNB',         'VIAJES',        90),
('HOTEL',          'VIAJES',        85),
-- NOMINA
('NOMINA',         'NOMINA',        100),
('SALARIO',        'NOMINA',        100),
-- TRANSFERENCIAS
('TRANSFERENCIA',  'TRANSFERENCIAS',100),
('BIZUM',          'TRANSFERENCIAS',100),
('TRASPASO',       'TRANSFERENCIAS',100);

-- Verificación del seed (debe ser ≥50)
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM pfm_category_rules;
  IF cnt < 50 THEN
    RAISE EXCEPTION 'Seed insuficiente: % reglas (mínimo 50)', cnt;
  END IF;
END $$;
