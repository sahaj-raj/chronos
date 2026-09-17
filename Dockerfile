# ==============================================================================
# Production Dockerfile for Chronicles Backend (Railway Deployment)
# Multi-stage build: Maven 3.9 builder + Eclipse Temurin 21 JRE runtime
# ==============================================================================

# --- Stage 1: Build Spring Boot JAR ---
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app/backend

COPY backend/pom.xml ./
# Download dependencies for offline build caching
RUN mvn dependency:go-offline -B

COPY backend/src/ ./src/
RUN mvn clean package -DskipTests

# --- Stage 2: Minimal Runtime Environment ---
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN useradd -m chronos && chown -R chronos:chronos /app
USER chronos

COPY --from=builder /app/backend/target/*.jar app.jar

# Railway injects PORT dynamically; run java using server.port
ENTRYPOINT ["sh", "-c", "exec java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-8080} -jar app.jar"]
