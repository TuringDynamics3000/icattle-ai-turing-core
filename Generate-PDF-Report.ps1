# iCattle.ai PDF Financial Report Generator
# Generates professional PDF reports from financial data
#
# Usage: .\Generate-PDF-Report.ps1 -OutputPath "C:\Reports\financial_report.pdf"

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "C:\icattle\grading_system\Financial_Report_$(Get-Date -Format 'yyyyMMdd_HHmmss').pdf",
    
    [Parameter(Mandatory=$false)]
    [string]$TenantID = 'AU-QPIC12345',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'QLD'
)

Write-Host "`n===============================================================" -ForegroundColor Green
Write-Host "  iCattle.ai PDF Report Generator" -ForegroundColor Green
Write-Host "===============================================================`n" -ForegroundColor Green

# Sample herd data
$herd = @(
    @{ id = "982000123456701"; grade = "5 Star"; weight = 520; marbling = 9 },
    @{ id = "982000123456702"; grade = "5 Star"; weight = 510; marbling = 8 },
    @{ id = "982000123456703"; grade = "4 Star"; weight = 480; marbling = 7 },
    @{ id = "982000123456704"; grade = "4 Star"; weight = 470; marbling = 6 },
    @{ id = "982000123456705"; grade = "4 Star"; weight = 465; marbling = 7 },
    @{ id = "982000123456706"; grade = "3 Star"; weight = 450; marbling = 5 },
    @{ id = "982000123456707"; grade = "3 Star"; weight = 445; marbling = 4 },
    @{ id = "982000123456708"; grade = "5 Star"; weight = 530; marbling = 9 },
    @{ id = "982000123456709"; grade = "4 Star"; weight = 475; marbling = 6 },
    @{ id = "982000123456710"; grade = "4 Star"; weight = 460; marbling = 7 }
)

# Calculate financial metrics
$premiums = @{
    "5 Star" = 0.80
    "4 Star" = 0.40
    "3 Star" = 0.00
}
$basePrice = 6.50

$totalWeight = ($herd | Measure-Object -Property weight -Sum).Sum
$baseValue = $totalWeight * $basePrice

$msaValue = 0
foreach ($animal in $herd) {
    $price = $basePrice + $premiums[$animal.grade]
    $msaValue += $animal.weight * $price
}

$premium = $msaValue - $baseValue
$premiumPct = ($premium / $baseValue) * 100

$fiveStar = ($herd | Where-Object { $_.grade -eq "5 Star" }).Count
$fourStar = ($herd | Where-Object { $_.grade -eq "4 Star" }).Count
$threeStar = ($herd | Where-Object { $_.grade -eq "3 Star" }).Count

$avgWeight = ($herd | Measure-Object -Property weight -Average).Average

# Regional comparison
$regionalPrices = @{
    "QLD" = 6.50
    "NSW" = 6.45
    "VIC" = 6.40
    "SA" = 6.35
    "WA" = 6.30
}

# 30-day forecast
$forecastDays = 30
$weightGainPerDay = 1.2
$totalWeightGain = $weightGainPerDay * $forecastDays * $herd.Count
$projectedWeight = $totalWeight + $totalWeightGain
$projectedValue = ($projectedWeight / $totalWeight) * $msaValue
$revenueIncrease = $projectedValue - $msaValue

