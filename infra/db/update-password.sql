-- Actualizar password_hash con BCrypt cost=12
-- Hash generado con: bcrypt.hashpw(b'angel123', bcrypt.gensalt(rounds=12))
-- Verificado compatible con Spring BCryptPasswordEncoder(12)
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1oK8VDWSZ6'
WHERE email = 'a.delacuadra@nemtec.es';

-- Verificar
SELECT email, LEFT(password_hash, 20) AS hash_preview FROM users WHERE email = 'a.delacuadra@nemtec.es';
