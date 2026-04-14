package com.experis.sofia.bankportal.bizum.integration;
import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * TC-F022-022 — Flyway V27__bizum.sql ejecuta sin errores
 * Verifica que las 3 tablas bizum_* existen en PostgreSQL real
 */
@SpringBootTest(classes = BackendTwoFactorApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BizumFlywayIT extends IntegrationTestBase {
    @Autowired DataSource ds;

    @Test
    void v27TablesExist() throws Exception {
        try (var conn = ds.getConnection()) {
            var meta = conn.getMetaData();
            try (var rs = meta.getTables(null, null, "bizum_%", new String[]{ "TABLE" })) {
                List<String> tables = new ArrayList<>();
                while (rs.next()) tables.add(rs.getString("TABLE_NAME"));
                assertTrue(tables.contains("bizum_activations"),
                    "bizum_activations debe existir tras V27");
                assertTrue(tables.contains("bizum_payments"),
                    "bizum_payments debe existir tras V27");
                assertTrue(tables.contains("bizum_requests"),
                    "bizum_requests debe existir tras V27");
            }
        }
    }

    @Test
    void v27FlywayHistoryRegistered() throws Exception {
        try (var conn = ds.getConnection();
             var ps = conn.prepareStatement(
                 "SELECT version, description FROM flyway_schema_history WHERE version = '27'");
             var rs = ps.executeQuery()) {
            assertTrue(rs.next(), "V27 debe estar en flyway_schema_history");
            assertEquals("27", rs.getString("version"));
        }
    }
}
