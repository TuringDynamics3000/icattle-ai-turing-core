"""
Financial Analytics Service
Australian Livestock Management System

Calculates comprehensive financial reports and analytics
"""

from decimal import Decimal
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import uuid

from domain.financial_reports import (
    MSAPremiumAnalysis, HerdValuation, RegionalPriceComparison,
    GradingPerformance, RevenueForecast, ConsolidatedFinancialReport
)


class FinancialAnalyticsService:
    """Service for calculating financial reports and analytics"""
    
    # MSA Premium rates (AUD per kg)
    MSA_PREMIUMS = {
        "5 Star": Decimal("0.80"),
        "4 Star": Decimal("0.40"),
        "3 Star": Decimal("0.00")
    }
    
    # Base market price (EYCI baseline)
    BASE_PRICE_AUD_PER_KG = Decimal("6.50")
    
    # Regional price variations (AUD per kg)
    REGIONAL_PRICES = {
        "QLD": Decimal("6.50"),
        "NSW": Decimal("6.45"),
        "VIC": Decimal("6.40"),
        "SA": Decimal("6.35"),
        "WA": Decimal("6.30"),
        "NT": Decimal("6.25"),
        "TAS": Decimal("6.35")
    }
    
    def calculate_msa_premium_analysis(
        self,
        period_start: date,
        period_end: date,
        grading_data: List[Dict]
    ) -> MSAPremiumAnalysis:
        """
        Calculate MSA premium analysis for a period
        
        Args:
            period_start: Start of analysis period
            period_end: End of analysis period
            grading_data: List of grading records with fields:
                - msa_grade: str
                - weight_kg: Decimal
        """
        
        # Count grades
        five_star = [g for g in grading_data if g["msa_grade"] == "5 Star"]
        four_star = [g for g in grading_data if g["msa_grade"] == "4 Star"]
        three_star = [g for g in grading_data if g["msa_grade"] == "3 Star"]
        
        total_animals = len(grading_data)
        
        # Calculate base value (without premiums)
        total_weight = sum(g["weight_kg"] for g in grading_data)
        total_base_value = total_weight * self.BASE_PRICE_AUD_PER_KG
        
        # Calculate MSA value (with premiums)
        five_star_value = sum(
            g["weight_kg"] * (self.BASE_PRICE_AUD_PER_KG + self.MSA_PREMIUMS["5 Star"])
            for g in five_star
        )
        four_star_value = sum(
            g["weight_kg"] * (self.BASE_PRICE_AUD_PER_KG + self.MSA_PREMIUMS["4 Star"])
            for g in four_star
        )
        three_star_value = sum(
            g["weight_kg"] * (self.BASE_PRICE_AUD_PER_KG + self.MSA_PREMIUMS["3 Star"])
            for g in three_star
        )
        
        total_msa_value = five_star_value + four_star_value + three_star_value
        total_premium = total_msa_value - total_base_value
        
        # Per-grade premiums
        five_star_premium = sum(g["weight_kg"] * self.MSA_PREMIUMS["5 Star"] for g in five_star)
        four_star_premium = sum(g["weight_kg"] * self.MSA_PREMIUMS["4 Star"] for g in four_star)
        three_star_premium = Decimal("0.00")
        
        # Averages
        avg_premium = total_premium / total_animals if total_animals > 0 else Decimal("0")
        avg_weight = total_weight / total_animals if total_animals > 0 else Decimal("0")
        
        # Premium percentage
        premium_pct = (total_premium / total_base_value * 100) if total_base_value > 0 else Decimal("0")
        
        return MSAPremiumAnalysis(
            period_start=period_start,
            period_end=period_end,
            total_animals_graded=total_animals,
            five_star_count=len(five_star),
            four_star_count=len(four_star),
            three_star_count=len(three_star),
            total_base_value=total_base_value,
            total_msa_value=total_msa_value,
            total_premium_captured=total_premium,
            five_star_premium=five_star_premium,
            four_star_premium=four_star_premium,
            three_star_premium=three_star_premium,
            average_premium_per_animal=avg_premium,
            average_weight_kg=avg_weight,
            premium_percentage=premium_pct
        )
    
    def calculate_herd_valuation(
        self,
        tenant_id: str,
        herd_data: List[Dict],
        region: str = "QLD"
    ) -> HerdValuation:
        """
        Calculate current market valuation of herd
        
        Args:
            tenant_id: Tenant identifier
            herd_data: List of animals with fields:
                - msa_grade: Optional[str]
                - weight_kg: Decimal
            region: Australian region for pricing
        """
        
        valuation_date = datetime.utcnow()
        base_price = self.REGIONAL_PRICES.get(region, self.BASE_PRICE_AUD_PER_KG)
        
        # Categorize by grade
        five_star = [a for a in herd_data if a.get("msa_grade") == "5 Star"]
        four_star = [a for a in herd_data if a.get("msa_grade") == "4 Star"]
        three_star = [a for a in herd_data if a.get("msa_grade") == "3 Star"]
        ungraded = [a for a in herd_data if not a.get("msa_grade")]
        
        # Calculate values
        five_star_value = sum(
            a["weight_kg"] * (base_price + self.MSA_PREMIUMS["5 Star"])
            for a in five_star
        )
        four_star_value = sum(
            a["weight_kg"] * (base_price + self.MSA_PREMIUMS["4 Star"])
            for a in four_star
        )
        three_star_value = sum(
            a["weight_kg"] * (base_price + self.MSA_PREMIUMS["3 Star"])
            for a in three_star
        )
        ungraded_value = sum(
            a["weight_kg"] * base_price
            for a in ungraded
        )
        
        total_value = five_star_value + four_star_value + three_star_value + ungraded_value
        total_head = len(herd_data)
        total_weight = sum(a["weight_kg"] for a in herd_data)
        
        avg_value_per_head = total_value / total_head if total_head > 0 else Decimal("0")
        value_per_kg = total_value / total_weight if total_weight > 0 else Decimal("0")
        
        return HerdValuation(
            valuation_date=valuation_date,
            tenant_id=tenant_id,
            total_head=total_head,
            total_weight_kg=total_weight,
            five_star_head=len(five_star),
            four_star_head=len(four_star),
            three_star_head=len(three_star),
            ungraded_head=len(ungraded),
            five_star_value=five_star_value,
            four_star_value=four_star_value,
            three_star_value=three_star_value,
            ungraded_value=ungraded_value,
            total_herd_value=total_value,
            base_price_per_kg=base_price,
            region=region,
            price_source="EYCI + Regional Adjustment",
            average_value_per_head=avg_value_per_head,
            value_per_kg=value_per_kg
        )
    
    def calculate_regional_comparison(
        self,
        sample_weight_kg: Decimal = Decimal("450"),
        sample_grade: str = "4 Star"
    ) -> RegionalPriceComparison:
        """Calculate regional price comparison"""
        
        comparison_date = datetime.utcnow()
        premium = self.MSA_PREMIUMS.get(sample_grade, Decimal("0"))
        
        # Calculate revenue by region
        revenue_by_region = {}
        for region, base_price in self.REGIONAL_PRICES.items():
            total_price = base_price + premium
            revenue = sample_weight_kg * total_price
            revenue_by_region[region] = revenue
        
        # Find best and worst markets
        best_region = max(revenue_by_region, key=revenue_by_region.get)
        worst_region = min(revenue_by_region, key=revenue_by_region.get)
        best_price = self.REGIONAL_PRICES[best_region] + premium
        worst_price = self.REGIONAL_PRICES[worst_region] + premium
        price_spread = best_price - worst_price
        
        best_market_advantage = revenue_by_region[best_region] - revenue_by_region[worst_region]
        
        return RegionalPriceComparison(
            comparison_date=comparison_date,
            qld_price=self.REGIONAL_PRICES["QLD"] + premium,
            nsw_price=self.REGIONAL_PRICES["NSW"] + premium,
            vic_price=self.REGIONAL_PRICES["VIC"] + premium,
            sa_price=self.REGIONAL_PRICES["SA"] + premium,
            wa_price=self.REGIONAL_PRICES["WA"] + premium,
            best_region=best_region,
            best_price=best_price,
            worst_region=worst_region,
            worst_price=worst_price,
            price_spread=price_spread,
            sample_weight_kg=sample_weight_kg,
            sample_grade=sample_grade,
            potential_revenue_by_region=revenue_by_region,
            best_market_advantage=best_market_advantage
        )
    
    def calculate_grading_performance(
        self,
        tenant_id: str,
        period_start: date,
        period_end: date,
        grading_data: List[Dict]
    ) -> GradingPerformance:
        """Calculate grading performance metrics"""
        
        total_graded = len(grading_data)
        days = (period_end - period_start).days or 1
        grading_rate = Decimal(str(total_graded)) / Decimal(str(days))
        
        # Grade distribution
        five_star_count = len([g for g in grading_data if g["msa_grade"] == "5 Star"])
        four_star_count = len([g for g in grading_data if g["msa_grade"] == "4 Star"])
        three_star_count = len([g for g in grading_data if g["msa_grade"] == "3 Star"])
        
        five_star_pct = (Decimal(five_star_count) / total_graded * 100) if total_graded > 0 else Decimal("0")
        four_star_pct = (Decimal(four_star_count) / total_graded * 100) if total_graded > 0 else Decimal("0")
        three_star_pct = (Decimal(three_star_count) / total_graded * 100) if total_graded > 0 else Decimal("0")
        
        # Weight statistics
        weights = [g["weight_kg"] for g in grading_data]
        avg_weight = sum(weights) / len(weights) if weights else Decimal("0")
        min_weight = min(weights) if weights else Decimal("0")
        max_weight = max(weights) if weights else Decimal("0")
        
        # Marbling (if available)
        marbling_scores = [g.get("marbling_score", 0) for g in grading_data if g.get("marbling_score")]
        avg_marbling = Decimal(str(sum(marbling_scores) / len(marbling_scores))) if marbling_scores else Decimal("0")
        
        # Trends (simplified)
        quality_trend = "stable"
        if five_star_pct > 30:
            quality_trend = "improving"
        elif five_star_pct < 10:
            quality_trend = "declining"
        
        weight_trend = "stable"
        
        # Benchmarking
        industry_avg = Decimal("25.0")  # Industry average 5-star percentage
        if five_star_pct > industry_avg:
            performance = "above"
        elif five_star_pct < industry_avg - 5:
            performance = "below"
        else:
            performance = "at"
        
        return GradingPerformance(
            period_start=period_start,
            period_end=period_end,
            tenant_id=tenant_id,
            total_graded=total_graded,
            grading_rate_per_day=grading_rate,
            five_star_percentage=five_star_pct,
            four_star_percentage=four_star_pct,
            three_star_percentage=three_star_pct,
            average_weight_kg=avg_weight,
            min_weight_kg=min_weight,
            max_weight_kg=max_weight,
            average_marbling_score=avg_marbling,
            quality_trend=quality_trend,
            weight_trend=weight_trend,
            industry_average_five_star_pct=industry_avg,
            performance_vs_industry=performance
        )
    
    def calculate_revenue_forecast(
        self,
        tenant_id: str,
        current_herd: List[Dict],
        forecast_days: int = 30,
        weight_gain_per_day: Decimal = Decimal("1.2")
    ) -> RevenueForecast:
        """Calculate revenue forecast"""
        
        forecast_date = datetime.utcnow()
        current_head = len(current_herd)
        current_weight = sum(a["weight_kg"] for a in current_herd)
        
        # Current value
        current_valuation = self.calculate_herd_valuation(tenant_id, current_herd)
        current_value = current_valuation.total_herd_value
        
        # Projected weight
        total_weight_gain = weight_gain_per_day * Decimal(str(forecast_days)) * Decimal(str(current_head))
        projected_weight = current_weight + total_weight_gain
        
        # Expected grade distribution (based on current)
        grade_counts = {
            "5 Star": len([a for a in current_herd if a.get("msa_grade") == "5 Star"]),
            "4 Star": len([a for a in current_herd if a.get("msa_grade") == "4 Star"]),
            "3 Star": len([a for a in current_herd if a.get("msa_grade") == "3 Star"])
        }
        
        grade_distribution = {
            grade: Decimal(str(count / current_head * 100)) if current_head > 0 else Decimal("0")
            for grade, count in grade_counts.items()
        }
        
        # Calculate projected revenue
        projected_base = projected_weight * self.BASE_PRICE_AUD_PER_KG
        
        # Estimate MSA premium based on grade distribution
        avg_premium_per_kg = (
            (grade_distribution.get("5 Star", Decimal("0")) / 100 * self.MSA_PREMIUMS["5 Star"]) +
            (grade_distribution.get("4 Star", Decimal("0")) / 100 * self.MSA_PREMIUMS["4 Star"])
        )
        projected_premium = projected_weight * avg_premium_per_kg
        projected_total = projected_base + projected_premium
        
        # Scenarios
        best_case = projected_total * Decimal("1.15")  # +15%
        worst_case = projected_total * Decimal("0.85")  # -15%
        
        # ROI
        revenue_increase = projected_total - current_value
        revenue_increase_pct = (revenue_increase / current_value * 100) if current_value > 0 else Decimal("0")
        
        return RevenueForecast(
            forecast_date=forecast_date,
            tenant_id=tenant_id,
            forecast_period_days=forecast_days,
            current_head=current_head,
            current_total_weight_kg=current_weight,
            current_herd_value=current_value,
            expected_weight_gain_kg_per_day=weight_gain_per_day,
            expected_market_price_aud_per_kg=self.BASE_PRICE_AUD_PER_KG,
            expected_grade_distribution=grade_distribution,
            projected_total_weight_kg=projected_weight,
            projected_base_revenue=projected_base,
            projected_msa_premium=projected_premium,
            projected_total_revenue=projected_total,
            confidence_level="medium",
            best_case_revenue=best_case,
            worst_case_revenue=worst_case,
            projected_revenue_increase=revenue_increase,
            projected_revenue_increase_pct=revenue_increase_pct
        )
    
    def generate_consolidated_report(
        self,
        tenant_id: str,
        period_start: date,
        period_end: date,
        grading_data: List[Dict],
        current_herd: List[Dict],
        region: str = "QLD"
    ) -> ConsolidatedFinancialReport:
        """Generate comprehensive consolidated financial report"""
        
        report_id = str(uuid.uuid4())
        generated_at = datetime.utcnow()
        
        # Generate all component reports
        msa_analysis = self.calculate_msa_premium_analysis(period_start, period_end, grading_data)
        herd_val = self.calculate_herd_valuation(tenant_id, current_herd, region)
        regional_comp = self.calculate_regional_comparison()
        grading_perf = self.calculate_grading_performance(tenant_id, period_start, period_end, grading_data)
        revenue_fc = self.calculate_revenue_forecast(tenant_id, current_herd)
        
        # Executive summary
        total_revenue = msa_analysis.total_msa_value
        total_premium = msa_analysis.total_premium_captured
        current_value = herd_val.total_herd_value
        projected_30day = revenue_fc.projected_total_revenue
        
        # Generate insights
        top_insight = f"MSA grading captured ${float(total_premium):,.2f} AUD in premiums ({float(msa_analysis.premium_percentage):.1f}% increase)"
        
        recommendations = [
            f"Focus on {regional_comp.best_region} market for best prices (${float(regional_comp.best_price):.2f}/kg)",
            f"Current 5-star rate: {float(grading_perf.five_star_percentage):.1f}% - Target: 30%+",
            f"Projected 30-day revenue: ${float(projected_30day):,.2f} AUD"
        ]
        
        if grading_perf.performance_vs_industry == "below":
            recommendations.append("Improve feeding program to increase 5-star percentage")
        
        return ConsolidatedFinancialReport(
            report_id=report_id,
            generated_at=generated_at,
            tenant_id=tenant_id,
            period_start=period_start,
            period_end=period_end,
            msa_premium_analysis=msa_analysis,
            herd_valuation=herd_val,
            regional_comparison=regional_comp,
            grading_performance=grading_perf,
            revenue_forecast=revenue_fc,
            total_revenue_captured=total_revenue,
            total_premium_captured=total_premium,
            current_herd_value=current_value,
            projected_30day_revenue=projected_30day,
            top_insight=top_insight,
            recommendations=recommendations
        )
