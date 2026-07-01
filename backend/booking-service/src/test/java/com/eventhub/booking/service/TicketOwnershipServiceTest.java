package com.eventhub.booking.service;

import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.entity.TicketAsset;
import com.eventhub.booking.entity.TicketTransferHistory;
import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;
import com.eventhub.booking.enums.TicketAssetStatus;
import com.eventhub.booking.repository.TicketAssetRepository;
import com.eventhub.booking.repository.TicketResaleListingRepository;
import com.eventhub.booking.repository.TicketTransferHistoryRepository;
import com.eventhub.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketOwnershipServiceTest {
    @Mock
    private TicketAssetRepository repository;

    @Mock
    private TicketTransferHistoryRepository transferHistoryRepository;

    @Mock
    private TicketResaleListingRepository resaleListingRepository;

    @Mock
    private QrCodeService qrCodeService;

    private TicketOwnershipService service;

    @BeforeEach
    void setUp() {
        service = new TicketOwnershipService(repository, transferHistoryRepository, resaleListingRepository, qrCodeService);
    }

    @Test
    void createAssetAfterPurchaseCreatesOwnedAssetWithQrCode() {
        Booking booking = booking();
        UUID assetId = UUID.randomUUID();
        when(repository.existsByTicketId(1L)).thenReturn(false);
        when(repository.saveAndFlush(any(TicketAsset.class))).thenAnswer(invocation -> {
            TicketAsset asset = invocation.getArgument(0);
            asset.setId(assetId);
            return asset;
        });
        when(qrCodeService.generatePngDataUri(anyString())).thenReturn("data:image/png;base64,QR");
        when(repository.save(any(TicketAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketAsset asset = service.createAssetAfterPurchase(booking);

        assertThat(asset.getTicketId()).isEqualTo(1L);
        assertThat(asset.getEventId()).isEqualTo(2L);
        assertThat(asset.getOwnerId()).isEqualTo(10L);
        assertThat(asset.getOriginalBuyerId()).isEqualTo(10L);
        assertThat(asset.getStatus()).isEqualTo(TicketAssetStatus.OWNED);
        assertThat(asset.getQrCode()).isEqualTo("data:image/png;base64,QR");
        verify(qrCodeService).generatePngDataUri(org.mockito.ArgumentMatchers.contains("\"ticket_asset_id\":\"" + assetId + "\""));
    }

    @Test
    void userCanViewOwnTicketAsset() {
        TicketAsset asset = asset(10L);
        when(repository.findByTicketId(1L)).thenReturn(Optional.of(asset));

        var response = service.findOwnedByTicketId(1L, 10L);

        assertThat(response.ticketId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo(TicketAssetStatus.OWNED);
    }

    @Test
    void userCanViewOwnTicketAssetByAssetId() {
        TicketAsset asset = asset(10L);
        when(repository.findById(asset.getId())).thenReturn(Optional.of(asset));

        var response = service.findOwnedByAssetId(asset.getId(), 10L);

        assertThat(response.id()).isEqualTo(asset.getId());
        assertThat(response.ticketId()).isEqualTo(1L);
    }

    @Test
    void userCannotViewOtherUsersTicketAsset() {
        when(repository.findByTicketId(1L)).thenReturn(Optional.of(asset(20L)));

        assertThatThrownBy(() -> service.findOwnedByTicketId(1L, 10L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void oneTicketCannotCreateTwoAssets() {
        when(repository.existsByTicketId(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.createAssetAfterPurchase(booking()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("TICKET_ASSET_ALREADY_EXISTS");
    }

    @Test
    void transferOwnershipRequiresCurrentOwner() {
        UUID assetId = UUID.randomUUID();
        when(repository.findById(assetId)).thenReturn(Optional.of(asset(20L)));

        assertThatThrownBy(() -> service.transferOwnership(assetId, 10L, 30L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void participantCanViewTicketHistoryWithoutQrCodes() {
        TicketAsset asset = asset(20L);
        TicketTransferHistory history = TicketTransferHistory.builder()
                .id(UUID.randomUUID())
                .ticketAssetId(asset.getId())
                .fromUserId(10L)
                .toUserId(20L)
                .action(com.eventhub.booking.enums.TicketTransferAction.PURCHASED)
                .oldQrCode("old-qr")
                .newQrCode("new-qr")
                .build();
        when(repository.findById(asset.getId())).thenReturn(Optional.of(asset));
        when(transferHistoryRepository.findByTicketAssetIdOrderByCreatedAtDesc(asset.getId())).thenReturn(List.of(history));

        var response = service.findHistoryByAssetId(asset.getId(), 10L);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).fromUserId()).isEqualTo(10L);
        assertThat(response.get(0).toUserId()).isEqualTo(20L);
    }

    private Booking booking() {
        return Booking.builder()
                .id(1L)
                .bookingCode("EH-TEST")
                .userId(10L)
                .eventId(2L)
                .eventTitle("Tech Meetup")
                .quantity(1)
                .ticketPrice(BigDecimal.valueOf(100000))
                .totalPrice(BigDecimal.valueOf(100000))
                .status(BookingStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.PAID)
                .ticketCode("EH-TK-20260701-TEST01")
                .build();
    }

    private TicketAsset asset(Long ownerId) {
        return TicketAsset.builder()
                .id(UUID.randomUUID())
                .ticketId(1L)
                .eventId(2L)
                .eventName("Tech Meetup")
                .ownerId(ownerId)
                .originalBuyerId(20L)
                .ticketCode("EH-TK-20260701-TEST01")
                .qrCode("data:image/png;base64,QR")
                .status(TicketAssetStatus.OWNED)
                .purchasePrice(BigDecimal.valueOf(100000))
                .build();
    }
}
