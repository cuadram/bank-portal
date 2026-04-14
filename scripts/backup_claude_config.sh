#!/bin/bash
# ============================================================
# backup_claude_config.sh
# Monitoriza Claude Desktop y hace backup del config al cerrar
# Instalado como LaunchAgent: com.cuadram.claude-config-backup
# ============================================================

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_DIR="$HOME/Library/Application Support/Claude/backups"
LOG_FILE="$HOME/Library/Logs/claude-config-backup.log"
MAX_BACKUPS=30   # Retención máxima de copias

mkdir -p "$BACKUP_DIR"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

log "=== Servicio de backup iniciado ==="

while true; do
    # Esperar a que Claude Desktop arranque
    while ! pgrep -x "Claude" > /dev/null 2>&1; do
        sleep 5
    done
    log "Claude Desktop detectado (PID: $(pgrep -x Claude))"

    # Esperar a que Claude Desktop se cierre
    while pgrep -x "Claude" > /dev/null 2>&1; do
        sleep 2
    done
    log "Claude Desktop cerrado — iniciando backup"

    # Hacer backup si el fichero existe
    if [ -f "$CONFIG_FILE" ]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="$BACKUP_DIR/claude_desktop_config_${TIMESTAMP}.json"
        cp "$CONFIG_FILE" "$BACKUP_FILE"
        log "Backup creado: $BACKUP_FILE"

        # Limpiar backups antiguos (conservar MAX_BACKUPS)
        BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
        if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
            EXCESS=$((BACKUP_COUNT - MAX_BACKUPS))
            ls -t "$BACKUP_DIR"/*.json | tail -n "$EXCESS" | xargs rm -f
            log "Limpieza: eliminados $EXCESS backups antiguos"
        fi
    else
        log "AVISO: Config no encontrado en $CONFIG_FILE"
    fi

    # Pequeña pausa antes del siguiente ciclo
    sleep 3
done
