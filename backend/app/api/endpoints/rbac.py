from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.api.deps import AllowedRoles
from app.models.user import User

router = APIRouter()

@router.get("/buyer/war-room", response_model=Dict[str, Any])
def get_buyer_war_room(current_user: User = Depends(AllowedRoles(["buyer", "admin"]))):
    """
    Get Buyer Negotiation War Room analytics and exit options.
    """
    return {
        "role": "buyer",
        "title": "AI Negotiation War Room",
        "description": "Predicts seller urgency, buyer pressure, and outlines negotiation tactics.",
        "metrics": {
            "seller_urgency": "High (Relocating in 2 months)",
            "fair_value_discount": "4.2%",
            "recommended_offer": "SGD 1,380,000",
            "max_walkaway_price": "SGD 1,430,000",
            "tactics": [
                "Highlight prompt closing capacity to leverage relocation timeline",
                "Start with low-ball offer of SGD 1.35M to anchor negotiation",
                "Offer flexible lease-back period if needed to lower price further"
            ]
        }
    }

@router.get("/seller/analytics", response_model=Dict[str, Any])
def get_seller_analytics(current_user: User = Depends(AllowedRoles(["seller", "admin"]))):
    """
    Get Seller Exit Timing and Demand Analytics.
    """
    return {
        "role": "seller",
        "title": "Exit Timing & Demand Analytics",
        "description": "Calculates optimal sell window and predicts demand depth for private condos.",
        "metrics": {
            "optimal_exit_window": "Q4 2026",
            "buyer_demand_index": "8.4/10",
            "estimated_appreciation_left": "1.8% over next 12 months",
            "active_buyers_in_district": 142,
            "tactics": [
                "Wait till supply drop in Q4 to list for maximum premium",
                "Target HDB upgraders from nearby estate to command higher PSF",
                "Stage property with natural light focus to maximize premium"
            ]
        }
    }

@router.get("/investor/signals", response_model=Dict[str, Any])
def get_investor_signals(current_user: User = Depends(AllowedRoles(["investor", "admin"]))):
    """
    Get Advanced Portfolio Appreciation and High-Yield signals.
    """
    return {
        "role": "investor",
        "title": "High-Yield Portfolio Signals",
        "description": "Spots undervalued opportunities, high rental yields, and capital gains forecasts.",
        "metrics": {
            "undervalued_count": 12,
            "avg_rental_yield_target": "4.8%",
            "top_gains_forecast_district": "D15 East Coast (est. +12.4% over 3 years)",
            "hot_deals": [
                {"name": "Meyer Mansion", "discount": "7.5% below historical", "target_yield": "4.2%"},
                {"name": "Amber Park", "discount": "5.8% below historical", "target_yield": "4.5%"},
                {"name": "One Meyer", "discount": "6.2% below historical", "target_yield": "4.1%"}
            ]
        }
    }

@router.get("/tenant/matchmaking", response_model=Dict[str, Any])
def get_tenant_matchmaking(current_user: User = Depends(AllowedRoles(["tenant", "admin"]))):
    """
    Get Rental Matchmaking and Commute-based search.
    """
    return {
        "role": "tenant",
        "title": "AI Rental Matchmaking",
        "description": "Aligns listings with lifestyle preferences, budget, and work commutes.",
        "metrics": {
            "commute_time_mins": 25,
            "lifestyle_match_score": "94%",
            "recommended_tenancies": [
                {"name": "City Square Residences", "commute": "12 mins to Raffles Place via MRT", "rent": "SGD 4,500/mo"},
                {"name": "Kerrisdale", "commute": "15 mins to Raffles Place via MRT", "rent": "SGD 4,300/mo"}
            ],
            "agreement_intelligence": {
                "risk_profile": "Low Risk",
                "warnings": ["Check minor repairs clause cap (standard SGD 150)"]
            }
        }
    }

@router.get("/landlord/yield", response_model=Dict[str, Any])
def get_landlord_yield(current_user: User = Depends(AllowedRoles(["landlord", "admin"]))):
    """
    Get Rental Yield Optimization and Tenant Fit Prediction.
    """
    return {
        "role": "landlord",
        "title": "Rental Yield Optimization",
        "description": "Optimizes rental pricing and evaluates tenant reliability/profiles.",
        "metrics": {
            "optimal_listing_rent": "SGD 5,200/mo",
            "current_yield": "4.1%",
            "tenant_fit_reliability": "96% (Low risk of default, long-term intent)",
            "lease_renewal_probability": "82%",
            "optimizations": [
                "Increase rent by SGD 150/mo on renewal based on district comps",
                "Include complimentary bi-annual aircon servicing to retain tenant"
            ]
        }
    }

@router.get("/agency-manager/leads", response_model=Dict[str, Any])
def get_agency_manager_leads(current_user: User = Depends(AllowedRoles(["agency_manager", "admin"]))):
    """
    Get Team Lead Scoring and Organization-Level Performance Analytics.
    """
    return {
        "role": "agency_manager",
        "title": "Agency Team & Lead Scoring",
        "description": "Monitors team closing rates, lead scores, and subscription usage.",
        "metrics": {
            "team_closing_rate": "68%",
            "active_leads_assigned": 310,
            "lead_conversion_multiplier": "1.4x",
            "seat_utilization": "85% (17 of 20 seats active)",
            "top_performing_agents": [
                {"name": "Sarah Tan", "closings": 14, "revenue": "SGD 280,000"},
                {"name": "Marcus Lee", "closings": 12, "revenue": "SGD 240,000"}
            ]
        }
    }

@router.get("/admin/governance", response_model=Dict[str, Any])
def get_admin_governance(current_user: User = Depends(AllowedRoles(["admin"]))):
    """
    Get Platform Governance, Audits, and Compliance Configuration.
    """
    return {
        "role": "admin",
        "title": "Platform Governance Panel",
        "description": "System configuration, compliance checks, and security audits.",
        "metrics": {
            "system_health": "99.98% uptime",
            "active_tenants": 4,
            "unresolved_reports": 0,
            "pii_compliance_checks": "Passed (PDPA compliant)",
            "security_alerts": "0 Critical, 2 Minor"
        }
    }
