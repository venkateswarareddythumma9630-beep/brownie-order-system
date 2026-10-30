package com.brownie.orders;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customer_orders")
public class BrownieOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "product_id", length = 60)
    private String productId = "brownie-cake";

    @Column(name = "product_name", length = 120)
    private String productName = "Brownie Cake";
    @Column(nullable=false) private String customerName;
    @Column(nullable=false) private String phone;
    @Column(nullable=false, length=1000) private String address;
    @Column(nullable=false) private Integer quantity;
    @Column(nullable=false, precision=10, scale=2) private BigDecimal unitPrice;
    @Column(nullable=false, precision=10, scale=2) private BigDecimal totalAmount;
    @Column(length=500) private String notes;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private OrderStatus status = OrderStatus.NEW;
    @Column(nullable=false) private Instant createdAt = Instant.now();
    @Column(unique = true, length = 36)
    private String trackingToken;

    @PrePersist
    void generateTrackingToken() {
        if (trackingToken == null) {
            trackingToken = UUID.randomUUID().toString();
        }
    }

    protected BrownieOrder() {}
    public BrownieOrder(
            String customerName,
            String phone,
            String address,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            String notes,
            String productId,
            String productName
    ) {
        this.customerName = customerName;
        this.phone = phone;
        this.address = address;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
        this.notes = notes;
        this.productId = productId;
        this.productName = productName;
        this.status = OrderStatus.NEW;
        this.createdAt = Instant.now();
    }
    public Long getId(){return id;} public String getCustomerName(){return customerName;}
    public String getPhone(){return phone;} public String getAddress(){return address;}
    public Integer getQuantity(){return quantity;} public BigDecimal getUnitPrice(){return unitPrice;}
    public BigDecimal getTotalAmount(){return totalAmount;} public String getNotes(){return notes;}
    public OrderStatus getStatus(){return status;} public Instant getCreatedAt(){return createdAt;}
    public void setStatus(OrderStatus status){this.status=status;}
    public String getTrackingToken() {
        return trackingToken;
    }
    public String getProductId() {
        return productId == null ? "brownie-cake" : productId;
    }

    public String getProductName() {
        return productName == null ? "Brownie Cake" : productName;
    }
}
