package com.chronicles;

import com.chronicles.repository.EventRepository;
import com.chronicles.service.TimelineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class ChroniclesApplication {

    private static final Logger log = LoggerFactory.getLogger(ChroniclesApplication.class);

    public static void main(String[] args) {
        loadDotEnv();
        configureDatabaseUrlForRailway();
        SpringApplication.run(ChroniclesApplication.class, args);
    }

    /**
     * Initial startup seeder: runs only on server boot when the database is empty.
     * Moves all seeding logic out of the GET/read path.
     */
    @Bean
    public CommandLineRunner initialDatabaseSeeder(TimelineService timelineService, EventRepository eventRepository) {
        return args -> {
            if (eventRepository.count() == 0) {
                log.info("Startup check: database has 0 records. Initiating one-time seed...");
                timelineService.seedInitialTimelines();
            } else {
                log.info("Startup check: database already contains {} timeline events.", eventRepository.count());
            }
        };
    }

    /**
     * CORS configuration reading allowed frontend URL from environment variable.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer(@Value("${cors.allowed-origins:${FRONTEND_URL:}}") String frontendUrl) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                var mapping = registry.addMapping("/**")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
                if (frontendUrl != null && !frontendUrl.isBlank() && !frontendUrl.equals("*")) {
                    mapping.allowedOrigins(frontendUrl.split(","));
                } else {
                    mapping.allowedOriginPatterns("*");
                }
            }
        };
    }

    /**
     * Sanitizes database URL injected by Railway (e.g. postgresql://user:pass@host:port/db -> jdbc:postgresql://host:port/db)
     * and extracts username/password for the PostgreSQL JDBC driver.
     */
    private static void configureDatabaseUrlForRailway() {
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank() || dbUrl.contains("${")) {
            dbUrl = System.getenv("DATABASE_PRIVATE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank() || dbUrl.contains("${")) {
            dbUrl = System.getenv("DATABASE_PUBLIC_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank() && !dbUrl.contains("${")) {
            try {
                String raw = dbUrl.startsWith("jdbc:") ? dbUrl.substring(5) : dbUrl;
                java.net.URI uri = new java.net.URI(raw);
                String host = uri.getHost();
                if (host != null) {
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath() != null && !uri.getPath().isEmpty() ? uri.getPath() : "/railway";
                    String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";

                    String cleanJdbcUrl = String.format("jdbc:postgresql://%s:%d%s%s", host, port, path, query);
                    System.setProperty("DATABASE_URL", cleanJdbcUrl);
                    System.setProperty("spring.datasource.url", cleanJdbcUrl);

                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] creds = userInfo.split(":", 2);
                        if (System.getenv("PGUSER") == null && System.getProperty("PGUSER") == null) {
                            System.setProperty("PGUSER", creds[0]);
                        }
                        if (System.getenv("PGPASSWORD") == null && System.getProperty("PGPASSWORD") == null) {
                            System.setProperty("PGPASSWORD", creds[1]);
                        }
                    }
                    log.info("Configured JDBC DataSource URL from Railway DATABASE_URL: jdbc:postgresql://{}:{}{}", host, port, path);
                    return;
                }
            } catch (Exception e) {
                log.warn("Could not parse DATABASE_URL as URI: {}. Applying basic jdbc prefix.", e.getMessage());
            }

            if (!dbUrl.startsWith("jdbc:")) {
                String jdbcUrl = "jdbc:" + dbUrl;
                System.setProperty("DATABASE_URL", jdbcUrl);
                System.setProperty("spring.datasource.url", jdbcUrl);
                log.info("Configured JDBC DataSource URL from Railway DATABASE_URL");
            }
            return;
        }

        String pgHost = System.getenv("PGHOST");
        if (pgHost != null && !pgHost.isBlank() && !pgHost.contains("${")) {
            String pgPort = System.getenv().getOrDefault("PGPORT", "5432");
            String pgDb = System.getenv().getOrDefault("PGDATABASE", "railway");
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", pgHost, pgPort, pgDb);
            System.setProperty("DATABASE_URL", jdbcUrl);
            System.setProperty("spring.datasource.url", jdbcUrl);
            log.info("Constructed JDBC DataSource URL from PGHOST/PGPORT/PGDATABASE: {}", jdbcUrl);
        }
    }

    /**
     * Loads .env file into System properties for local development.
     */
    private static void loadDotEnv() {
        String[] candidates = {".env", "../.env", "./backend/.env"};
        for (String path : candidates) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(f.toPath());
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                        int eq = trimmed.indexOf('=');
                        if (eq > 0) {
                            String key = trimmed.substring(0, eq).trim();
                            String value = trimmed.substring(eq + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getenv(key) == null && System.getProperty(key) == null && !value.isEmpty()) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {}
            }
        }
    }
}
