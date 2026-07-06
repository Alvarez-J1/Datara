package com.datara.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.datara.security.DataraUserDetailsService;
import com.datara.security.JwtAuthenticationEntryPoint;
import com.datara.security.JwtAuthenticationFilter;
import com.datara.security.JwtService;
import com.datara.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HealthController.class)
@Import({SecurityConfig.class, HealthControllerTest.FilterConfig.class})
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DataraUserDetailsService userDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint authenticationEntryPoint;

    @MockBean
    private JwtService jwtService;

    @Test
    void getHealthIsPublicAndReturnsOkJson() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    @Test
    void headHealthIsPublicAndReturnsNoBody() throws Exception {
        mockMvc.perform(head("/api/health"))
            .andExpect(status().isOk())
            .andExpect(content().string(""));
    }

    @TestConfiguration
    static class FilterConfig {

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtService jwtService,
            DataraUserDetailsService userDetailsService
        ) {
            return new JwtAuthenticationFilter(jwtService, userDetailsService);
        }
    }
}
