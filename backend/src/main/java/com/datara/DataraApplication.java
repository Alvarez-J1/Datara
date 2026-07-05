package com.datara;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DataraApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataraApplication.class, args);
    }
}
