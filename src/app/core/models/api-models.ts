export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  guardianName?: string | null;
  mobile?: string;
  altMobile?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  kyc?: {
    aadhaarMasked: string | null;
    aadhaarFull?: string;
    panNumber: string | null;
  } | null;
  transactions?: CustomerTransactionSummary[];
}

export interface CustomerTransactionSummary {
  id: string;
  girviNumber: string;
  status: GirviStatus;
  pledgeDate: string;
  dueDate: string | null;
  loanAmount: string | null;
  totalPaid: number;
}

export type GirviStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'RENEWED'
  | 'CLOSED'
  | 'REDEEMED'
  | 'AUCTION_ELIGIBLE'
  | 'AUCTIONED'
  | 'CANCELLED';

export interface PledgedItemInput {
  itemType: string;
  description?: string;
  metalCode: string;
  purityCode: string;
  grossWeight: string;
  stoneWeight?: string;
  condition?: string;
  conditionNotes?: string;
  hallmark?: string;
  huid?: string;
}

export interface PledgedItem extends PledgedItemInput {
  id: string;
  netWeight: string;
}

export interface GirviValuation {
  totalFineWeight: string;
  totalMetalValue: string;
  eligibilityPercent: string;
  eligibleValue: string;
  marginApplied: string;
  maxLoanAmount: string;
  actualLoanAmount: string;
  interestPercent: string;
  calculationBreakdown: Record<string, unknown>;
}

export interface GirviTopUp {
  id: string;
  amount: string;
  topUpDate: string;
  applyPreviousInterestStartDate: boolean;
  createdAt: string;
}

export interface CurrentValuationResponse {
  pledgeValuation: {
    totalFineWeight: string;
    totalMetalValue: string;
    eligibilityPercent: string;
    eligibleValue: string;
    maxLoanAmount: string;
    actualLoanAmount: string;
  };
  currentValuation: {
    rates: Record<string, string>;
    totalFineWeight: string;
    totalMetalValue: string;
    eligibilityPercent: string;
    currentEligibleValue: string;
    currentMaxLoanAmount: string;
  };
}


export interface GirviTransaction {
  id: string;
  girviNumber: string;
  customerId: string;
  customer?: Customer;
  branchId: string;
  status: GirviStatus;
  pledgeDate: string;
  dueDate: string | null;
  /** Customer's pledge-acknowledgement signature for this specific
   * transaction — not the same as the customer's KYC signature. */
  customerSignatureUrl?: string | null;
  items: PledgedItem[];
  valuation: GirviValuation | null;
  payments?: Payment[];
  topUps?: GirviTopUp[];
  loanAmount: string;
}

export interface PaymentAllocation {
  category: 'PENALTY' | 'CHARGES' | 'INTEREST' | 'PRINCIPAL';
  amount: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  amount: string;
  mode: 'CASH' | 'UPI' | 'BANK' | 'OTHER';
  isReversed: boolean;
  /** The actual date the payment was received (may be backdated). */
  paymentDate: string;
  /** When this record was entered into the system — always "now" at
   * creation time, never editable. */
  createdAt: string;
  allocations?: PaymentAllocation[];
}

export interface OutstandingSummary {
  principal: string;
  interestAccrued: string;
  charges: string;
  penalty: string;
  totalOutstanding: string;
}

export interface Metal {
  id: string;
  code: string;
  name: string;
}

export interface Purity {
  id: string;
  code: string;
  fineFactor: string;
}

export interface MetalRate {
  id: string;
  metalId: string;
  ratePerGram: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface DashboardSummary {
  activeGirviCount: number;
  principalOutstanding: string;
  interestOutstanding: string;
  todaysCollections: string;
  monthCollections: string;
  overdueCount: number;
  dueSoonCount: number;
  goldPledgedGrams: string;
  silverPledgedGrams: string;
  totalCashDeployed: string;
}

export interface PaginatedResult<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
}