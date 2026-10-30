package com.brownie.orders;


public enum OrderStatus {
    NEW,
    PAYMENT_RECEIVED,
    CONFIRMED,
    PREPARING,
    READY,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}
