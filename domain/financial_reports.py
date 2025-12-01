"""
Financial Reporting Domain Models
Australian Livestock Management System

Provides comprehensive financial analysis including:
- MSA premium revenue analysis
- Herd valuation reports
- Regional price comparisons
- Grading performance metrics
- Revenue forecasting
"""

from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime, date
from typing import List, Dict, Optional
from enum import Enum


class ReportPeriod(str, Enum):
    """Reporting period types"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    """Report output formats"""
    JSON = "json"
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


@dataclass
class MSAPremiumAnalysis:
    """Analysis of MSA grading premiums captured"""
    period_start: date
    period_end: date
    
    # Grading statistics
    total_animals_graded: int
    five_star_count: int
    four_star_count: int
    three_star_count: int
    
    # Financial metrics (AUD)
    total_base_value: Decimal  # Value without MSA premium
    total_msa_value: Decimal   # Value with MSA premium
    total_premium_captured: Decimal  # Difference
    
    # Per-grade breakdown
    five_star_premium: Decimal
    four_star_premium: Decimal
    three_star_premium: Decimal
    
    # Average metrics
    average_premium_per_animal: Decimal
    average_weight_kg: Decimal
    
    # Percentage improvements
    premium_percentage: Decimal  # % increase over base value
    
    def to_dict(self) -> Dict:
        return {
            "period": {
                "start": self.period_start.isoformat(),
                "end": self.period_end.isoformat()
            },
            "grading_statistics": {
                "total_animals": self.total_animals_graded,
                "5_star": self.five_star_count,
                "4_star": self.four_star_count,
                "3_star": self.three_star_count
            },
            "financial_summary_aud": {
                "base_value": float(self.total_base_value),
                "msa_value": float(self.total_msa_value),
                "premium_captured": float(self.total_premium_captured),
                "premium_percentage": float(self.premium_percentage)
            },
            "grade_premiums_aud": {
                "5_star": float(self.five_star_premium),
                "4_star": float(self.four_star_premium),
                "3_star": float(self.three_star_premium)
            },
            "averages": {
                "premium_per_animal_aud": float(self.average_premium_per_animal),
                "weight_kg": float(self.average_weight_kg)
            }
        }


@dataclass
class HerdValuation:
    """Current market valuation of livestock herd"""
    valuation_date: datetime
    tenant_id: str
    
    # Herd composition
    total_head: int
    total_weight_kg: Decimal
    
    # Grade distribution
    five_star_head: int
    four_star_head: int
    three_star_head: int
    ungraded_head: int
    
    # Valuation by grade (AUD)
    five_star_value: Decimal
    four_star_value: Decimal
    three_star_value: Decimal
    ungraded_value: Decimal
    total_herd_value: Decimal
    
    # Market pricing used
    base_price_per_kg: Decimal
    region: str
    price_source: str
    
    # Value metrics
    average_value_per_head: Decimal
    value_per_kg: Decimal
    
    def to_dict(self) -> Dict:
        return {
            "valuation_date": self.valuation_date.isoformat(),
            "tenant_id": self.tenant_id,
            "herd_composition": {
                "total_head": self.total_head,
                "total_weight_kg": float(self.total_weight_kg),
                "grade_distribution": {
                    "5_star": self.five_star_head,
                    "4_star": self.four_star_head,
                    "3_star": self.three_star_head,
                    "ungraded": self.ungraded_head
                }
            },
            "valuation_aud": {
                "5_star": float(self.five_star_value),
                "4_star": float(self.four_star_value),
                "3_star": float(self.three_star_value),
                "ungraded": float(self.ungraded_value),
                "total": float(self.total_herd_value)
            },
            "market_data": {
                "base_price_per_kg_aud": float(self.base_price_per_kg),
                "region": self.region,
                "source": self.price_source
            },
            "metrics": {
                "average_value_per_head_aud": float(self.average_value_per_head),
                "value_per_kg_aud": float(self.value_per_kg)
            }
        }


@dataclass
class RegionalPriceComparison:
    """Comparison of livestock prices across Australian regions"""
    comparison_date: datetime
    
    # Regional pricing (AUD per kg)
    qld_price: Decimal
    nsw_price: Decimal
    vic_price: Decimal
    sa_price: Decimal
    wa_price: Decimal
    
    # Best market analysis
    best_region: str
    best_price: Decimal
    worst_region: str
    worst_price: Decimal
    price_spread: Decimal  # Difference between best and worst
    
    # Opportunity analysis for a sample animal
    sample_weight_kg: Decimal
    sample_grade: str
    potential_revenue_by_region: Dict[str, Decimal]
    best_market_advantage: Decimal  # Extra revenue in best market
    
    def to_dict(self) -> Dict:
        return {
            "comparison_date": self.comparison_date.isoformat(),
            "regional_prices_aud_per_kg": {
                "QLD": float(self.qld_price),
                "NSW": float(self.nsw_price),
                "VIC": float(self.vic_price),
                "SA": float(self.sa_price),
                "WA": float(self.wa_price)
            },
            "market_analysis": {
                "best_market": {
                    "region": self.best_region,
                    "price": float(self.best_price)
                },
                "worst_market": {
                    "region": self.worst_region,
                    "price": float(self.worst_price)
                },
                "price_spread_aud": float(self.price_spread)
            },
            "opportunity_analysis": {
                "sample_animal": {
                    "weight_kg": float(self.sample_weight_kg),
                    "grade": self.sample_grade
                },
                "revenue_by_region_aud": {
                    region: float(value) 
                    for region, value in self.potential_revenue_by_region.items()
                },
                "best_market_advantage_aud": float(self.best_market_advantage)
            }
        }


@dataclass
class GradingPerformance:
    """Performance metrics for MSA grading operations"""
    period_start: date
    period_end: date
    tenant_id: str
    
    # Volume metrics
    total_graded: int
    grading_rate_per_day: Decimal
    
    # Quality distribution (percentages)
    five_star_percentage: Decimal
    four_star_percentage: Decimal
    three_star_percentage: Decimal
    
    # Weight statistics
    average_weight_kg: Decimal
    min_weight_kg: Decimal
    max_weight_kg: Decimal
    
    # Marbling statistics
    average_marbling_score: Decimal
    
    # Trends
    quality_trend: str  # "improving", "stable", "declining"
    weight_trend: str
    
    # Benchmarking
    industry_average_five_star_pct: Decimal
    performance_vs_industry: str  # "above", "at", "below"
    
    def to_dict(self) -> Dict:
        return {
            "period": {
                "start": self.period_start.isoformat(),
                "end": self.period_end.isoformat()
            },
            "tenant_id": self.tenant_id,
            "volume": {
                "total_graded": self.total_graded,
                "grading_rate_per_day": float(self.grading_rate_per_day)
            },
            "quality_distribution_pct": {
                "5_star": float(self.five_star_percentage),
                "4_star": float(self.four_star_percentage),
                "3_star": float(self.three_star_percentage)
            },
            "weight_statistics_kg": {
                "average": float(self.average_weight_kg),
                "min": float(self.min_weight_kg),
                "max": float(self.max_weight_kg)
            },
            "quality_metrics": {
                "average_marbling_score": float(self.average_marbling_score)
            },
            "trends": {
                "quality": self.quality_trend,
                "weight": self.weight_trend
            },
            "benchmarking": {
                "industry_avg_5_star_pct": float(self.industry_average_five_star_pct),
                "performance": self.performance_vs_industry
            }
        }


@dataclass
class RevenueForec ast:
    """Revenue forecasting based on current herd and market conditions"""
    forecast_date: datetime
    tenant_id: str
    forecast_period_days: int
    
    # Current herd snapshot
    current_head: int
    current_total_weight_kg: Decimal
    current_herd_value: Decimal
    
    # Forecast assumptions
    expected_weight_gain_kg_per_day: Decimal
    expected_market_price_aud_per_kg: Decimal
    expected_grade_distribution: Dict[str, Decimal]  # Percentages
    
    # Forecast results (AUD)
    projected_total_weight_kg: Decimal
    projected_base_revenue: Decimal
    projected_msa_premium: Decimal
    projected_total_revenue: Decimal
    
    # Confidence and scenarios
    confidence_level: str  # "high", "medium", "low"
    best_case_revenue: Decimal
    worst_case_revenue: Decimal
    
    # ROI metrics
    projected_revenue_increase: Decimal
    projected_revenue_increase_pct: Decimal
    
    def to_dict(self) -> Dict:
        return {
            "forecast_date": self.forecast_date.isoformat(),
            "tenant_id": self.tenant_id,
            "forecast_period_days": self.forecast_period_days,
            "current_snapshot": {
                "head": self.current_head,
                "total_weight_kg": float(self.current_total_weight_kg),
                "current_value_aud": float(self.current_herd_value)
            },
            "assumptions": {
                "weight_gain_kg_per_day": float(self.expected_weight_gain_kg_per_day),
                "market_price_aud_per_kg": float(self.expected_market_price_aud_per_kg),
                "grade_distribution_pct": {
                    grade: float(pct) 
                    for grade, pct in self.expected_grade_distribution.items()
                }
            },
            "projections_aud": {
                "total_weight_kg": float(self.projected_total_weight_kg),
                "base_revenue": float(self.projected_base_revenue),
                "msa_premium": float(self.projected_msa_premium),
                "total_revenue": float(self.projected_total_revenue)
            },
            "scenarios_aud": {
                "confidence": self.confidence_level,
                "best_case": float(self.best_case_revenue),
                "worst_case": float(self.worst_case_revenue)
            },
            "roi_metrics": {
                "revenue_increase_aud": float(self.projected_revenue_increase),
                "revenue_increase_pct": float(self.projected_revenue_increase_pct)
            }
        }


@dataclass
class ConsolidatedFinancialReport:
    """Master financial report combining all analyses"""
    report_id: str
    generated_at: datetime
    tenant_id: str
    period_start: date
    period_end: date
    
    # Component reports
    msa_premium_analysis: MSAPremiumAnalysis
    herd_valuation: HerdValuation
    regional_comparison: RegionalPriceComparison
    grading_performance: GradingPerformance
    revenue_forecast: RevenueForecast
    
    # Executive summary
    total_revenue_captured: Decimal
    total_premium_captured: Decimal
    current_herd_value: Decimal
    projected_30day_revenue: Decimal
    
    # Key insights
    top_insight: str
    recommendations: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "report_metadata": {
                "report_id": self.report_id,
                "generated_at": self.generated_at.isoformat(),
                "tenant_id": self.tenant_id,
                "period": {
                    "start": self.period_start.isoformat(),
                    "end": self.period_end.isoformat()
                }
            },
            "executive_summary_aud": {
                "total_revenue_captured": float(self.total_revenue_captured),
                "total_premium_captured": float(self.total_premium_captured),
                "current_herd_value": float(self.current_herd_value),
                "projected_30day_revenue": float(self.projected_30day_revenue)
            },
            "detailed_reports": {
                "msa_premium_analysis": self.msa_premium_analysis.to_dict(),
                "herd_valuation": self.herd_valuation.to_dict(),
                "regional_comparison": self.regional_comparison.to_dict(),
                "grading_performance": self.grading_performance.to_dict(),
                "revenue_forecast": self.revenue_forecast.to_dict()
            },
            "insights": {
                "top_insight": self.top_insight,
                "recommendations": self.recommendations
            }
        }
