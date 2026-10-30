package com.brownie.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderRepository repository;
    @Value("${brownie.price:100}") private BigDecimal configuredPrice;
    @Value("${brownie.product-name:Brownie Cake}") private String productName;
    @Value("${brownie.whatsapp-number:91XXXXXXXXXX}") private String whatsappNumber;

    public OrderController(OrderRepository repository) { this.repository = repository; }

    public record CreateOrderRequest(
        @NotBlank @Size(max=100) String customerName,
        @NotBlank
        @Pattern(
                regexp = "^[0-9+() -]{8,20}$",
                message = "Enter a valid phone number"
        )
        String phone,
        @NotBlank @Size(max=1000) String address,
        @NotNull @Min(1) @Max(100) Integer quantity,
        @Size(max=500) String notes
    ) {}
    public record OrderResponse(
            Long id,
            String customerName,
            String phone,
            String address,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            String notes,
            OrderStatus status,
            java.time.Instant createdAt,
            String trackingToken
    ) {
        static OrderResponse from(BrownieOrder o) {
            return new OrderResponse(
                    o.getId(),
                    o.getCustomerName(),
                    o.getPhone(),
                    o.getAddress(),
                    o.getQuantity(),
                    o.getUnitPrice(),
                    o.getTotalAmount(),
                    o.getNotes(),
                    o.getStatus(),
                    o.getCreatedAt(),
                    o.getTrackingToken()
            );
        }
    }

    public record TrackingResponse(
            String orderNumber,
            String productName,
            Integer quantity,
            OrderStatus status,
            java.time.Instant createdAt
    ) {
        static TrackingResponse from(BrownieOrder order, String productName) {
            return new TrackingResponse(
                    "HB-" + order.getId(),
                    productName,
                    order.getQuantity(),
                    order.getStatus(),
                    order.getCreatedAt()
            );
        }
    }

    @GetMapping("/config")
    public Map<String,Object> config() {
        return Map.of("productName", productName, "unitPrice", configuredPrice,
            "whatsappNumber", whatsappNumber);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        BigDecimal total = configuredPrice.multiply(BigDecimal.valueOf(request.quantity())).setScale(2, RoundingMode.HALF_UP);
        BrownieOrder saved = repository.save(new BrownieOrder(request.customerName().trim(),
            request.phone().trim(), request.address().trim(), request.quantity(),
            configuredPrice, total, request.notes() == null ? "" : request.notes().trim()));
        return OrderResponse.from(saved);
    }

    @GetMapping("/orders")
    public List<OrderResponse> all() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(OrderResponse::from).toList();
    }


    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        OrderStatus nextStatus;

        try {
            nextStatus = OrderStatus.valueOf(
                    body.getOrDefault("status", "")
                            .trim()
                            .toUpperCase()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unknown order status"
            );
        }

        BrownieOrder order = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"
                ));

        OrderStatus currentStatus = order.getStatus();

        // Delivered and cancelled orders are permanently closed.
        if (currentStatus == OrderStatus.DELIVERED ||
                currentStatus == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This order is already closed. Status cannot be changed."
            );
        }

        boolean validTransition = switch (currentStatus) {
            case NEW -> nextStatus == OrderStatus.CONFIRMED
                    || nextStatus == OrderStatus.CANCELLED;

            case CONFIRMED -> nextStatus == OrderStatus.PREPARING
                    || nextStatus == OrderStatus.CANCELLED;

            case PREPARING -> nextStatus == OrderStatus.READY
                    || nextStatus == OrderStatus.CANCELLED;

            case READY -> nextStatus == OrderStatus.OUT_FOR_DELIVERY
                    || nextStatus == OrderStatus.CANCELLED;

            case OUT_FOR_DELIVERY ->
                    nextStatus == OrderStatus.DELIVERED
                            || nextStatus == OrderStatus.CANCELLED;

            case DELIVERED, CANCELLED -> false;
        };

        if (!validTransition) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invalid status transition from "
                            + currentStatus + " to " + nextStatus
            );
        }

        order.setStatus(nextStatus);

        return OrderResponse.from(repository.save(order));
    }


    @GetMapping("/track/{token}")
    public TrackingResponse trackOrder(@PathVariable String token) {

        BrownieOrder order = repository.findByTrackingToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tracking information not found"
                ));

        return TrackingResponse.from(order, productName);
    }
}

