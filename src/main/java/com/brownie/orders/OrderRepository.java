package com.brownie.orders;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<BrownieOrder, Long> {
    List<BrownieOrder> findAllByOrderByCreatedAtDesc();
}
