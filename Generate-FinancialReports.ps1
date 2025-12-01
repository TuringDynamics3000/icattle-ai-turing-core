# Generate Sample Financial Reports
# iCattle.ai Australian Livestock Management

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "║         iCattle.ai Financial Reports Generator           ║" -ForegroundColor Green
Write-Host "║         Australian MSA Grading System                    ║" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Sample herd data for demonstration
$sampleHerd = @(
    @{ animal_id = "982000123456701"; msa_grade = "5 Star"; weight_kg = 520; marbling_score = 9 },
    @{ animal_id = "982000123456702"; msa_grade = "5 Star"; weight_kg = 510; marbling_score = 8 },
    @{ animal_id = "982000123456703"; msa_grade = "4 Star"; weight_kg = 480; marbling_score = 7 },
    @{ animal_id = "982000123456704"; msa_grade = "4 Star"; weight_kg = 470; marbling_score = 6 },
    @{ animal_id = "982000123456705"; msa_grade = "4 Star"; weight_kg = 465; marbling_score = 7 },
    @{ animal_id = "982000123456706"; msa_grade = "3 Star"; weight_kg = 450; marbling_score = 5 },
    @{ animal_id = "982000123456707"; msa_grade = "3 Star"; weight_kg = 445; marbling_score = 4 },
    @{ animal_id = "982000123456708"; msa_grade = "5 Star"; weight_kg = 530; marbling_score = 9 },
    @{ animal_id = "982000123456709"; msa_grade = "4 Star"; weight_kg = 475; marbling_score = 6 },
    @{ animal_id = "982000123456710"; msa_grade = "4 Star"; weight_kg = 460; marbling_score = 7 }
)

Write-Host "Sample Herd: 10 head" -ForegroundColor Cyan
Write-Host "  - 5 Star: 3 head" -ForegroundColor Yellow
Write-Host "  - 4 Star: 5 head" -ForegroundColor Yellow
Write-Host "  - 3 Star: 2 head`n" -ForegroundColor Yellow

# Calculate financial metrics
$totalWeight = ($sampleHerd | Measure-Object -Property weight_kg -Sum).Sum
$avgWeight = ($sampleHerd | Measure-Object -Property weight_kg -Average).Average

$basePricePerKg = 6.50
$premiums = @{
    "5 Star" = 0.80
    "4 Star" = 0.40
    "3 Star" = 0.00
}

# Calculate base value (no MSA premium)
$baseValue = $totalWeight * $basePricePerKg

# Calculate MSA value (with premiums)
$msaValue = 0
foreach ($animal in $sampleHerd) {
    $premium = $premiums[$animal.msa_grade]
    $pricePerKg = $basePricePerKg + $premium
    $msaValue += $animal.weight_kg * $pricePerKg
}

$premiumCaptured = $msaValue - $baseValue
$premiumPercentage = ($premiumCaptured / $baseValue) * 100

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  MSA PREMIUM ANALYSIS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "Total Herd Weight: $totalWeight kg" -ForegroundColor White
Write-Host "Average Weight: $([math]::Round($avgWeight, 2)) kg`n" -ForegroundColor White

Write-Host "Base Value (no MSA):" -ForegroundColor Yellow
Write-Host "  $totalWeight kg × `$$basePricePerKg/kg = `$$([math]::Round($baseValue, 2)) AUD`n" -ForegroundColor White

Write-Host "MSA Value (with premiums):" -ForegroundColor Yellow
foreach ($grade in @("5 Star", "4 Star", "3 Star")) {
    $gradeAnimals = $sampleHerd | Where-Object { $_.msa_grade -eq $grade }
    if ($gradeAnimals) {
        $gradeWeight = ($gradeAnimals | Measure-Object -Property weight_kg -Sum).Sum
        $gradePremium = $premiums[$grade]
        $gradePrice = $basePricePerKg + $gradePremium
        $gradeValue = $gradeWeight * $gradePrice
        Write-Host "  $grade ($($gradeAnimals.Count) head, $gradeWeight kg):" -ForegroundColor Cyan
        Write-Host "    `$$gradePrice/kg × $gradeWeight kg = `$$([math]::Round($gradeValue, 2)) AUD" -ForegroundColor White
    }
}

Write-Host "`nTotal MSA Value: `$$([math]::Round($msaValue, 2)) AUD" -ForegroundColor Green

Write-Host "`n" + "─" * 60 -ForegroundColor Gray
Write-Host "PREMIUM CAPTURED: `$$([math]::Round($premiumCaptured, 2)) AUD" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host "Premium Percentage: $([math]::Round($premiumPercentage, 2))% increase" -ForegroundColor Green
Write-Host "Average Premium per Head: `$$([math]::Round($premiumCaptured / 10, 2)) AUD" -ForegroundColor Green
Write-Host "─" * 60 + "`n" -ForegroundColor Gray

# Regional Comparison
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  REGIONAL PRICE COMPARISON" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

$regionalPrices = @{
    "QLD" = 6.50
    "NSW" = 6.45
    "VIC" = 6.40
    "SA" = 6.35
    "WA" = 6.30
}

$sampleAnimal = @{ weight_kg = 450; msa_grade = "4 Star" }
$samplePremium = $premiums[$sampleAnimal.msa_grade]

