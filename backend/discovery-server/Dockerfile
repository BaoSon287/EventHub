# Build stage - compile from repo root
FROM eclipse-temurin:17-alpine AS builder
RUN apk add --no-cache maven
WORKDIR /build
COPY pom.xml .
COPY backend/ backend/
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/backend/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
