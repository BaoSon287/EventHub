package com.eventhub.booking.service;

import com.eventhub.booking.dto.TicketAssetResponse;
import com.eventhub.booking.dto.TicketTransferHistoryResponse;
import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.entity.TicketAsset;
import com.eventhub.booking.entity.TicketTransferHistory;
import com.eventhub.booking.enums.TicketAssetStatus;
import com.eventhub.booking.enums.TicketResaleListingStatus;
import com.eventhub.booking.repository.TicketAssetRepository;
import com.eventhub.booking.repository.TicketResaleListingRepository;
import com.eventhub.booking.repository.TicketTransferHistoryRepository;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketOwnershipService {
    private final TicketAssetRepository repository;
    private final TicketTransferHistoryRepository transferHistoryRepository;
    private final TicketResaleListingRepository resaleListingRepository;
    private final QrCodeService qrCodeService;

    public TicketOwnershipService(
            TicketAssetRepository repository,
            TicketTransferHistoryRepository transferHistoryRepository,
            TicketResaleListingRepository resaleListingRepository,
            QrCodeService qrCodeService
    ) {
        this.repository = repository;
        this.transferHistoryRepository = transferHistoryRepository;
        this.resaleListingRepository = resaleListingRepository;
        this.qrCodeService = qrCodeService;
    }

    @Transactional
    public TicketAsset createAssetAfterPurchase(Booking booking) {
        if (repository.existsByTicketId(booking.getId())) {
            throw new BadRequestException("TICKET_ASSET_ALREADY_EXISTS: Ticket asset already exists");
        }

        TicketAsset asset = TicketAsset.builder()
                .ticketId(booking.getId())
                .eventId(booking.getEventId())
                .ownerId(booking.getUserId())
                .originalBuyerId(booking.getUserId())
                .ticketCode(booking.getTicketCode())
                .status(TicketAssetStatus.OWNED)
                .purchasePrice(booking.getTotalPrice())
                .eventName(booking.getEventTitle())
                .build();

        TicketAsset saved = repository.saveAndFlush(asset);
        saved.setQrCode(qrPayload(saved));
        return repository.save(saved);
    }

    @Transactional
    public TicketAsset transferOwnership(UUID assetId, Long currentOwnerId, Long newOwnerId) {
        TicketAsset asset = getAsset(assetId);
        validateOwnership(asset, currentOwnerId);
        asset.setOwnerId(newOwnerId);
        asset.setStatus(TicketAssetStatus.TRANSFERRED);
        return repository.save(asset);
    }

    @Transactional
    public TicketAsset changeStatus(UUID assetId, TicketAssetStatus status) {
        TicketAsset asset = getAsset(assetId);
        asset.setStatus(status);
        return repository.save(asset);
    }

    public String regenerateQrCode(TicketAsset asset) {
        String qrCode = qrPayload(asset);
        asset.setQrCode(qrCode);
        return qrCode;
    }

    public void validateOwnership(TicketAsset asset, Long userId) {
        if (!asset.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("User can only access own ticket asset");
        }
    }

    public List<TicketAssetResponse> findMine(Long ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TicketAssetResponse findOwnedByTicketId(Long ticketId, Long ownerId) {
        TicketAsset asset = repository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        validateOwnership(asset, ownerId);
        return toResponse(asset);
    }

    public TicketAssetResponse findOwnedByAssetId(UUID assetId, Long ownerId) {
        TicketAsset asset = getAsset(assetId);
        validateOwnership(asset, ownerId);
        return toResponse(asset);
    }

    public List<TicketTransferHistoryResponse> findHistoryByTicketId(Long ticketId, Long userId) {
        TicketAsset asset = repository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
        return findHistory(asset, userId);
    }

    public List<TicketTransferHistoryResponse> findHistoryByAssetId(UUID assetId, Long userId) {
        return findHistory(getAsset(assetId), userId);
    }

    private TicketAsset getAsset(UUID assetId) {
        return repository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket asset not found"));
    }

    private List<TicketTransferHistoryResponse> findHistory(TicketAsset asset, Long userId) {
        List<TicketTransferHistory> history = transferHistoryRepository.findByTicketAssetIdOrderByCreatedAtDesc(asset.getId());
        boolean isParticipant = asset.getOwnerId().equals(userId)
                || history.stream().anyMatch(item -> userId.equals(item.getFromUserId()) || userId.equals(item.getToUserId()));
        if (!isParticipant) {
            throw new AccessDeniedException("User can only access own ticket history");
        }
        return history.stream().map(this::toHistoryResponse).toList();
    }

    private String qrPayload(TicketAsset asset) {
        String content = "{\"ticket_asset_id\":\"" + asset.getId()
                + "\",\"ticket_code\":\"" + asset.getTicketCode()
                + "\",\"qr_nonce\":\"" + UUID.randomUUID() + "\"}";
        return qrCodeService.generatePngDataUri(content);
    }

    private TicketAssetResponse toResponse(TicketAsset asset) {
        return new TicketAssetResponse(
                asset.getId(),
                asset.getTicketId(),
                asset.getEventId(),
                asset.getEventName(),
                asset.getStatus(),
                asset.getQrCode(),
                asset.getPurchasePrice(),
                resaleListingRepository.findByTicketAssetIdAndStatus(asset.getId(), TicketResaleListingStatus.ACTIVE)
                        .map(listing -> listing.getId())
                        .orElse(null)
        );
    }

    private TicketTransferHistoryResponse toHistoryResponse(TicketTransferHistory history) {
        return new TicketTransferHistoryResponse(
                history.getId(),
                history.getTicketAssetId(),
                history.getFromUserId(),
                history.getToUserId(),
                history.getAction(),
                history.getCreatedAt()
        );
    }
}