Write-Host "Sample Animal: $($sampleAnimal.weight_kg) kg, $($sampleAnimal.msa_grade)`n" -ForegroundColor Cyan

$regionalRevenue = @{}
foreach ($region in $regionalPrices.Keys | Sort-Object) {
    $basePrice = $regionalPrices[$region]
    $totalPrice = $basePrice + $samplePremium
    $revenue = $sampleAnimal.weight_kg * $totalPrice
    $regionalRevenue[$region] = $revenue
    
    Write-Host "$region : `$$totalPrice/kg × $($sampleAnimal.weight_kg) kg = `$$([math]::Round($revenue, 2)) AUD" -ForegroundColor White
}

$bestRegion = ($regionalRevenue.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
$worstRegion = ($regionalRevenue.GetEnumerator() | Sort-Object Value | Select-Object -First 1).Key
$advantage = $regionalRevenue[$bestRegion] - $regionalRevenue[$worstRegion]

Write-Host "`nBest Market: $bestRegion (`$$([math]::Round($regionalRevenue[$bestRegion], 2)) AUD)" -ForegroundColor Green
Write-Host "Worst Market: $worstRegion (`$$([math]::Round($regionalRevenue[$worstRegion], 2)) AUD)" -ForegroundColor Red
Write-Host "Market Advantage: `$$([math]::Round($advantage, 2)) AUD per animal`n" -ForegroundColor Yellow

# Revenue Forecast
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  30-DAY REVENUE FORECAST" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

$currentValue = $msaValue
$weightGainPerDay = 1.2  # kg per animal per day
$forecastDays = 30
$totalWeightGain = $weightGainPerDay * $forecastDays * 10  # 10 head

$projectedWeight = $totalWeight + $totalWeightGain
$projectedValue = ($projectedWeight / $totalWeight) * $msaValue  # Proportional increase

$revenueIncrease = $projectedValue - $currentValue
$revenueIncreasePct = ($revenueIncrease / $currentValue) * 100

Write-Host "Current Herd Value: `$$([math]::Round($currentValue, 2)) AUD" -ForegroundColor White
Write-Host "Current Total Weight: $totalWeight kg`n" -ForegroundColor White

Write-Host "Assumptions:" -ForegroundColor Yellow
Write-Host "  - Weight gain: $weightGainPerDay kg/head/day" -ForegroundColor White
Write-Host "  - Forecast period: $forecastDays days" -ForegroundColor White
Write-Host "  - Total weight gain: $totalWeightGain kg`n" -ForegroundColor White

Write-Host "Projected Weight: $([math]::Round($projectedWeight, 2)) kg" -ForegroundColor Cyan
Write-Host "Projected Value: `$$([math]::Round($projectedValue, 2)) AUD`n" -ForegroundColor Cyan

Write-Host "Revenue Increase: `$$([math]::Round($revenueIncrease, 2)) AUD ($([math]::Round($revenueIncreasePct, 2))%)" -ForegroundColor Green

# Best/Worst Case Scenarios
$bestCase = $projectedValue * 1.15
$worstCase = $projectedValue * 0.85

Write-Host "`nScenarios:" -ForegroundColor Yellow
Write-Host "  Best Case (+15%): `$$([math]::Round($bestCase, 2)) AUD" -ForegroundColor Green
Write-Host "  Expected: `$$([math]::Round($projectedValue, 2)) AUD" -ForegroundColor White
Write-Host "  Worst Case (-15%): `$$([math]::Round($worstCase, 2)) AUD`n" -ForegroundColor Red

# Executive Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  EXECUTIVE SUMMARY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "Current Herd (10 head):" -ForegroundColor Yellow
Write-Host "  Total Value: `$$([math]::Round($msaValue, 2)) AUD" -ForegroundColor White
Write-Host "  MSA Premium Captured: `$$([math]::Round($premiumCaptured, 2)) AUD ($([math]::Round($premiumPercentage, 2))%)" -ForegroundColor Green
Write-Host "  Average Value per Head: `$$([math]::Round($msaValue / 10, 2)) AUD`n" -ForegroundColor White

Write-Host "Performance:" -ForegroundColor Yellow
Write-Host "  5-Star Rate: 30% (3/10 head)" -ForegroundColor Green
Write-Host "  4-Star Rate: 50% (5/10 head)" -ForegroundColor Cyan
Write-Host "  3-Star Rate: 20% (2/10 head)`n" -ForegroundColor White

Write-Host "Key Insights:" -ForegroundColor Yellow
Write-Host "  ✓ MSA grading adds `$$([math]::Round($premiumCaptured / 10, 2)) AUD per animal" -ForegroundColor Green
Write-Host "  ✓ Best market: $bestRegion (extra `$$([math]::Round($advantage, 2)) AUD per animal)" -ForegroundColor Green
Write-Host "  ✓ 30-day projection: `$$([math]::Round($projectedValue, 2)) AUD total value`n" -ForegroundColor Green

Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "  1. Target $bestRegion market for best prices" -ForegroundColor White
Write-Host "  2. Maintain current feeding program (30% 5-star rate)" -ForegroundColor White
Write-Host "  3. Consider selling in 30 days for maximum weight gain`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "Report generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Tenant: AU-QPIC12345" -ForegroundColor Gray
Write-Host "`n✓ Financial report generation complete!`n" -ForegroundColor Green
