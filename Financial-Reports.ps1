# iCattle.ai Financial Reporting System
# Comprehensive PowerShell-based financial analysis for Australian livestock operations
#
# Usage: .\Financial-Reports.ps1 -ReportType [All|Premium|Valuation|Regional|Performance|Forecast] -TenantID "AU-QPIC12345"

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('All','Premium','Valuation','Regional','Performance','Forecast')]
    [string]$ReportType = 'All',
    
    [Parameter(Mandatory=$false)]
    [string]$TenantID = 'AU-QPIC12345',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'QLD',
    
    [Parameter(Mandatory=$false)]
    [int]$ForecastDays = 30,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = 'Console',  # Console, JSON, CSV
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = $null
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$MSAPremiums = @{
    "5 Star" = 0.80
    "4 Star" = 0.40
    "3 Star" = 0.00
}

$BasePricePerKg = 6.50

$RegionalPrices = @{
    "QLD" = 6.50
    "NSW" = 6.45
    "VIC" = 6.40
    "SA" = 6.35
    "WA" = 6.30
    "NT" = 6.25
    "TAS" = 6.35
}

$WeightGainPerDay = 1.2  # kg per animal per day

# ============================================================================
# SAMPLE DATA (Replace with actual data from API/Database)
# ============================================================================

function Get-SampleHerdData {
    return @(
        @{ animal_id = "982000123456701"; msa_grade = "5 Star"; weight_kg = 520; marbling_score = 9; graded_date = (Get-Date).AddDays(-10) },
        @{ animal_id = "982000123456702"; msa_grade = "5 Star"; weight_kg = 510; marbling_score = 8; graded_date = (Get-Date).AddDays(-9) },
        @{ animal_id = "982000123456703"; msa_grade = "4 Star"; weight_kg = 480; marbling_score = 7; graded_date = (Get-Date).AddDays(-8) },
        @{ animal_id = "982000123456704"; msa_grade = "4 Star"; weight_kg = 470; marbling_score = 6; graded_date = (Get-Date).AddDays(-7) },
        @{ animal_id = "982000123456705"; msa_grade = "4 Star"; weight_kg = 465; marbling_score = 7; graded_date = (Get-Date).AddDays(-6) },
        @{ animal_id = "982000123456706"; msa_grade = "3 Star"; weight_kg = 450; marbling_score = 5; graded_date = (Get-Date).AddDays(-5) },
        @{ animal_id = "982000123456707"; msa_grade = "3 Star"; weight_kg = 445; marbling_score = 4; graded_date = (Get-Date).AddDays(-4) },
        @{ animal_id = "982000123456708"; msa_grade = "5 Star"; weight_kg = 530; marbling_score = 9; graded_date = (Get-Date).AddDays(-3) },
        @{ animal_id = "982000123456709"; msa_grade = "4 Star"; weight_kg = 475; marbling_score = 6; graded_date = (Get-Date).AddDays(-2) },
        @{ animal_id = "982000123456710"; msa_grade = "4 Star"; weight_kg = 460; marbling_score = 7; graded_date = (Get-Date).AddDays(-1) }
    )
}

# ============================================================================
# FINANCIAL CALCULATION FUNCTIONS
# ============================================================================

