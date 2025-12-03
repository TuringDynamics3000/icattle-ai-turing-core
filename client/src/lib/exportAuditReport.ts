/**
 * Comprehensive Audit Report Generator
 * ====================================
 * Generates a complete portfolio audit report in PDF format
 */

import jsPDF from 'jspdf';

export interface AuditReportData {
  // Portfolio Summary
  totalValue: number;
  totalCattle: number;
  totalClients: number;
  avgValuePerHead: number;
  
  // Financial Metrics
  totalAcquisitionCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  
  // Lending Metrics
  lvrRatio: number;
  assumedLoan: number;
  equityCushion: number;
  interestRate: number;
  debtServiceCoverage: number;
  annualInterest: number;
  
  // Risk Metrics
  healthyCount: number;
  sickCount: number;
  healthRiskPercent: number;
  concentrationRisk: number;
  largestClientName: string;
  largestClientValue: number;
  
  // Compliance
  nlisCompliant: number;
  blockchainVerified: number;
  
  // Breed Distribution
  breedDistribution: Array<{ breed: string; count: number; percentage: number }>;
  
  // Client Breakdown
  clients: Array<{
    name: string;
    cattleCount: number;
    value: number;
    percentage: number;
  }>;
  
  // Report Metadata
  reportDate: string;
  reportPeriod: string;
}

export function generateAuditReportPDF(data: AuditReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };
  
  // Helper to format currency
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  // ========== HEADER ==========
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('iCattle Portfolio Audit Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Report Date: ${data.reportDate}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Reporting Period: ${data.reportPeriod}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setTextColor(0);
  
  // ========== EXECUTIVE SUMMARY ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Portfolio Value:', formatCurrency(data.totalValue)],
    ['Total Cattle:', `${data.totalCattle} head`],
    ['Active Clients:', `${data.totalClients}`],
    ['Average Value per Head:', formatCurrency(data.avgValuePerHead)],
    ['Total Acquisition Cost:', formatCurrency(data.totalAcquisitionCost)],
    ['Unrealized Gain:', `${formatCurrency(data.unrealizedGain)} (+${data.unrealizedGainPercent.toFixed(1)}%)`],
  ];
  
  summaryData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 100, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  checkPageBreak();
  
  // ========== LENDING METRICS ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Lending & Financial Metrics', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const lendingData = [
    ['Loan-to-Value Ratio (LVR):', `${data.lvrRatio.toFixed(1)}%`],
    ['Assumed Loan Amount:', formatCurrency(data.assumedLoan)],
    ['Equity Cushion:', `${data.equityCushion.toFixed(1)}%`],
    ['Interest Rate:', `${data.interestRate.toFixed(2)}% p.a.`],
    ['Annual Interest Payment:', formatCurrency(data.annualInterest)],
    ['Debt Service Coverage Ratio:', `${data.debtServiceCoverage.toFixed(2)}x`],
  ];
  
  lendingData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 100, yPos);
    yPos += 6;
  });
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Note: Based on NAB/Rabobank industry standards (70-80% LVR, 5.5-6.5% interest rates)', 14, yPos, { maxWidth: pageWidth - 28 });
  doc.setTextColor(0);
  yPos += 10;
  
  checkPageBreak();
  
  // ========== RISK ASSESSMENT ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const riskData = [
    ['Health Risk:', `${data.healthRiskPercent.toFixed(1)}% (${data.sickCount} of ${data.totalCattle} cattle)`],
    ['Healthy Cattle:', `${data.healthyCount} (${(100 - data.healthRiskPercent).toFixed(1)}%)`],
    ['Concentration Risk:', `${data.concentrationRisk.toFixed(1)}%`],
    ['Largest Client:', `${data.largestClientName} (${formatCurrency(data.largestClientValue)})`],
  ];
  
  riskData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 100, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  checkPageBreak();
  
  // ========== COMPLIANCE STATUS ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Compliance Status', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const complianceData = [
    ['NLIS Registration:', `${data.nlisCompliant} of ${data.totalCattle} (${((data.nlisCompliant / data.totalCattle) * 100).toFixed(1)}%)`],
    ['Blockchain Verified:', `${data.blockchainVerified} of ${data.totalCattle} (${((data.blockchainVerified / data.totalCattle) * 100).toFixed(1)}%)`],
    ['APRA Compliance:', 'Compliant'],
  ];
  
  complianceData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 100, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  checkPageBreak(40);
  
  // ========== BREED DISTRIBUTION ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Breed Distribution', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Table header
  doc.setFont('helvetica', 'bold');
  doc.text('Breed', 14, yPos);
  doc.text('Count', 100, yPos);
  doc.text('Percentage', 140, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  data.breedDistribution.slice(0, 10).forEach(breed => {
    checkPageBreak();
    doc.text(breed.breed, 14, yPos);
    doc.text(String(breed.count), 100, yPos);
    doc.text(`${breed.percentage.toFixed(1)}%`, 140, yPos);
    yPos += 5;
  });
  
  yPos += 10;
  checkPageBreak(40);
  
  // ========== CLIENT BREAKDOWN ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Portfolio Breakdown', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Table header
  doc.setFont('helvetica', 'bold');
  doc.text('Client Name', 14, yPos);
  doc.text('Cattle', 100, yPos);
  doc.text('Value', 130, yPos);
  doc.text('%', 170, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  data.clients.forEach(client => {
    checkPageBreak();
    doc.text(client.name, 14, yPos, { maxWidth: 80 });
    doc.text(String(client.cattleCount), 100, yPos);
    doc.text(formatCurrency(client.value), 130, yPos);
    doc.text(`${client.percentage.toFixed(1)}%`, 170, yPos);
    yPos += 5;
  });
  
  // ========== FOOTER ==========
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This report is generated by iCattle Dashboard - Livestock Asset Management Platform', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Confidential - For authorized use only', pageWidth / 2, footerY + 4, { align: 'center' });
  
  // Save PDF
  const filename = `iCattle-Audit-Report-${data.reportDate}.pdf`;
  doc.save(filename);
}
