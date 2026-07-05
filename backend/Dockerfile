# Multi-stage build so the final image only contains the built jar + a JRE,
# not the full Maven toolchain.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the pom first and download dependencies separately so this layer is
# cached across builds unless pom.xml itself changes.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render (and most hosts) inject $PORT at runtime; application.yml already
# reads SERVER_PORT, so pass it through.
ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