function Calculate-MSAPremiumAnalysis {
    param(
        [Parameter(Mandatory=$true)]
        [array]$HerdData
    )
    
    $fiveStar = $HerdData | Where-Object { $_.msa_grade -eq "5 Star" }
    $fourStar = $HerdData | Where-Object { $_.msa_grade -eq "4 Star" }
    $threeStar = $HerdData | Where-Object { $_.msa_grade -eq "3 Star" }
    
    $totalWeight = ($HerdData | Measure-Object -Property weight_kg -Sum).Sum
    $baseValue = $totalWeight * $BasePricePerKg
    
    # Calculate MSA value with premiums
    $fiveStarValue = ($fiveStar | ForEach-Object { $_.weight_kg * ($BasePricePerKg + $MSAPremiums["5 Star"]) } | Measure-Object -Sum).Sum
    $fourStarValue = ($fourStar | ForEach-Object { $_.weight_kg * ($BasePricePerKg + $MSAPremiums["4 Star"]) } | Measure-Object -Sum).Sum
    $threeStarValue = ($threeStar | ForEach-Object { $_.weight_kg * ($BasePricePerKg + $MSAPremiums["3 Star"]) } | Measure-Object -Sum).Sum
    
    $msaValue = $fiveStarValue + $fourStarValue + $threeStarValue
    $premiumCaptured = $msaValue - $baseValue
    
    # Per-grade premiums
    $fiveStarPremium = ($fiveStar | ForEach-Object { $_.weight_kg * $MSAPremiums["5 Star"] } | Measure-Object -Sum).Sum
    $fourStarPremium = ($fourStar | ForEach-Object { $_.weight_kg * $MSAPremiums["4 Star"] } | Measure-Object -Sum).Sum
    
    $avgPremium = if ($HerdData.Count -gt 0) { $premiumCaptured / $HerdData.Count } else { 0 }
    $avgWeight = if ($HerdData.Count -gt 0) { $totalWeight / $HerdData.Count } else { 0 }
    $premiumPct = if ($baseValue -gt 0) { ($premiumCaptured / $baseValue) * 100 } else { 0 }
    
    return @{
        total_animals = $HerdData.Count
        five_star_count = $fiveStar.Count
        four_star_count = $fourStar.Count
        three_star_count = $threeStar.Count
        total_weight_kg = [math]::Round($totalWeight, 2)
        base_value_aud = [math]::Round($baseValue, 2)
        msa_value_aud = [math]::Round($msaValue, 2)
        premium_captured_aud = [math]::Round($premiumCaptured, 2)
        five_star_premium_aud = [math]::Round($fiveStarPremium, 2)
        four_star_premium_aud = [math]::Round($fourStarPremium, 2)
        average_premium_per_animal_aud = [math]::Round($avgPremium, 2)
        average_weight_kg = [math]::Round($avgWeight, 2)
        premium_percentage = [math]::Round($premiumPct, 2)
    }
}

function Calculate-HerdValuation {
    param(
        [Parameter(Mandatory=$true)]
        [array]$HerdData,
        
        [Parameter(Mandatory=$true)]
        [string]$Region
    )
    
    $basePrice = $RegionalPrices[$Region]
    if (-not $basePrice) { $basePrice = $BasePricePerKg }
    
    $fiveStar = $HerdData | Where-Object { $_.msa_grade -eq "5 Star" }
    $fourStar = $HerdData | Where-Object { $_.msa_grade -eq "4 Star" }
    $threeStar = $HerdData | Where-Object { $_.msa_grade -eq "3 Star" }
    $ungraded = $HerdData | Where-Object { -not $_.msa_grade }
    
    $fiveStarValue = ($fiveStar | ForEach-Object { $_.weight_kg * ($basePrice + $MSAPremiums["5 Star"]) } | Measure-Object -Sum).Sum
    $fourStarValue = ($fourStar | ForEach-Object { $_.weight_kg * ($basePrice + $MSAPremiums["4 Star"]) } | Measure-Object -Sum).Sum
    $threeStarValue = ($threeStar | ForEach-Object { $_.weight_kg * ($basePrice + $MSAPremiums["3 Star"]) } | Measure-Object -Sum).Sum
    $ungradedValue = ($ungraded | ForEach-Object { $_.weight_kg * $basePrice } | Measure-Object -Sum).Sum
    
    $totalValue = $fiveStarValue + $fourStarValue + $threeStarValue + $ungradedValue
    $totalWeight = ($HerdData | Measure-Object -Property weight_kg -Sum).Sum
    
    $avgValuePerHead = if ($HerdData.Count -gt 0) { $totalValue / $HerdData.Count } else { 0 }
    $valuePerKg = if ($totalWeight -gt 0) { $totalValue / $totalWeight } else { 0 }
    
    return @{
        valuation_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        region = $Region
        total_head = $HerdData.Count
        total_weight_kg = [math]::Round($totalWeight, 2)
        five_star_head = $fiveStar.Count
        four_star_head = $fourStar.Count
        three_star_head = $threeStar.Count
        ungraded_head = $ungraded.Count
        five_star_value_aud = [math]::Round($fiveStarValue, 2)
        four_star_value_aud = [math]::Round($fourStarValue, 2)
        three_star_value_aud = [math]::Round($threeStarValue, 2)
        ungraded_value_aud = [math]::Round($ungradedValue, 2)
        total_herd_value_aud = [math]::Round($totalValue, 2)
        base_price_per_kg_aud = $basePrice
        average_value_per_head_aud = [math]::Round($avgValuePerHead, 2)
        value_per_kg_aud = [math]::Round($valuePerKg, 2)
    }
}