# Generate HTML report
$html = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>iCattle.ai Financial Report - $TenantID</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1e7e34 0%, #28a745 100%);
            color: white;
            padding: 30px;
            margin: -20px -20px 30px -20px;
            border-radius: 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-top: 5px;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #28a745;
            margin-bottom: 30px;
        }
        .metadata table {
            width: 100%;
            border-collapse: collapse;
        }
        .metadata td {
            padding: 5px 10px;
            font-size: 14px;
        }
        .metadata td:first-child {
            font-weight: 600;
            width: 150px;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section-title {
            background: #28a745;
            color: white;
            padding: 12px 20px;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
        }
        .metric-card.highlight {
            background: #d4edda;
            border-color: #28a745;
        }
        .metric-label {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #1e7e34;
        }
        .metric-value.large {
            font-size: 36px;
        }
        .metric-subtext {
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table.data-table th {
            background: #28a745;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        table.data-table td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }
        table.data-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .chart-placeholder {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            padding: 40px;
            text-align: center;
            color: #6c757d;
            border-radius: 8px;
            margin: 20px 0;
        }
        .insight-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px 20px;
            margin: 20px 0;
        }
        .insight-box h4 {
            margin: 0 0 10px 0;
            color: #856404;
        }
        .insight-box ul {
            margin: 0;
            padding-left: 20px;
        }
        .insight-box li {
            margin: 5px 0;
            color: #856404;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐄 iCattle.ai Financial Report</h1>
        <div class="subtitle">Australian MSA Grading System - Comprehensive Financial Analysis</div>
    </div>

    <div class="metadata">
        <table>
            <tr>
                <td>Tenant ID:</td>
                <td>$TenantID</td>
                <td>Region:</td>
                <td>$Region</td>
            </tr>
            <tr>
                <td>Report Generated:</td>
                <td>$(Get-Date -Format 'dd MMMM yyyy HH:mm:ss')</td>
                <td>Report Period:</td>
                <td>Current Snapshot</td>
            </tr>
        </table>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <div class="section-title">📊 Executive Summary</div>
        
        <div class="metric-grid">
            <div class="metric-card highlight">
                <div class="metric-label">Total Herd Value</div>
                <div class="metric-value large">`$$([math]::Round($msaValue, 2))</div>
                <div class="metric-subtext">AUD - With MSA Premiums</div>
            </div>
            <div class="metric-card highlight">
                <div class="metric-label">MSA Premium Captured</div>
                <div class="metric-value large">`$$([math]::Round($premium, 2))</div>
                <div class="metric-subtext">$([math]::Round($premiumPct, 2))% increase over base value</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Head</div>
                <div class="metric-value">$($herd.Count)</div>
                <div class="metric-subtext">Animals graded</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Value per Head</div>
                <div class="metric-value">`$$([math]::Round($msaValue / $herd.Count, 2))</div>
                <div class="metric-subtext">AUD per animal</div>
            </div>
        </div>
    </div>

    <!-- MSA Premium Analysis -->
    <div class="section">
        <div class="section-title">💰 MSA Premium Analysis</div>
        
        <table class="data-table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Base Value (no MSA grading)</td>
                <td>`$$([math]::Round($baseValue, 2)) AUD</td>
            </tr>
            <tr>
                <td>MSA Value (with premiums)</td>
                <td><strong>`$$([math]::Round($msaValue, 2)) AUD</strong></td>
            </tr>
            <tr style="background: #d4edda;">
                <td><strong>Premium Captured</strong></td>
                <td><strong>`$$([math]::Round($premium, 2)) AUD ($([math]::Round($premiumPct, 2))%)</strong></td>
            </tr>
            <tr>
                <td>Average Premium per Animal</td>
                <td>`$$([math]::Round($premium / $herd.Count, 2)) AUD</td>
            </tr>
        </table>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">5 Star Premium</div>
                <div class="metric-value">`$$premiums["5 Star"]/kg</div>
                <div class="metric-subtext">$fiveStar animals ($([math]::Round($fiveStar/$herd.Count*100, 1))%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">4 Star Premium</div>
                <div class="metric-value">`$$premiums["4 Star"]/kg</div>
                <div class="metric-subtext">$fourStar animals ($([math]::Round($fourStar/$herd.Count*100, 1))%)</div>
            </div>
        </div>
    </div>

    <!-- Herd Composition -->
    <div class="section">
        <div class="section-title">🐮 Herd Composition & Grading Performance</div>
        
        <table class="data-table">
            <tr>
                <th>MSA Grade</th>
                <th>Head Count</th>
                <th>Percentage</th>
                <th>Avg Weight (kg)</th>
                <th>Total Value (AUD)</th>
            </tr>
            <tr>
                <td>⭐⭐⭐⭐⭐ 5 Star</td>
                <td>$fiveStar</td>
                <td>$([math]::Round($fiveStar/$herd.Count*100, 1))%</td>
                <td>$([math]::Round(($herd | Where-Object { $_.grade -eq "5 Star" } | Measure-Object -Property weight -Average).Average, 1))</td>
                <td>`$$([math]::Round(($herd | Where-Object { $_.grade -eq "5 Star" } | ForEach-Object { $_.weight * ($basePrice + $premiums["5 Star"]) } | Measure-Object -Sum).Sum, 2))</td>
            </tr>
            <tr>
                <td>⭐⭐⭐⭐ 4 Star</td>
                <td>$fourStar</td>
                <td>$([math]::Round($fourStar/$herd.Count*100, 1))%</td>
                <td>$([math]::Round(($herd | Where-Object { $_.grade -eq "4 Star" } | Measure-Object -Property weight -Average).Average, 1))</td>
                <td>`$$([math]::Round(($herd | Where-Object { $_.grade -eq "4 Star" } | ForEach-Object { $_.weight * ($basePrice + $premiums["4 Star"]) } | Measure-Object -Sum).Sum, 2))</td>
            </tr>
            <tr>
                <td>⭐⭐⭐ 3 Star</td>
                <td>$threeStar</td>
                <td>$([math]::Round($threeStar/$herd.Count*100, 1))%</td>
                <td>$([math]::Round(($herd | Where-Object { $_.grade -eq "3 Star" } | Measure-Object -Property weight -Average).Average, 1))</td>
                <td>`$$([math]::Round(($herd | Where-Object { $_.grade -eq "3 Star" } | ForEach-Object { $_.weight * ($basePrice + $premiums["3 Star"]) } | Measure-Object -Sum).Sum, 2))</td>
            </tr>
            <tr style="background: #d4edda;">
                <td><strong>TOTAL</strong></td>
                <td><strong>$($herd.Count)</strong></td>
                <td><strong>100%</strong></td>
                <td><strong>$([math]::Round($avgWeight, 1))</strong></td>
                <td><strong>`$$([math]::Round($msaValue, 2))</strong></td>
            </tr>
        </table>
    </div>

    <div class="page-break"></div>

    <!-- Regional Comparison -->
    <div class="section">
        <div class="section-title">🗺️ Regional Price Comparison</div>
        
        <p>Sample animal: 450 kg, 4 Star MSA grade</p>
        
        <table class="data-table">
            <tr>
                <th>Region</th>
                <th>Base Price (AUD/kg)</th>
                <th>MSA Price (AUD/kg)</th>
                <th>Revenue (450kg)</th>
            </tr>
"@

foreach ($region in $regionalPrices.Keys | Sort-Object) {
    $regionBase = $regionalPrices[$region]
    $regionMSA = $regionBase + $premiums["4 Star"]
    $revenue = 450 * $regionMSA
    $html += @"
            <tr>
                <td>$region</td>
                <td>`$$regionBase</td>
                <td>`$$regionMSA</td>
                <td>`$$([math]::Round($revenue, 2))</td>
            </tr>
"@
}

$html += @"
        </table>
    </div>

    <!-- Revenue Forecast -->
    <div class="section">
        <div class="section-title">📈 30-Day Revenue Forecast</div>
        
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Current Value</div>
                <div class="metric-value">`$$([math]::Round($msaValue, 2))</div>
                <div class="metric-subtext">Current herd value</div>
            </div>
            <div class="metric-card highlight">
                <div class="metric-label">Projected Value</div>
                <div class="metric-value">`$$([math]::Round($projectedValue, 2))</div>
                <div class="metric-subtext">After 30 days</div>
            </div>
        </div>

        <table class="data-table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Current Total Weight</td>
                <td>$totalWeight kg</td>
            </tr>
            <tr>
                <td>Weight Gain per Day</td>
                <td>$weightGainPerDay kg/head/day</td>
            </tr>
            <tr>
                <td>Total Weight Gain (30 days)</td>
                <td>$([math]::Round($totalWeightGain, 2)) kg</td>
            </tr>
            <tr>
                <td>Projected Total Weight</td>
                <td>$([math]::Round($projectedWeight, 2)) kg</td>
            </tr>
            <tr style="background: #d4edda;">
                <td><strong>Revenue Increase</strong></td>
                <td><strong>`$$([math]::Round($revenueIncrease, 2)) AUD ($([math]::Round(($revenueIncrease/$msaValue)*100, 2))%)</strong></td>
            </tr>
        </table>
    </div>

    <!-- Key Insights -->
    <div class="section">
        <div class="section-title">💡 Key Insights & Recommendations</div>
        
        <div class="insight-box">
            <h4>✓ Strengths</h4>
            <ul>
                <li>MSA grading adds `$$([math]::Round($premium / $herd.Count, 2)) AUD per animal on average</li>
                <li>5-star rate of $([math]::Round($fiveStar/$herd.Count*100, 1))% $(if ($fiveStar/$herd.Count -gt 0.25) { "is above industry average (25%)" } else { "has room for improvement (target: 30%)" })</li>
                <li>30-day weight gain could add `$$([math]::Round($revenueIncrease, 2)) AUD to herd value</li>
            </ul>
        </div>

        <div class="insight-box">
            <h4>📋 Recommendations</h4>
            <ul>
                <li>Target QLD market for best regional prices</li>
                <li>$(if ($fiveStar/$herd.Count -lt 0.30) { "Improve feeding program to increase 5-star rate to 30%+" } else { "Maintain current feeding program to sustain high 5-star rate" })</li>
                <li>Consider selling in 30 days to capture weight gain revenue of `$$([math]::Round($revenueIncrease, 2)) AUD</li>
                <li>Continue MSA grading to capture `$$([math]::Round($premium, 2)) AUD premium per batch</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>iCattle.ai - Australian MSA Grading System</strong></p>
        <p>This report was generated automatically using the iCattle.ai platform with Turing Protocol enforcement.</p>
        <p>Report ID: $(New-Guid) | Generated: $(Get-Date -Format 'dd MMMM yyyy HH:mm:ss') | Tenant: $TenantID</p>
    </div>
</body>
</html>
"@

# Save HTML temporarily
$htmlPath = [System.IO.Path]::GetTempFileName() + ".html"
$html | Out-File -FilePath $htmlPath -Encoding UTF8

Write-Host "Generated HTML report: $htmlPath" -ForegroundColor Cyan

# Try to convert to PDF using different methods
$pdfGenerated = $false

# Method 1: Try using Chrome/Edge (if installed)
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

foreach ($chromePath in $chromePaths) {
    if (Test-Path $chromePath) {
        Write-Host "Using $chromePath to generate PDF..." -ForegroundColor Yellow
        
        try {
            $arguments = "--headless --disable-gpu --print-to-pdf=`"$OutputPath`" `"$htmlPath`""
            Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow
            
            if (Test-Path $OutputPath) {
                $pdfGenerated = $true
                Write-Host "✓ PDF generated successfully!" -ForegroundColor Green
                Write-Host "Location: $OutputPath" -ForegroundColor Cyan
                break
            }
        } catch {
            Write-Host "Failed with $chromePath, trying next method..." -ForegroundColor Yellow
        }
    }
}

if (-not $pdfGenerated) {
    Write-Host "`n⚠ PDF generation requires Chrome or Edge browser" -ForegroundColor Yellow
    Write-Host "`nHTML report saved at: $htmlPath" -ForegroundColor Cyan
    Write-Host "You can:" -ForegroundColor Yellow
    Write-Host "  1. Open the HTML file in a browser and print to PDF" -ForegroundColor White
    Write-Host "  2. Install Chrome/Edge and run this script again" -ForegroundColor White
    Write-Host "`nOpening HTML report in default browser..." -ForegroundColor Yellow
    Start-Process $htmlPath
} else {
    # Clean up HTML file
    Remove-Item $htmlPath -ErrorAction SilentlyContinue
    
    Write-Host "`n===============================================================" -ForegroundColor Green
    Write-Host "✓ PDF Report Generation Complete!" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host "`nPDF saved to: $OutputPath" -ForegroundColor Cyan
    Write-Host "File size: $([math]::Round((Get-Item $OutputPath).Length / 1KB, 2)) KB`n" -ForegroundColor Gray
    
    # Ask to open
    Write-Host "Opening PDF..." -ForegroundColor Yellow
    Start-Process $OutputPath
}
