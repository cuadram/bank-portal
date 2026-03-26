#!/bin/bash
# run-integration-tests.sh — DEBT-030
# Ejecuta integration tests localmente (requiere Docker)
# Uso: ./scripts/run-integration-tests.sh [--unit-only] [--it-only]

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
UNIT_ONLY=false; IT_ONLY=false

for arg in "$@"; do
  case $arg in
    --unit-only) UNIT_ONLY=true ;;
    --it-only)   IT_ONLY=true ;;
  esac
done

echo -e "${YELLOW}=== BankPortal Test Runner — DEBT-030 ===${NC}"
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Docker no está corriendo${NC}"
  exit 1
fi

cd apps/backend-2fa

# Unit tests
if [ "$IT_ONLY" = false ]; then
  echo -e "\n${YELLOW}[1/2] Unit Tests (Mockito)...${NC}"
  mvn test \
    -Dtest="**/*Test.java" \
    -Dsurefire.excludes="**/*IT.java" \
    --no-transfer-progress -q
  UNIT_RESULT=$?
  if [ $UNIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests PASSED${NC}"
    # Contar tests
    PASSED=$(grep -r "<testcase" target/surefire-reports/*.xml 2>/dev/null | wc -l | tr -d ' ')
    FAILED=$(grep -r "<failure" target/surefire-reports/*.xml 2>/dev/null | wc -l | tr -d ' ')
    echo "  Tests: $PASSED passed, $FAILED failed"
  else
    echo -e "${RED}✗ Unit tests FAILED${NC}"
    exit 1
  fi
fi

# Integration tests
if [ "$UNIT_ONLY" = false ]; then
  echo -e "\n${YELLOW}[2/2] Integration Tests (Testcontainers + PostgreSQL real)...${NC}"
  echo "  Testcontainers descargará postgres:16-alpine si no está en caché"
  mvn test \
    -Dtest="**/*IT.java" \
    -Dspring.profiles.active=test \
    --no-transfer-progress -q
  IT_RESULT=$?
  if [ $IT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Integration tests PASSED${NC}"
    IT_PASSED=$(grep -r "<testcase" target/surefire-reports/TEST-*IT*.xml 2>/dev/null | wc -l | tr -d ' ')
    echo "  Tests: $IT_PASSED passed"
  else
    echo -e "${RED}✗ Integration tests FAILED — ver target/surefire-reports/${NC}"
    exit 1
  fi
fi

echo -e "\n${GREEN}=== TODOS LOS TESTS PASARON ✅ ===${NC}"
echo "Reportes: apps/backend-2fa/target/surefire-reports/"
