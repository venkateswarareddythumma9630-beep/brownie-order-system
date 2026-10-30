
package com.brownie.orders.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

@Configuration
public class StaticCacheConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(
                        "/*.html",
                        "/"
                )
                .addResourceLocations("classpath:/static/")
                .setCacheControl(
                        CacheControl.noCache()
                );

        registry.addResourceHandler(
                        "/**"
                )
                .addResourceLocations("classpath:/static/")
                .setCacheControl(
                        CacheControl.maxAge(7, TimeUnit.DAYS)
                                .cachePublic()
                );
    }
}
