# Build stage
FROM eclipse-temurin:17-alpine AS builder
RUN apk add --no-cache maven
WORKDIR /build
COPY pom.xml .
COPY backend/ backend/
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/backend/booking-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
