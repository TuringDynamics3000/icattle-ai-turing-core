import jsPDF from 'jspdf';

interface BankReportData {
  portfolioValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  ltvRatio: number;
  assumedLoan: number;
  healthyCount: number;
  totalCount: number;
  healthRiskPercent: number;
  concentrationRiskPercent: number;
  topClientName: string;
  topClientCount: number;
  nlisCompliance: number;
  blockchainCompliance: number;
  apraCompliant: boolean;
  riskRating: string;
  generatedDate: string;
}

export function exportBankReportToPDF(data: BankReportData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('iCattle Portfolio Risk Assessment', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${data.generatedDate}`, 20, 28);
  
  // Risk Rating Badge
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const riskColor = data.riskRating === 'Low Risk' ? [34, 197, 94] : 
                    data.riskRating === 'Medium Risk' ? [234, 179, 8] : 
                    [239, 68, 68];
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`Risk Rating: ${data.riskRating}`, 150, 20);
  doc.setTextColor(0, 0, 0);
  
  // Divider
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
  
  // Portfolio Summary Section
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Summary', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  doc.text(`Portfolio Value:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.portfolioValue), 80, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Unrealized Gain:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`${formatCurrency(data.unrealizedGain)} (+${data.unrealizedGainPercent.toFixed(1)}%)`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Loan-to-Value Ratio:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.ltvRatio.toFixed(1)}%`, 80, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Assumed Loan Amount:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.assumedLoan), 80, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Collateral Quality:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.healthyCount}/${data.totalCount} (${((data.healthyCount/data.totalCount)*100).toFixed(1)}% healthy)`, 80, yPos);
  
  // Risk Assessment Section
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Health Risk:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  const healthColor = data.healthRiskPercent < 15 ? [34, 197, 94] : 
                      data.healthRiskPercent < 30 ? [234, 179, 8] : 
                      [239, 68, 68];
  doc.setTextColor(healthColor[0], healthColor[1], healthColor[2]);
  doc.text(`${data.healthRiskPercent.toFixed(1)}%`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${data.totalCount - data.healthyCount} of ${data.totalCount} cattle require attention)`, 95, yPos);
  
  yPos += 7;
  doc.text(`Concentration Risk:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  const concColor = data.concentrationRiskPercent < 25 ? [34, 197, 94] : 
                    data.concentrationRiskPercent < 40 ? [234, 179, 8] : 
                    [239, 68, 68];
  doc.setTextColor(concColor[0], concColor[1], concColor[2]);
  doc.text(`${data.concentrationRiskPercent.toFixed(1)}%`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`(Top client: ${data.topClientName}, ${data.topClientCount} head)`, 95, yPos);
  
  yPos += 7;
  doc.text(`LTV Coverage:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`${data.ltvRatio.toFixed(1)}%`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${(100 - data.ltvRatio).toFixed(1)}% equity cushion)`, 95, yPos);
  
  // Compliance Section
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Compliance & Verification Status', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`NLIS Registration:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`${data.nlisCompliance.toFixed(1)}%`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${Math.round(data.totalCount * data.nlisCompliance / 100)} of ${data.totalCount} cattle registered)`, 95, yPos);
  
  yPos += 7;
  doc.text(`Blockchain Verified:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`${data.blockchainCompliance.toFixed(1)}%`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${Math.round(data.totalCount * data.blockchainCompliance / 100)} of ${data.totalCount} with biometric ID)`, 95, yPos);
  
  yPos += 7;
  doc.text(`APRA Compliant:`, 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(data.apraCompliant ? '100%' : 'No', 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  if (data.apraCompliant) {
    doc.text('(Basel III livestock lending standards)', 95, yPos);
  }
  
  // Risk Rating Explanation
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Rating Methodology', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Risk rating is calculated based on multiple factors:', 20, yPos);
  
  yPos += 6;
  doc.text('• Health Risk: Percentage of cattle requiring veterinary attention', 25, yPos);
  yPos += 5;
  doc.text('• Concentration Risk: Portfolio exposure to largest single client', 25, yPos);
  yPos += 5;
  doc.text('• LTV Coverage: Loan-to-value ratio and equity cushion', 25, yPos);
  yPos += 5;
  doc.text('• Compliance: NLIS registration and blockchain verification rates', 25, yPos);
  
  yPos += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Low Risk: < 15% health risk, < 25% concentration, > 95% compliance', 25, yPos);
  yPos += 4;
  doc.text('Medium Risk: 15-30% health risk, 25-40% concentration, > 90% compliance', 25, yPos);
  yPos += 4;
  doc.text('High Risk: > 30% health risk, > 40% concentration, < 90% compliance', 25, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('This report is generated by iCattle Dashboard for informational purposes only.', 20, 280);
  doc.text('Please consult with financial advisors before making lending decisions.', 20, 285);
  
  // Save PDF
  doc.save(`iCattle-Risk-Assessment-${new Date().toISOString().split('T')[0]}.pdf`);
}
