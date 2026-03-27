package com.experis.sofia.bankportal.auth.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios — ADR-012 SseRegistry.
 *
 * Escenarios:
 *  1. register: nuevo usuario → emitter creado, activeConnections = 1
 *  2. register: reemplaza conexion anterior (last-write-wins)
 *  3. register: pool lleno + usuario nuevo → SseCapacityExceededException
 *  4. register: pool lleno + mismo usuario → reemplaza sin excepción
 *  5. send: usuario conectado → no lanza excepción
 *  6. send: usuario desconectado → no-op silencioso
 *  7. invalidate: cierra emitter y lo elimina del registry
 *  8. isConnected: true/false correcto
 *
 * @author SOFIA Developer Agent — Sprint 8
 */
@DisplayName("ADR-012 - SseRegistry")
class SseRegistryTest {

    private SseRegistry registry;
    private static final UUID USER_A = UUID.randomUUID();
    private static final UUID USER_B = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        registry = new SseRegistry();
    }

    @Nested @DisplayName("register()")
    class Register {

        @Test @DisplayName("Nuevo usuario → emitter creado, activeConnections = 1")
        void newUser_createsEmitter() {
            SseEmitter emitter = registry.register(USER_A);
            assertThat(emitter).isNotNull();
            assertThat(registry.activeConnections()).isEqualTo(1);
            assertThat(registry.isConnected(USER_A)).isTrue();
        }

        @Test @DisplayName("Segunda conexion mismo usuario → reemplaza anterior (last-write-wins)")
        void sameUser_replacesExisting() {
            SseEmitter first  = registry.register(USER_A);
            SseEmitter second = registry.register(USER_A);
            assertThat(second).isNotSameAs(first);
            assertThat(registry.activeConnections()).isEqualTo(1);
        }

        @Test @DisplayName("Pool lleno + usuario nuevo → SseCapacityExceededException")
        void poolFull_newUser_throws() {
            // Llenamos hasta MAX_TOTAL_CONNECTIONS con UUIDs distintos
            for (int i = 0; i < SseRegistry.MAX_TOTAL_CONNECTIONS; i++) {
                registry.register(UUID.randomUUID());
            }
            assertThatThrownBy(() -> registry.register(UUID.randomUUID()))
                    .isInstanceOf(SseRegistry.SseCapacityExceededException.class);
        }

        @Test @DisplayName("Pool lleno + mismo usuario → reemplaza sin excepcion")
        void poolFull_sameUser_noException() {
            // Llenar pool con MAX-1 usuarios aleatorios + USER_A
            for (int i = 0; i < SseRegistry.MAX_TOTAL_CONNECTIONS - 1; i++) {
                registry.register(UUID.randomUUID());
            }
            registry.register(USER_A); // pool ahora lleno, USER_A está dentro
            // Pool lleno + mismo usuario USER_A → debe reemplazar sin excepción
            assertThatNoException().isThrownBy(() -> registry.register(USER_A));
        }
    }

    @Nested @DisplayName("send()")
    class Send {

        @Test @DisplayName("Usuario desconectado → no-op silencioso")
        void disconnectedUser_noOp() {
            assertThatNoException().isThrownBy(
                    () -> registry.send(USER_A, SseEvent.heartbeat()));
        }

        @Test @DisplayName("Usuario conectado → send sin excepcion")
        void connectedUser_sendsWithoutException() {
            registry.register(USER_A);
            // SseEmitter en test no tiene conexión real — el send puede fallar internamente
            // pero SseRegistry debe manejar IOException sin propagarla
            assertThatNoException().isThrownBy(
                    () -> registry.send(USER_A, SseEvent.unreadCount(3L)));
        }
    }

    @Nested @DisplayName("invalidate()")
    class Invalidate {

        @Test @DisplayName("Usuario conectado → eliminado del registry")
        void connected_removedAfterInvalidate() {
            registry.register(USER_A);
            assertThat(registry.isConnected(USER_A)).isTrue();
            registry.invalidate(USER_A);
            assertThat(registry.isConnected(USER_A)).isFalse();
            assertThat(registry.activeConnections()).isZero();
        }

        @Test @DisplayName("Usuario no conectado → no-op silencioso")
        void disconnected_noOp() {
            assertThatNoException().isThrownBy(() -> registry.invalidate(USER_B));
        }
    }

    @Test @DisplayName("isConnected: true si conectado, false si no")
    void isConnected_trueAndFalse() {
        assertThat(registry.isConnected(USER_A)).isFalse();
        registry.register(USER_A);
        assertThat(registry.isConnected(USER_A)).isTrue();
    }
}