function Calculate-RegionalComparison {
    param(
        [Parameter(Mandatory=$false)]
        [decimal]$SampleWeightKg = 450,
        
        [Parameter(Mandatory=$false)]
        [string]$SampleGrade = "4 Star"
    )
    
    $premium = $MSAPremiums[$SampleGrade]
    if (-not $premium) { $premium = 0 }
    
    $revenueByRegion = @{}
    foreach ($region in $RegionalPrices.Keys) {
        $totalPrice = $RegionalPrices[$region] + $premium
        $revenue = $SampleWeightKg * $totalPrice
        $revenueByRegion[$region] = [math]::Round($revenue, 2)
    }
    
    $bestRegion = ($revenueByRegion.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
    $worstRegion = ($revenueByRegion.GetEnumerator() | Sort-Object Value | Select-Object -First 1).Key
    
    $bestPrice = $RegionalPrices[$bestRegion] + $premium
    $worstPrice = $RegionalPrices[$worstRegion] + $premium
    $priceSpread = $bestPrice - $worstPrice
    $marketAdvantage = $revenueByRegion[$bestRegion] - $revenueByRegion[$worstRegion]
    
    return @{
        comparison_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        sample_weight_kg = $SampleWeightKg
        sample_grade = $SampleGrade
        regional_prices = $revenueByRegion
        best_region = $bestRegion
        best_revenue_aud = $revenueByRegion[$bestRegion]
        worst_region = $worstRegion
        worst_revenue_aud = $revenueByRegion[$worstRegion]
        price_spread_aud_per_kg = [math]::Round($priceSpread, 2)
        market_advantage_aud = [math]::Round($marketAdvantage, 2)
    }
}

function Calculate-GradingPerformance {
    param(
        [Parameter(Mandatory=$true)]
        [array]$HerdData
    )
    
    $totalGraded = $HerdData.Count
    
    $fiveStarCount = ($HerdData | Where-Object { $_.msa_grade -eq "5 Star" }).Count
    $fourStarCount = ($HerdData | Where-Object { $_.msa_grade -eq "4 Star" }).Count
    $threeStarCount = ($HerdData | Where-Object { $_.msa_grade -eq "3 Star" }).Count
    
    $fiveStarPct = if ($totalGraded -gt 0) { ($fiveStarCount / $totalGraded) * 100 } else { 0 }
    $fourStarPct = if ($totalGraded -gt 0) { ($fourStarCount / $totalGraded) * 100 } else { 0 }
    $threeStarPct = if ($totalGraded -gt 0) { ($threeStarCount / $totalGraded) * 100 } else { 0 }
    
    $avgWeight = ($HerdData | Measure-Object -Property weight_kg -Average).Average
    $minWeight = ($HerdData | Measure-Object -Property weight_kg -Minimum).Minimum
    $maxWeight = ($HerdData | Measure-Object -Property weight_kg -Maximum).Maximum
    
    $avgMarbling = ($HerdData | Where-Object { $_.marbling_score } | Measure-Object -Property marbling_score -Average).Average
    
    $qualityTrend = if ($fiveStarPct -gt 30) { "improving" } elseif ($fiveStarPct -lt 10) { "declining" } else { "stable" }
    
    $industryAvg = 25.0
    $performance = if ($fiveStarPct -gt $industryAvg) { "above" } elseif ($fiveStarPct -lt ($industryAvg - 5)) { "below" } else { "at" }
    
    return @{
        total_graded = $totalGraded
        five_star_percentage = [math]::Round($fiveStarPct, 2)
        four_star_percentage = [math]::Round($fourStarPct, 2)
        three_star_percentage = [math]::Round($threeStarPct, 2)
        average_weight_kg = [math]::Round($avgWeight, 2)
        min_weight_kg = [math]::Round($minWeight, 2)
        max_weight_kg = [math]::Round($maxWeight, 2)
        average_marbling_score = [math]::Round($avgMarbling, 2)
        quality_trend = $qualityTrend
        industry_average_five_star_pct = $industryAvg
        performance_vs_industry = $performance
    }
}

function Calculate-RevenueForecast {
    param(
        [Parameter(Mandatory=$true)]
        [array]$HerdData,
        
        [Parameter(Mandatory=$true)]
        [int]$ForecastDays,
        
        [Parameter(Mandatory=$true)]
        [string]$Region
    )
    
    $currentValuation = Calculate-HerdValuation -HerdData $HerdData -Region $Region
    $currentValue = $currentValuation.total_herd_value_aud
    $currentWeight = $currentValuation.total_weight_kg
    $currentHead = $currentValuation.total_head
    
    $totalWeightGain = $WeightGainPerDay * $ForecastDays * $currentHead
    $projectedWeight = $currentWeight + $totalWeightGain
    
    # Proportional value increase
    $projectedValue = if ($currentWeight -gt 0) { ($projectedWeight / $currentWeight) * $currentValue } else { 0 }
    
    $revenueIncrease = $projectedValue - $currentValue
    $revenueIncreasePct = if ($currentValue -gt 0) { ($revenueIncrease / $currentValue) * 100 } else { 0 }
    
    $bestCase = $projectedValue * 1.15
    $worstCase = $projectedValue * 0.85
    
    return @{
        forecast_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        forecast_period_days = $ForecastDays
        current_head = $currentHead
        current_weight_kg = [math]::Round($currentWeight, 2)
        current_value_aud = [math]::Round($currentValue, 2)
        weight_gain_per_day_kg = $WeightGainPerDay
        total_weight_gain_kg = [math]::Round($totalWeightGain, 2)
        projected_weight_kg = [math]::Round($projectedWeight, 2)
        projected_value_aud = [math]::Round($projectedValue, 2)
        revenue_increase_aud = [math]::Round($revenueIncrease, 2)
        revenue_increase_pct = [math]::Round($revenueIncreasePct, 2)
        best_case_aud = [math]::Round($bestCase, 2)
        worst_case_aud = [math]::Round($worstCase, 2)
        confidence = "medium"
    }
}

# ============================================================================
# REPORT FORMATTING FUNCTIONS
# ============================================================================

function Format-Header {
    param([string]$Title)
    
    Write-Host "`n" + ("═" * 63) -ForegroundColor Green
    Write-Host "  $Title" -ForegroundColor Green
    Write-Host ("═" * 63) + "`n" -ForegroundColor Green
}

function Format-MSAPremiumReport {
    param($Analysis)
    
    Format-Header "MSA PREMIUM ANALYSIS"
    
    Write-Host "Grading Summary:" -ForegroundColor Yellow
    Write-Host "  Total Animals Graded: $($Analysis.total_animals)" -ForegroundColor White
    Write-Host "  5 Star: $($Analysis.five_star_count) animals" -ForegroundColor Cyan
    Write-Host "  4 Star: $($Analysis.four_star_count) animals" -ForegroundColor Cyan
    Write-Host "  3 Star: $($Analysis.three_star_count) animals`n" -ForegroundColor Cyan
    
    Write-Host "Financial Summary (AUD):" -ForegroundColor Yellow
    Write-Host "  Base Value (no MSA): `$$($Analysis.base_value_aud)" -ForegroundColor White
    Write-Host "  MSA Value (with premiums): `$$($Analysis.msa_value_aud)" -ForegroundColor Green
    Write-Host "  Premium Captured: `$$($Analysis.premium_captured_aud) ($($Analysis.premium_percentage)%)" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "`n  Average Premium per Animal: `$$($Analysis.average_premium_per_animal_aud)`n" -ForegroundColor Cyan
    
    Write-Host "Premium Breakdown:" -ForegroundColor Yellow
    Write-Host "  5 Star Premium: `$$($Analysis.five_star_premium_aud)" -ForegroundColor White
    Write-Host "  4 Star Premium: `$$($Analysis.four_star_premium_aud)`n" -ForegroundColor White
}

function Format-HerdValuationReport {
    param($Valuation)
    
    Format-Header "HERD VALUATION REPORT"
    
    Write-Host "Herd Composition:" -ForegroundColor Yellow
    Write-Host "  Total Head: $($Valuation.total_head)" -ForegroundColor White
    Write-Host "  Total Weight: $($Valuation.total_weight_kg) kg" -ForegroundColor White
    Write-Host "  Region: $($Valuation.region)`n" -ForegroundColor White
    
    Write-Host "Grade Distribution:" -ForegroundColor Yellow
    Write-Host "  5 Star: $($Valuation.five_star_head) head" -ForegroundColor Cyan
    Write-Host "  4 Star: $($Valuation.four_star_head) head" -ForegroundColor Cyan
    Write-Host "  3 Star: $($Valuation.three_star_head) head" -ForegroundColor Cyan
    Write-Host "  Ungraded: $($Valuation.ungraded_head) head`n" -ForegroundColor Cyan
    
    Write-Host "Valuation by Grade (AUD):" -ForegroundColor Yellow
    Write-Host "  5 Star: `$$($Valuation.five_star_value_aud)" -ForegroundColor White
    Write-Host "  4 Star: `$$($Valuation.four_star_value_aud)" -ForegroundColor White
    Write-Host "  3 Star: `$$($Valuation.three_star_value_aud)" -ForegroundColor White
    Write-Host "  Ungraded: `$$($Valuation.ungraded_value_aud)`n" -ForegroundColor White
    
    Write-Host "Total Herd Value: `$$($Valuation.total_herd_value_aud) AUD" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "Average Value per Head: `$$($Valuation.average_value_per_head_aud) AUD" -ForegroundColor Cyan
    Write-Host "Value per Kg: `$$($Valuation.value_per_kg_aud) AUD`n" -ForegroundColor Cyan
}

function Format-RegionalComparisonReport {
    param($Comparison)
    
    Format-Header "REGIONAL PRICE COMPARISON"
    
    Write-Host "Sample Animal: $($Comparison.sample_weight_kg) kg, $($Comparison.sample_grade)`n" -ForegroundColor Cyan
    
    Write-Host "Revenue by Region (AUD):" -ForegroundColor Yellow
    foreach ($region in $Comparison.regional_prices.Keys | Sort-Object) {
        $revenue = $Comparison.regional_prices[$region]
        $marker = if ($region -eq $Comparison.best_region) { " ← BEST" } elseif ($region -eq $Comparison.worst_region) { " ← WORST" } else { "" }
        $color = if ($region -eq $Comparison.best_region) { "Green" } elseif ($region -eq $Comparison.worst_region) { "Red" } else { "White" }
        Write-Host "  $region : `$$revenue$marker" -ForegroundColor $color
    }
    
    Write-Host "`nMarket Opportunity:" -ForegroundColor Yellow
    Write-Host "  Best Market: $($Comparison.best_region) (`$$($Comparison.best_revenue_aud))" -ForegroundColor Green
    Write-Host "  Worst Market: $($Comparison.worst_region) (`$$($Comparison.worst_revenue_aud))" -ForegroundColor Red
    Write-Host "  Market Advantage: `$$($Comparison.market_advantage_aud) per animal`n" -ForegroundColor Cyan
}

function Format-GradingPerformanceReport {
    param($Performance)
    
    Format-Header "GRADING PERFORMANCE METRICS"
    
    Write-Host "Volume:" -ForegroundColor Yellow
    Write-Host "  Total Graded: $($Performance.total_graded) animals`n" -ForegroundColor White
    
    Write-Host "Quality Distribution:" -ForegroundColor Yellow
    Write-Host "  5 Star: $($Performance.five_star_percentage)%" -ForegroundColor Cyan
    Write-Host "  4 Star: $($Performance.four_star_percentage)%" -ForegroundColor Cyan
    Write-Host "  3 Star: $($Performance.three_star_percentage)%`n" -ForegroundColor Cyan
    
    Write-Host "Weight Statistics (kg):" -ForegroundColor Yellow
    Write-Host "  Average: $($Performance.average_weight_kg) kg" -ForegroundColor White
    Write-Host "  Min: $($Performance.min_weight_kg) kg" -ForegroundColor White
    Write-Host "  Max: $($Performance.max_weight_kg) kg`n" -ForegroundColor White
    
    Write-Host "Quality Metrics:" -ForegroundColor Yellow
    Write-Host "  Average Marbling Score: $($Performance.average_marbling_score)" -ForegroundColor White
    Write-Host "  Quality Trend: $($Performance.quality_trend)" -ForegroundColor White
    Write-Host "`n  Industry Benchmark (5-star %): $($Performance.industry_average_five_star_pct)%" -ForegroundColor Gray
    Write-Host "  Your Performance: $($Performance.performance_vs_industry) industry average`n" -ForegroundColor $(if ($Performance.performance_vs_industry -eq "above") { "Green" } elseif ($Performance.performance_vs_industry -eq "below") { "Red" } else { "Yellow" })
}

function Format-RevenueForecastReport {
    param($Forecast)
    
    Format-Header "$($Forecast.forecast_period_days)-DAY REVENUE FORECAST"
    
    Write-Host "Current Snapshot:" -ForegroundColor Yellow
    Write-Host "  Head: $($Forecast.current_head)" -ForegroundColor White
    Write-Host "  Weight: $($Forecast.current_weight_kg) kg" -ForegroundColor White
    Write-Host "  Value: `$$($Forecast.current_value_aud) AUD`n" -ForegroundColor White
    
    Write-Host "Assumptions:" -ForegroundColor Yellow
    Write-Host "  Weight Gain: $($Forecast.weight_gain_per_day_kg) kg/head/day" -ForegroundColor White
    Write-Host "  Forecast Period: $($Forecast.forecast_period_days) days" -ForegroundColor White
    Write-Host "  Total Weight Gain: $($Forecast.total_weight_gain_kg) kg`n" -ForegroundColor White
    
    Write-Host "Projections:" -ForegroundColor Yellow
    Write-Host "  Projected Weight: $($Forecast.projected_weight_kg) kg" -ForegroundColor Cyan
    Write-Host "  Projected Value: `$$($Forecast.projected_value_aud) AUD" -ForegroundColor Green
    Write-Host "  Revenue Increase: `$$($Forecast.revenue_increase_aud) AUD ($($Forecast.revenue_increase_pct)%)" -ForegroundColor Green -BackgroundColor DarkGreen
    
    Write-Host "`nScenarios (AUD):" -ForegroundColor Yellow
    Write-Host "  Best Case (+15%): `$$($Forecast.best_case_aud)" -ForegroundColor Green
    Write-Host "  Expected: `$$($Forecast.projected_value_aud)" -ForegroundColor White
    Write-Host "  Worst Case (-15%): `$$($Forecast.worst_case_aud)`n" -ForegroundColor Red
}

function Format-ExecutiveSummary {
    param(
        $Premium,
        $Valuation,
        $Regional,
        $Performance,
        $Forecast
    )
    
    Format-Header "EXECUTIVE SUMMARY"
    
    Write-Host "Current Herd ($($Valuation.total_head) head):" -ForegroundColor Yellow
    Write-Host "  Total Value: `$$($Valuation.total_herd_value_aud) AUD" -ForegroundColor Green
    Write-Host "  MSA Premium Captured: `$$($Premium.premium_captured_aud) AUD ($($Premium.premium_percentage)%)" -ForegroundColor Green
    Write-Host "  Average Value per Head: `$$($Valuation.average_value_per_head_aud) AUD`n" -ForegroundColor White
    
    Write-Host "Performance:" -ForegroundColor Yellow
    Write-Host "  5-Star Rate: $($Performance.five_star_percentage)% ($($Performance.five_star_percentage / 100 * $Valuation.total_head) head)" -ForegroundColor Cyan
    Write-Host "  4-Star Rate: $($Performance.four_star_percentage)% ($($Performance.four_star_percentage / 100 * $Valuation.total_head) head)" -ForegroundColor Cyan
    Write-Host "  3-Star Rate: $($Performance.three_star_percentage)% ($($Performance.three_star_percentage / 100 * $Valuation.total_head) head)`n" -ForegroundColor Cyan
    
    Write-Host "Key Insights:" -ForegroundColor Yellow
    Write-Host "  ✓ MSA grading adds `$$($Premium.average_premium_per_animal_aud) AUD per animal" -ForegroundColor Green
    Write-Host "  ✓ Best market: $($Regional.best_region) (extra `$$($Regional.market_advantage_aud) AUD per animal)" -ForegroundColor Green
    Write-Host "  ✓ $($Forecast.forecast_period_days)-day projection: `$$($Forecast.projected_value_aud) AUD total value" -ForegroundColor Green
    Write-Host "  ✓ Performance: $($Performance.performance_vs_industry) industry average`n" -ForegroundColor $(if ($Performance.performance_vs_industry -eq "above") { "Green" } else { "Yellow" })
    
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "  1. Target $($Regional.best_region) market for best prices" -ForegroundColor White
    Write-Host "  2. Current 5-star rate: $($Performance.five_star_percentage)% - Target: 30%+" -ForegroundColor White
    Write-Host "  3. Consider selling in $($Forecast.forecast_period_days) days for `$$($Forecast.revenue_increase_aud) AUD additional revenue`n" -ForegroundColor White
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "║         iCattle.ai Financial Reporting System            ║" -ForegroundColor Green
Write-Host "║         Australian MSA Grading Analysis                  ║" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Tenant: $TenantID" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

# Load data
$herdData = Get-SampleHerdData

# Calculate reports
$premiumAnalysis = Calculate-MSAPremiumAnalysis -HerdData $herdData
$herdValuation = Calculate-HerdValuation -HerdData $herdData -Region $Region
$regionalComparison = Calculate-RegionalComparison
$gradingPerformance = Calculate-GradingPerformance -HerdData $herdData
$revenueForecast = Calculate-RevenueForecast -HerdData $herdData -ForecastDays $ForecastDays -Region $Region

# Display reports based on type
switch ($ReportType) {
    'Premium' {
        Format-MSAPremiumReport -Analysis $premiumAnalysis
    }
    'Valuation' {
        Format-HerdValuationReport -Valuation $herdValuation
    }
    'Regional' {
        Format-RegionalComparisonReport -Comparison $regionalComparison
    }
    'Performance' {
        Format-GradingPerformanceReport -Performance $gradingPerformance
    }
    'Forecast' {
        Format-RevenueForecastReport -Forecast $revenueForecast
    }
    'All' {
        Format-MSAPremiumReport -Analysis $premiumAnalysis
        Format-HerdValuationReport -Valuation $herdValuation
        Format-RegionalComparisonReport -Comparison $regionalComparison
        Format-GradingPerformanceReport -Performance $gradingPerformance
        Format-RevenueForecastReport -Forecast $revenueForecast
        Format-ExecutiveSummary -Premium $premiumAnalysis -Valuation $herdValuation -Regional $regionalComparison -Performance $gradingPerformance -Forecast $revenueForecast
    }
}

Write-Host ("═" * 63) -ForegroundColor Green
Write-Host "`n✓ Financial report generation complete!`n" -ForegroundColor Green

# Export to JSON if requested
if ($OutputFormat -eq 'JSON' -and $OutputFile) {
    $report = @{
        metadata = @{
            tenant_id = $TenantID
            region = $Region
            generated_at = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        msa_premium_analysis = $premiumAnalysis
        herd_valuation = $herdValuation
        regional_comparison = $regionalComparison
        grading_performance = $gradingPerformance
        revenue_forecast = $revenueForecast
    }
    
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "Report exported to: $OutputFile`n" -ForegroundColor Cyan
}
