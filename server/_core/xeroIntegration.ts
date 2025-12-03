/**
 * Xero Integration for Livestock Asset Management
 * Implements AASB 141 Agriculture compliance for biological assets
 */

import { XeroClient } from 'xero-node';

// Xero OAuth configuration
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || '';
const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/xero/callback';

// AASB 141 compliant account codes for livestock
const XERO_ACCOUNT_CODES = {
  BIOLOGICAL_ASSETS: '1-1500', // Non-current assets - Biological Assets
  FAIR_VALUE_GAIN: '4-1000', // Other Income - Fair Value Gain on Biological Assets
  FAIR_VALUE_LOSS: '6-1000', // Other Expenses - Fair Value Loss on Biological Assets
  GAIN_ON_SALE: '4-1100', // Other Income - Gain on Sale of Biological Assets
  LOSS_ON_SALE: '6-1100', // Other Expenses - Loss on Sale of Biological Assets
};

/**
 * Initialize Xero client
 */
export function createXeroClient() {
  return new XeroClient({
    clientId: XERO_CLIENT_ID,
    clientSecret: XERO_CLIENT_SECRET,
    redirectUris: [XERO_REDIRECT_URI],
    scopes: 'openid profile email accounting.transactions accounting.settings accounting.contacts accounting.attachments offline_access'.split(' '),
  });
}

/**
 * Generate authorization URL for OAuth flow
 */
export async function getXeroAuthorizationUrl(): Promise<string> {
  const xero = createXeroClient();
  return await xero.buildConsentUrl();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const xero = createXeroClient();
  return await xero.apiCallback(XERO_REDIRECT_URI + '?code=' + code);
}

/**
 * Refresh access token
 */
export async function refreshXeroToken(refreshToken: string) {
  const xero = createXeroClient();
  return await xero.refreshToken();
}

/**
 * Get connected Xero tenants (organizations)
 */
export async function getXeroTenants(accessToken: string) {
  const xero = createXeroClient();
  await xero.setTokenSet({ access_token: accessToken } as any);
  return await xero.updateTenants();
}

/**
 * Calculate fair value less costs to sell (AASB 141 requirement)
 */
export function calculateFairValueLessCostsToSell(params: {
  marketValue: number;
  transportCost?: number;
  agentFees?: number;
  otherCosts?: number;
}): number {
  const { marketValue, transportCost = 0, agentFees = 0, otherCosts = 0 } = params;
  const costsToSell = transportCost + agentFees + otherCosts;
  return marketValue - costsToSell;
}

/**
 * Sync cattle to Xero as biological assets (AASB 141 compliant)
 */
export async function syncCattleToXero(params: {
  xeroClient: XeroClient;
  tenantId: string;
  cattle: Array<{
    id: string;
    nlisTag: string;
    breed: string;
    bookValue: number;
    marketValue: number;
    costsToSell?: number;
  }>;
}) {
  const { xeroClient, tenantId, cattle } = params;

  // Calculate total biological asset value (fair value less costs to sell)
  const totalFairValue = cattle.reduce((sum, animal) => {
    const fairValue = animal.costsToSell 
      ? animal.marketValue - animal.costsToSell
      : animal.marketValue;
    return sum + fairValue;
  }, 0);

  // Create or update biological assets account
  try {
    await xeroClient.accountingApi.createAccount(tenantId, {
      code: XERO_ACCOUNT_CODES.BIOLOGICAL_ASSETS,
      name: 'Biological Assets - Livestock',
      type: 'FIXED' as any,
      description: 'Livestock measured at fair value less costs to sell (AASB 141)',
    } as any);
  } catch (error) {
    // Account may already exist
    console.log('Biological assets account may already exist:', error);
  }

  // Create tracking category for livestock
  try {
    await xeroClient.accountingApi.createTrackingCategory(tenantId, {
      name: 'Livestock Type',
      options: [
        { name: 'Breeding' },
        { name: 'Feedlot' },
        { name: 'Dairy' },
      ],
    });
  } catch (error) {
    console.log('Tracking category may already exist:', error);
  }

  return {
    totalFairValue,
    cattleCount: cattle.length,
    accountCode: XERO_ACCOUNT_CODES.BIOLOGICAL_ASSETS,
  };
}

/**
 * Create journal entry for fair value adjustment (AASB 141 requirement)
 */
