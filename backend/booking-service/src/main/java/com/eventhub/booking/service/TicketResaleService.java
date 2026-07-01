package com.eventhub.booking.service;

import com.eventhub.booking.client.EventServiceClient;
import com.eventhub.booking.dto.*;
import com.eventhub.booking.entity.TicketAsset;
import com.eventhub.booking.entity.TicketResaleListing;
import com.eventhub.booking.entity.TicketTransferHistory;
import com.eventhub.booking.enums.TicketAssetStatus;
import com.eventhub.booking.enums.TicketResaleListingStatus;
import com.eventhub.booking.enums.TicketTransferAction;
import com.eventhub.booking.repository.TicketAssetRepository;
import com.eventhub.booking.repository.TicketResaleListingRepository;
import com.eventhub.booking.repository.TicketTransferHistoryRepository;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import feign.FeignException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketResaleService {
    private final TicketAssetRepository ticketAssetRepository;
    private final TicketResaleListingRepository listingRepository;
    private final TicketTransferHistoryRepository transferHistoryRepository;
    private final TicketOwnershipService ticketOwnershipService;
    private final EventServiceClient eventServiceClient;

    public TicketResaleService(
            TicketAssetRepository ticketAssetRepository,
            TicketResaleListingRepository listingRepository,
            TicketTransferHistoryRepository transferHistoryRepository,
            TicketOwnershipService ticketOwnershipService,
            EventServiceClient eventServiceClient
    ) {
        this.ticketAssetRepository = ticketAssetRepository;
        this.listingRepository = listingRepository;
        this.transferHistoryRepository = transferHistoryRepository;
        this.ticketOwnershipService = ticketOwnershipService;
        this.eventServiceClient = eventServiceClient;
    }

    @Transactional
    public ResaleListingResponse createListing(Long ticketId, BigDecimal price, Long sellerId) {
        TicketAsset asset = ticketAssetRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        validateResale(asset, sellerId);
        validatePrice(price);

        if (listingRepository.existsByTicketAssetIdAndStatus(asset.getId(), TicketResaleListingStatus.ACTIVE)) {
            throw new BadRequestException("TICKET_ALREADY_LISTED: Ticket already has an active listing");
        }

        asset.setStatus(TicketAssetStatus.LISTED_FOR_SALE);
        ticketAssetRepository.save(asset);

        TicketResaleListing listing = listingRepository.save(TicketResaleListing.builder()
                .ticketAssetId(asset.getId())
                .sellerId(sellerId)
                .price(price)
                .status(TicketResaleListingStatus.ACTIVE)
                .build());

        recordHistory(asset.getId(), sellerId, null, TicketTransferAction.LISTED, asset.getQrCode(), asset.getQrCode());
        return toListingResponse(listing, asset);
    }

    @Transactional
    public ResaleListingResponse cancelListing(UUID listingId, Long sellerId) {
        TicketResaleListing listing = listingRepository.findLockedById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Resale listing not found"));
        if (!listing.getSellerId().equals(sellerId)) {
            throw new AccessDeniedException("Only listing seller can cancel listing");
        }
        if (listing.getStatus() != TicketResaleListingStatus.ACTIVE) {
            throw new BadRequestException("Only active listings can be cancelled");
        }

        TicketAsset asset = ticketAssetRepository.findLockedById(listing.getTicketAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        if (!asset.getOwnerId().equals(sellerId)) {
            throw new BadRequestException("Listing seller is no longer the ticket owner");
        }
        listing.setStatus(TicketResaleListingStatus.CANCELLED);
        asset.setStatus(TicketAssetStatus.OWNED);
        listingRepository.save(listing);
        ticketAssetRepository.save(asset);
        recordHistory(asset.getId(), sellerId, sellerId, TicketTransferAction.CANCELLED, asset.getQrCode(), asset.getQrCode());
        return toListingResponse(listing, asset);
    }

    @Transactional
    public ResaleListingResponse purchaseListing(UUID listingId, Long buyerId) {
        TicketResaleListing listing = listingRepository.findLockedById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Resale listing not found"));
        if (listing.getStatus() != TicketResaleListingStatus.ACTIVE) {
            throw new BadRequestException("Listing is not active");
        }
        if (listing.getSellerId().equals(buyerId)) {
            throw new BadRequestException("Users cannot buy their own tickets");
        }

        TicketAsset asset = ticketAssetRepository.findLockedById(listing.getTicketAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        transferTicket(asset, listing, buyerId);
        return toListingResponse(listing, asset);
    }

    public List<ResaleTicketSummaryResponse> findMarketplace(Long eventId, BigDecimal priceMin, BigDecimal priceMax, LocalDate date) {
        return listingRepository.findByStatusOrderByCreatedAtDesc(TicketResaleListingStatus.ACTIVE)
                .stream()
                .map(this::toSummaryResponse)
                .filter(response -> eventId == null || eventId.equals(fetchAsset(response.listingId()).getEventId()))
                .filter(response -> priceMin == null || response.price().compareTo(priceMin) >= 0)
                .filter(response -> priceMax == null || response.price().compareTo(priceMax) <= 0)
                .filter(response -> date == null || (response.eventDate() != null && response.eventDate().toLocalDate().equals(date)))
                .toList();
    }

    public ResaleTicketDetailResponse findListingDetail(UUID listingId) {
        TicketResaleListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Resale listing not found"));
        TicketAsset asset = ticketAssetRepository.findById(listing.getTicketAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        InternalEventResponse event = fetchEvent(asset.getEventId());
        return new ResaleTicketDetailResponse(
                listing.getId(),
                asset.getEventId(),
                event.title() == null ? asset.getEventName() : event.title(),
                event.startTime(),
                formatLocation(event),
                null,
                listing.getPrice(),
                sellerName(listing.getSellerId()),
                listing.getStatus()
        );
    }

    public void validateResale(TicketAsset asset, Long sellerId) {
        ticketOwnershipService.validateOwnership(asset, sellerId);
        if (asset.getStatus() != TicketAssetStatus.OWNED) {
            throw new BadRequestException("Only owned tickets can be listed for resale");
        }
        InternalEventResponse event = fetchEvent(asset.getEventId());
        if (event.startTime() != null && !event.startTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("EVENT_ALREADY_STARTED: Started events cannot be resold");
        }
        if ("CANCELLED".equals(event.status()) || "COMPLETED".equals(event.status())) {
            throw new BadRequestException("Event is not eligible for resale");
        }
    }

    private void transferTicket(TicketAsset asset, TicketResaleListing listing, Long buyerId) {
        if (asset.getStatus() == TicketAssetStatus.USED) {
            throw new BadRequestException("Used tickets cannot be purchased");
        }
        if (asset.getStatus() == TicketAssetStatus.CANCELLED) {
            throw new BadRequestException("Cancelled tickets cannot be purchased");
        }
        if (asset.getStatus() != TicketAssetStatus.LISTED_FOR_SALE) {
            throw new BadRequestException("Ticket is not listed for sale");
        }
        if (!asset.getOwnerId().equals(listing.getSellerId())) {
            throw new BadRequestException("Listing seller is no longer the ticket owner");
        }
        InternalEventResponse event = fetchEvent(asset.getEventId());
        if (event.startTime() != null && !event.startTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("EVENT_ALREADY_STARTED: Started events cannot be purchased");
        }

        String oldQrCode = asset.getQrCode();
        asset.setOwnerId(buyerId);
        asset.setStatus(TicketAssetStatus.OWNED);
        String newQrCode = ticketOwnershipService.regenerateQrCode(asset);
        listing.setStatus(TicketResaleListingStatus.SOLD);

        ticketAssetRepository.save(asset);
        listingRepository.save(listing);
        recordHistory(asset.getId(), listing.getSellerId(), buyerId, TicketTransferAction.PURCHASED, oldQrCode, newQrCode);
    }

    private ResaleTicketSummaryResponse toSummaryResponse(TicketResaleListing listing) {
        TicketAsset asset = ticketAssetRepository.findById(listing.getTicketAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        InternalEventResponse event = fetchEvent(asset.getEventId());
        return new ResaleTicketSummaryResponse(
                listing.getId(),
                event.title() == null ? asset.getEventName() : event.title(),
                event.startTime(),
                formatLocation(event),
                listing.getPrice(),
                sellerName(listing.getSellerId())
        );
    }

    private TicketAsset fetchAsset(UUID listingId) {
        TicketResaleListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Resale listing not found"));
        return ticketAssetRepository.findById(listing.getTicketAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
    }

    private ResaleListingResponse toListingResponse(TicketResaleListing listing, TicketAsset asset) {
        return new ResaleListingResponse(
                listing.getId(),
                asset.getId(),
                asset.getTicketId(),
                listing.getPrice(),
                listing.getStatus()
        );
    }

    private void recordHistory(UUID ticketAssetId, Long fromUserId, Long toUserId, TicketTransferAction action, String oldQrCode, String newQrCode) {
        transferHistoryRepository.save(TicketTransferHistory.builder()
                .ticketAssetId(ticketAssetId)
                .fromUserId(fromUserId)
                .toUserId(toUserId)
                .action(action)
                .oldQrCode(oldQrCode)
                .newQrCode(newQrCode)
                .build());
    }

    private InternalEventResponse fetchEvent(Long eventId) {
        try {
            EventApiResponse<InternalEventResponse> response = eventServiceClient.getInternalEvent(eventId);
            if (response == null || response.data() == null) {
                throw new ResourceNotFoundException("Event not found");
            }
            return response.data();
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Event not found");
        } catch (FeignException ex) {
            throw new BadRequestException("Event service request failed");
        }
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("price must be greater than 0");
        }
    }

    private String formatLocation(InternalEventResponse event) {
        if (event.address() != null && event.city() != null) {
            return event.address() + ", " + event.city();
        }
        if (event.location() != null) {
            return event.location();
        }
        return event.city();
    }

    private String sellerName(Long sellerId) {
        return "User " + sellerId;
    }
}
