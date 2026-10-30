package com.brownie.orders;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<BrownieOrder, Long> {

    List<BrownieOrder> findAllByOrderByCreatedAtDesc();

    Optional<BrownieOrder> findByTrackingToken(String trackingToken);
}