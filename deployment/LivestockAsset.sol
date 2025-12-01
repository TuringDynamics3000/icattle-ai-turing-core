// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LivestockAsset
 * @dev Smart contract for tokenizing livestock assets on RedBelly Network
 * 
 * Features:
 * - ERC-721 compatible NFT for each livestock animal
 * - MSA grading and NLIS compliance tracking
 * - Turing Protocol enforcement at contract level
 * - Immutable audit trail for regulatory compliance
 * - Real-world asset (RWA) tokenization optimized for RedBelly
 * 
 * @author iCattle.ai Development Team
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LivestockAsset is ERC721, AccessControl {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant GRADER_ROLE = keccak256("GRADER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // Token counter
    Counters.Counter private _tokenIds;
    
    // MSA Grading enum
    enum MSAGrade {
        THREE_STAR,
        FOUR_STAR,
        FIVE_STAR
    }
    
    // Turing Protocol headers (stored on-chain for auditability)
    struct TuringProtocol {
        string tenantId;        // X-Tenant-ID
        string requestId;       // X-Request-ID
        string userId;          // X-User-ID
        string deviceId;        // X-Device-ID
        string geoLocation;     // X-Geo-Location
        uint256 timestamp;      // Block timestamp
    }
    
    // Livestock asset metadata
    struct LivestockMetadata {
        string nlisId;          // NLIS tag number
        MSAGrade msaGrade;      // MSA grading (3/4/5 star)
        uint256 weightKg;       // Weight in kilograms (scaled by 10)
        uint8 marblingScore;    // AUS-MEAT marbling (0-9)
        uint8 fatScore;         // AUS-MEAT fat score (0-5)
        uint8 ageMonths;        // Age in months
        string breed;           // Breed (Angus, Hereford, etc.)
        string region;          // Australian region (QLD, NSW, etc.)
        string picNumber;       // Property Identification Code
        uint256 valuationAUD;   // Valuation in AUD cents
        bool isActive;          // Active status
    }
    
    // Grading event for audit trail
    struct GradingEvent {
        uint256 tokenId;
        MSAGrade grade;
        uint256 weightKg;
        address grader;
        uint256 timestamp;
        TuringProtocol turingProtocol;
    }
    
    // Storage mappings
    mapping(uint256 => LivestockMetadata) private _livestock;
    mapping(uint256 => TuringProtocol) private _turingRecords;
    mapping(string => uint256) private _nlisToToken;
    mapping(uint256 => GradingEvent[]) private _gradingHistory;
    
    // Events
    event LivestockMinted(
        uint256 indexed tokenId,
        string nlisId,
        address indexed owner,
        string tenantId
    );
    
    event LivestockGraded(
        uint256 indexed tokenId,
        MSAGrade grade,
        uint256 weightKg,
        address indexed grader,
        string requestId
    );
    
    event TuringProtocolRecorded(
        uint256 indexed tokenId,
        string tenantId,
        string requestId,
        string geoLocation
    );
    
    event LivestockTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    /**
     * @dev Constructor
     */
    constructor() ERC721("iCattle Livestock Asset", "CATTLE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GRADER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint new livestock asset NFT with Turing Protocol enforcement
     * 
     * @param to Owner address
     * @param nlisId NLIS tag number
     * @param msaGrade MSA grading (0=3-star, 1=4-star, 2=5-star)
     * @param weightKg Weight in kg (scaled by 10, e.g., 5255 = 525.5kg)
     * @param marblingScore AUS-MEAT marbling score (0-9)
     * @param fatScore AUS-MEAT fat score (0-5)
     * @param ageMonths Age in months
     * @param breed Breed name
     * @param region Australian region
     * @param picNumber Property Identification Code
     * @param valuationAUD Valuation in AUD cents
     * @param turingProtocol Turing Protocol headers
     * @return tokenId The newly minted token ID
     */
    function mintLivestock(
        address to,
        string memory nlisId,
        MSAGrade msaGrade,
        uint256 weightKg,
        uint8 marblingScore,
        uint8 fatScore,
        uint8 ageMonths,
        string memory breed,
        string memory region,
        string memory picNumber,
        uint256 valuationAUD,
        TuringProtocol memory turingProtocol
    ) public onlyRole(GRADER_ROLE) returns (uint256) {
        // Validate Turing Protocol
        require(
            bytes(turingProtocol.tenantId).length > 0 &&
            bytes(turingProtocol.requestId).length > 0 &&
            bytes(turingProtocol.userId).length > 0 &&
            bytes(turingProtocol.deviceId).length > 0 &&
            bytes(turingProtocol.geoLocation).length > 0,
            "Turing Protocol: All 5 headers required"
        );
        
        // Validate NLIS uniqueness
        require(_nlisToToken[nlisId] == 0, "NLIS ID already exists");
        
        // Validate grading parameters
        require(marblingScore <= 9, "Invalid marbling score");
        require(fatScore <= 5, "Invalid fat score");
        require(weightKg > 0, "Invalid weight");
        
        // Increment token ID
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint NFT
        _safeMint(to, newTokenId);
        
        // Store livestock metadata
        _livestock[newTokenId] = LivestockMetadata({
            nlisId: nlisId,
            msaGrade: msaGrade,
            weightKg: weightKg,
            marblingScore: marblingScore,
            fatScore: fatScore,
            ageMonths: ageMonths,
            breed: breed,
            region: region,
            picNumber: picNumber,
            valuationAUD: valuationAUD,
            isActive: true
        });
        
        // Store Turing Protocol record
        turingProtocol.timestamp = block.timestamp;
        _turingRecords[newTokenId] = turingProtocol;
        
        // Map NLIS to token
        _nlisToToken[nlisId] = newTokenId;
        
        // Record grading event
        _gradingHistory[newTokenId].push(GradingEvent({
            tokenId: newTokenId,
            grade: msaGrade,
            weightKg: weightKg,
            grader: msg.sender,
            timestamp: block.timestamp,
            turingProtocol: turingProtocol
        }));
        
        // Emit events
        emit LivestockMinted(newTokenId, nlisId, to, turingProtocol.tenantId);
        emit LivestockGraded(newTokenId, msaGrade, weightKg, msg.sender, turingProtocol.requestId);
        emit TuringProtocolRecorded(newTokenId, turingProtocol.tenantId, turingProtocol.requestId, turingProtocol.geoLocation);
        
        return newTokenId;
    }
    
    /**
     * @dev Update livestock grading with Turing Protocol
     */
    function updateGrading(
        uint256 tokenId,
        MSAGrade newGrade,
        uint256 newWeightKg,
        uint256 newValuationAUD,
        TuringProtocol memory turingProtocol
    ) public onlyRole(GRADER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        require(_livestock[tokenId].isActive, "Livestock not active");
        
        // Validate Turing Protocol
        require(
            bytes(turingProtocol.tenantId).length > 0 &&
            bytes(turingProtocol.requestId).length > 0,
            "Turing Protocol required"
        );
        
        // Update metadata
        _livestock[tokenId].msaGrade = newGrade;
        _livestock[tokenId].weightKg = newWeightKg;
        _livestock[tokenId].valuationAUD = newValuationAUD;
        
        // Record grading event
        turingProtocol.timestamp = block.timestamp;
        _gradingHistory[tokenId].push(GradingEvent({
            tokenId: tokenId,
            grade: newGrade,
            weightKg: newWeightKg,
            grader: msg.sender,
            timestamp: block.timestamp,
            turingProtocol: turingProtocol
        }));
        
        emit LivestockGraded(tokenId, newGrade, newWeightKg, msg.sender, turingProtocol.requestId);
    }
    
    /**
     * @dev Get livestock metadata
     */
    function getLivestock(uint256 tokenId) 
        public 
        view 
        returns (LivestockMetadata memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return _livestock[tokenId];
    }
    
    /**
     * @dev Get Turing Protocol record
     */
    function getTuringProtocol(uint256 tokenId)
        public
        view
        returns (TuringProtocol memory)
    {
        require(_exists(tokenId), "Token does not exist");
        return _turingRecords[tokenId];
    }
    
    /**
     * @dev Get grading history for audit trail
     */
    function getGradingHistory(uint256 tokenId)
        public
        view
        returns (GradingEvent[] memory)
    {
        require(_exists(tokenId), "Token does not exist");
        return _gradingHistory[tokenId];
    }
    
    /**
     * @dev Get token ID by NLIS tag
     */
    function getTokenByNLIS(string memory nlisId)
        public
        view
        returns (uint256)
    {
        uint256 tokenId = _nlisToToken[nlisId];
        require(tokenId != 0, "NLIS ID not found");
        return tokenId;
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    /**
     * @dev Calculate total herd valuation
     */
    function getTotalHerdValuation() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_livestock[i].isActive) {
                total += _livestock[i].valuationAUD;
            }
        }
        return total;
    }
    
    /**
     * @dev Get MSA grade distribution
     */
    function getMSADistribution() 
        public 
        view 
        returns (uint256 threeStar, uint256 fourStar, uint256 fiveStar) 
    {
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_livestock[i].isActive) {
                if (_livestock[i].msaGrade == MSAGrade.THREE_STAR) threeStar++;
                else if (_livestock[i].msaGrade == MSAGrade.FOUR_STAR) fourStar++;
                else if (_livestock[i].msaGrade == MSAGrade.FIVE_STAR) fiveStar++;
            }
        }
    }
    
    /**
     * @dev Override transfer to emit custom event
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            emit LivestockTransferred(tokenId, from, to, block.timestamp);
        }
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
