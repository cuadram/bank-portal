package com.experis.sofia.bankportal.session.domain;

import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para {@link DeviceFingerprintService} con ua-parser-java.
 * Verifica DEBT-004: Edge detectado correctamente (no como Chrome).
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4 (DEBT-004)
 */
class DeviceFingerprintServiceTest {

    private DeviceFingerprintService service;

    @BeforeEach
    void setUp() { service = new DeviceFingerprintService(); }

    // ── DEBT-004: detección correcta de browser ───────────────────────────────

    @Nested
    @DisplayName("extractDeviceInfo() — DEBT-004 ua-parser-java")
    class ExtractDeviceInfo {

        @Test
        @DisplayName("detects Edge correctly — not Chrome (DEBT-004 fix)")
        void detectsEdge() {
            String edgeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
            var info = service.extractDeviceInfo(edgeUA);
            assertThat(info.browser()).isEqualTo("Edge");
            assertThat(info.os()).isEqualTo("Windows");
        }

        @Test
        @DisplayName("detects Chrome on Windows")
        void detectsChrome() {
            String chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
            var info = service.extractDeviceInfo(chromeUA);
            assertThat(info.browser()).isEqualTo("Chrome");
            assertThat(info.os()).isEqualTo("Windows");
            assertThat(info.deviceType()).isEqualTo("desktop");
        }

        @Test
        @DisplayName("detects Safari on macOS")
        void detectsSafariMac() {
            String safariUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) " +
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
            var info = service.extractDeviceInfo(safariUA);
            assertThat(info.browser()).isEqualTo("Safari");
            assertThat(info.os()).isEqualTo("macOS");
        }

        @Test
        @DisplayName("detects mobile device type on Android Chrome")
        void detectsMobile() {
            String mobileUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36";
            var info = service.extractDeviceInfo(mobileUA);
            assertThat(info.os()).isEqualTo("Android");
            assertThat(info.deviceType()).isEqualTo("mobile");
        }

        @Test
        @DisplayName("handles null User-Agent gracefully")
        void handlesNull() {
            var info = service.extractDeviceInfo(null);
            assertThat(info.os()).isEqualTo("unknown");
            assertThat(info.browser()).isEqualTo("unknown");
        }
    }

    // ── computeHash ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("computeHash()")
    class ComputeHash {

        @Test
        @DisplayName("same UA and subnet produce same hash — deterministic")
        void deterministicHash() {
            String ua = "Mozilla/5.0 Safari/605";
            String subnet = "192.168";
            assertThat(service.computeHash(ua, subnet))
                    .isEqualTo(service.computeHash(ua, subnet));
        }

        @Test
        @DisplayName("different UA produces different hash")
        void differentUADifferentHash() {
            assertThat(service.computeHash("Chrome UA", "192.168"))
                    .isNotEqualTo(service.computeHash("Firefox UA", "192.168"));
        }

        @Test
        @DisplayName("different subnet produces different hash")
        void differentSubnetDifferentHash() {
            assertThat(service.computeHash("same UA", "192.168"))
                    .isNotEqualTo(service.computeHash("same UA", "10.0"));
        }

        @Test
        @DisplayName("hash is URL-safe Base64 (no +, /, =)")
        void hashIsUrlSafe() {
            String hash = service.computeHash("any UA", "192.168");
            assertThat(hash).doesNotContain("+", "/", "=");
        }
    }

    // ── extractIpSubnet ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("extractIpSubnet()")
    class ExtractIpSubnet {

        @Test
        @DisplayName("extracts first two octets")
        void extractsTwoOctets() {
            assertThat(service.extractIpSubnet("192.168.10.55")).isEqualTo("192.168");
            assertThat(service.extractIpSubnet("10.0.1.100")).isEqualTo("10.0");
        }

        @Test
        @DisplayName("handles null gracefully")
        void handlesNull() {
            assertThat(service.extractIpSubnet(null)).isEqualTo("unknown");
        }
    }
}
