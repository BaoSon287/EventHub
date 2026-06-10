# Build stage
FROM eclipse-temurin:17-alpine AS builder
WORKDIR /build

# Copy source
COPY . .

# Build backend (Maven)
RUN apt-get update && apt-get install -y maven && \
    cd backend && mvn clean package -DskipTests && \
    cd ..

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built JAR
COPY --from=builder /build/backend/api-gateway/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