export async function createFairValueAdjustmentJournal(params: {
  xeroClient: XeroClient;
  tenantId: string;
  previousValue: number;
  currentValue: number;
  date: Date;
  narration: string;
}) {
  const { xeroClient, tenantId, previousValue, currentValue, date, narration } = params;

  const valuationChange = currentValue - previousValue;
  const isGain = valuationChange > 0;

  // AASB 141: Fair value changes go to P&L (not revaluation reserve)
  const journalLines = isGain
    ? [
        // DR Biological Assets
        {
          accountCode: XERO_ACCOUNT_CODES.BIOLOGICAL_ASSETS,
          description: 'Fair value increase on biological assets',
          lineAmount: Math.abs(valuationChange),
        },
        // CR Fair Value Gain
        {
          accountCode: XERO_ACCOUNT_CODES.FAIR_VALUE_GAIN,
          description: 'Fair value gain on biological assets (AASB 141)',
          lineAmount: -Math.abs(valuationChange),
        },
      ]
    : [
        // DR Fair Value Loss
        {
          accountCode: XERO_ACCOUNT_CODES.FAIR_VALUE_LOSS,
          description: 'Fair value loss on biological assets (AASB 141)',
          lineAmount: Math.abs(valuationChange),
        },
        // CR Biological Assets
        {
          accountCode: XERO_ACCOUNT_CODES.BIOLOGICAL_ASSETS,
          description: 'Fair value decrease on biological assets',
          lineAmount: -Math.abs(valuationChange),
        },
      ];

  const journal = {
    narration: narration || `Fair value adjustment for livestock (AASB 141) - ${isGain ? 'Gain' : 'Loss'}: $${Math.abs(valuationChange).toFixed(2)}`,
    journalDate: date.toISOString().split('T')[0],
    journalLines,
  };

  return await xeroClient.accountingApi.createManualJournals(tenantId, {
    manualJournals: [journal],
  });
}

/**
 * Get P&L statement from Xero
 */
export async function getXeroProfitAndLoss(params: {
  xeroClient: XeroClient;
  tenantId: string;
  fromDate: Date;
  toDate: Date;
}) {
  const { xeroClient, tenantId, fromDate, toDate } = params;

  return await xeroClient.accountingApi.getReportProfitAndLoss(
    tenantId,
    fromDate.toISOString().split('T')[0],
    toDate.toISOString().split('T')[0]
  );
}

/**
 * Get balance sheet from Xero
 */
export async function getXeroBalanceSheet(params: {
  xeroClient: XeroClient;
  tenantId: string;
  date: Date;
}) {
  const { xeroClient, tenantId, date } = params;

  return await xeroClient.accountingApi.getReportBalanceSheet(
    tenantId,
    date.toISOString().split('T')[0]
  );
}

/**
 * Generate AASB 141 disclosure report
 */
export interface AASB141Disclosure {
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  biologicalAssets: {
    openingBalance: number;
    purchases: number;
    sales: number;
    fairValueGains: number;
    fairValueLosses: number;
    closingBalance: number;
  };
  livestockGroups: Array<{
    type: string; // 'Breeding', 'Feedlot', 'Dairy'
    quantity: number;
    averageFairValue: number;
    totalFairValue: number;
  }>;
  valuationBasis: string;
  significantAssumptions: string[];
}

export function generateAASB141Disclosure(params: {
  openingBalance: number;
  purchases: number;
  sales: number;
  fairValueGains: number;
  fairValueLosses: number;
  closingBalance: number;
  livestockGroups: Array<{
    type: string;
    quantity: number;
    averageFairValue: number;
    totalFairValue: number;
  }>;
  startDate: Date;
  endDate: Date;
}): AASB141Disclosure {
  return {
    reportingPeriod: {
      startDate: params.startDate,
      endDate: params.endDate,
    },
    biologicalAssets: {
      openingBalance: params.openingBalance,
      purchases: params.purchases,
      sales: params.sales,
      fairValueGains: params.fairValueGains,
      fairValueLosses: params.fairValueLosses,
      closingBalance: params.closingBalance,
    },
    livestockGroups: params.livestockGroups,
    valuationBasis: 'Fair value less costs to sell (AASB 141)',
    significantAssumptions: [
      'Market prices based on comparable livestock sales in the region',
      'Costs to sell include transport costs, agent fees, and other direct selling costs',
      'Fair value measurements use Level 2 inputs (observable market data)',
      'Biometric verification and provenance certification affect fair value through iCattle Certified tiers',
    ],
  };
}
