package com.eventhub.booking.service;

import com.eventhub.booking.client.EventServiceClient;
import com.eventhub.booking.dto.EventApiResponse;
import com.eventhub.booking.dto.InternalEventResponse;
import com.eventhub.booking.entity.TicketAsset;
import com.eventhub.booking.entity.TicketResaleListing;
import com.eventhub.booking.entity.TicketTransferHistory;
import com.eventhub.booking.enums.TicketAssetStatus;
import com.eventhub.booking.enums.TicketResaleListingStatus;
import com.eventhub.booking.repository.TicketAssetRepository;
import com.eventhub.booking.repository.TicketResaleListingRepository;
import com.eventhub.booking.repository.TicketTransferHistoryRepository;
import com.eventhub.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketResaleServiceTest {
    @Mock
    private TicketAssetRepository ticketAssetRepository;

    @Mock
    private TicketResaleListingRepository listingRepository;

    @Mock
    private TicketTransferHistoryRepository transferHistoryRepository;

    @Mock
    private TicketOwnershipService ticketOwnershipService;

    @Mock
    private EventServiceClient eventServiceClient;

    private TicketResaleService service;

    @BeforeEach
    void setUp() {
        service = new TicketResaleService(
                ticketAssetRepository,
                listingRepository,
                transferHistoryRepository,
                ticketOwnershipService,
                eventServiceClient
        );
    }

    @Test
    void ownerCanCreateActiveListing() {
        TicketAsset asset = asset(10L, TicketAssetStatus.OWNED);
        when(ticketAssetRepository.findByTicketId(1L)).thenReturn(Optional.of(asset));
        when(eventServiceClient.getInternalEvent(2L)).thenReturn(successEvent());
        when(listingRepository.existsByTicketAssetIdAndStatus(asset.getId(), TicketResaleListingStatus.ACTIVE)).thenReturn(false);
        when(listingRepository.save(any(TicketResaleListing.class))).thenAnswer(invocation -> withListingId(invocation.getArgument(0)));
        when(transferHistoryRepository.save(any(TicketTransferHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createListing(1L, BigDecimal.valueOf(500000), 10L);

        assertThat(response.status()).isEqualTo(TicketResaleListingStatus.ACTIVE);
        assertThat(asset.getStatus()).isEqualTo(TicketAssetStatus.LISTED_FOR_SALE);
        verify(ticketOwnershipService).validateOwnership(asset, 10L);
        verify(ticketAssetRepository).save(asset);
    }

    @Test
    void nonOwnerCannotCreateListing() {
        TicketAsset asset = asset(10L, TicketAssetStatus.OWNED);
        when(ticketAssetRepository.findByTicketId(1L)).thenReturn(Optional.of(asset));
        org.mockito.Mockito.doThrow(new AccessDeniedException("forbidden"))
                .when(ticketOwnershipService).validateOwnership(asset, 20L);

        assertThatThrownBy(() -> service.createListing(1L, BigDecimal.valueOf(500000), 20L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void buyerCanPurchaseListingAndReceivesNewQr() {
        TicketAsset asset = asset(10L, TicketAssetStatus.LISTED_FOR_SALE);
        TicketResaleListing listing = listing(asset, TicketResaleListingStatus.ACTIVE);
        when(listingRepository.findLockedById(listing.getId())).thenReturn(Optional.of(listing));
        when(ticketAssetRepository.findLockedById(asset.getId())).thenReturn(Optional.of(asset));
        when(eventServiceClient.getInternalEvent(2L)).thenReturn(successEvent());
        when(ticketOwnershipService.regenerateQrCode(asset)).thenAnswer(invocation -> {
            asset.setQrCode("new-qr");
            return "new-qr";
        });
        when(ticketAssetRepository.save(any(TicketAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(listingRepository.save(any(TicketResaleListing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transferHistoryRepository.save(any(TicketTransferHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.purchaseListing(listing.getId(), 20L);

        assertThat(response.status()).isEqualTo(TicketResaleListingStatus.SOLD);
        assertThat(asset.getOwnerId()).isEqualTo(20L);
        assertThat(asset.getStatus()).isEqualTo(TicketAssetStatus.OWNED);
        assertThat(asset.getQrCode()).isEqualTo("new-qr");
        assertThat(asset.getQrCode()).isNotEqualTo("old-qr");
        assertThat(listing.getStatus()).isEqualTo(TicketResaleListingStatus.SOLD);

        ArgumentCaptor<TicketTransferHistory> historyCaptor = ArgumentCaptor.forClass(TicketTransferHistory.class);
        verify(transferHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getOldQrCode()).isEqualTo("old-qr");
        assertThat(historyCaptor.getValue().getNewQrCode()).isEqualTo("new-qr");
    }

    @Test
    void sellerNoLongerOwnsTicketAfterPurchase() {
        TicketAsset asset = asset(10L, TicketAssetStatus.LISTED_FOR_SALE);
        TicketResaleListing listing = listing(asset, TicketResaleListingStatus.ACTIVE);
        when(listingRepository.findLockedById(listing.getId())).thenReturn(Optional.of(listing));
        when(ticketAssetRepository.findLockedById(asset.getId())).thenReturn(Optional.of(asset));
        when(eventServiceClient.getInternalEvent(2L)).thenReturn(successEvent());
        when(ticketOwnershipService.regenerateQrCode(asset)).thenReturn("new-qr");
        when(ticketAssetRepository.save(any(TicketAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(listingRepository.save(any(TicketResaleListing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transferHistoryRepository.save(any(TicketTransferHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.purchaseListing(listing.getId(), 20L);

        assertThat(asset.getOwnerId()).isNotEqualTo(10L);
        assertThat(asset.getOwnerId()).isEqualTo(20L);
    }

    @Test
    void soldListingCannotBePurchasedAgain() {
        TicketAsset asset = asset(10L, TicketAssetStatus.OWNED);
        TicketResaleListing listing = listing(asset, TicketResaleListingStatus.SOLD);
        when(listingRepository.findLockedById(listing.getId())).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.purchaseListing(listing.getId(), 30L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void onlyOneBuyerCanWinWhenSecondPurchaseSeesSoldListing() {
        TicketAsset asset = asset(10L, TicketAssetStatus.LISTED_FOR_SALE);
        TicketResaleListing listing = listing(asset, TicketResaleListingStatus.ACTIVE);
        when(listingRepository.findLockedById(listing.getId())).thenReturn(Optional.of(listing));
        when(ticketAssetRepository.findLockedById(asset.getId())).thenReturn(Optional.of(asset));
        when(eventServiceClient.getInternalEvent(2L)).thenReturn(successEvent());
        when(ticketOwnershipService.regenerateQrCode(asset)).thenReturn("new-qr");
        when(ticketAssetRepository.save(any(TicketAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(listingRepository.save(any(TicketResaleListing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transferHistoryRepository.save(any(TicketTransferHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.purchaseListing(listing.getId(), 20L);

        assertThatThrownBy(() -> service.purchaseListing(listing.getId(), 30L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not active");
        assertThat(asset.getOwnerId()).isEqualTo(20L);
    }

    private EventApiResponse<InternalEventResponse> successEvent() {
        LocalDateTime start = LocalDateTime.now().plusDays(3);
        return new EventApiResponse<>(true, "OK", new InternalEventResponse(
                2L,
                "Tech Meetup",
                start,
                start.plusHours(2),
                "image.jpg",
                "Main Hall",
                "1 Nguyen Hue",
                "Ho Chi Minh City",
                100,
                BigDecimal.valueOf(100000),
                10,
                "PUBLISHED",
                99L
        ));
    }

    private TicketAsset asset(Long ownerId, TicketAssetStatus status) {
        return TicketAsset.builder()
                .id(UUID.randomUUID())
                .ticketId(1L)
                .eventId(2L)
                .eventName("Tech Meetup")
                .ownerId(ownerId)
                .originalBuyerId(10L)
                .ticketCode("EH-TK-20260701-TEST01")
                .qrCode("old-qr")
                .status(status)
                .purchasePrice(BigDecimal.valueOf(100000))
                .build();
    }

    private TicketResaleListing listing(TicketAsset asset, TicketResaleListingStatus status) {
        return TicketResaleListing.builder()
                .id(UUID.randomUUID())
                .ticketAssetId(asset.getId())
                .sellerId(10L)
                .price(BigDecimal.valueOf(500000))
                .status(status)
                .build();
    }

    private TicketResaleListing withListingId(TicketResaleListing listing) {
        listing.setId(UUID.randomUUID());
        return listing;
    }
}
