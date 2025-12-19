import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackSubaccountData {
  business_name: string;
  bank_code: string;
  account_number: string;
  percentage_charge: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
}

interface PaystackSubaccountResponse {
  status: boolean;
  message: string;
  data: {
    subaccount_code: string;
    business_name: string;
    account_number: string;
    percentage_charge: number;
    settlement_bank: string;
    currency: string;
    id: number;
  };
}

interface PaystackBankListResponse {
  status: boolean;
  message: string;
  data: Array<{
    id: number;
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string;
    active: boolean;
  }>;
}

interface PaystackAccountVerificationResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

export class PaystackService {
  private headers = {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  async createSubaccount(data: PaystackSubaccountData): Promise<PaystackSubaccountResponse> {
    try {
      const response = await axios.post<PaystackSubaccountResponse>(
        `${PAYSTACK_BASE_URL}/subaccount`,
        data,
        { headers: this.headers, timeout: 20000 }
      );
      return response.data;
    } catch (error: any) {
      // Network or timeout errors
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to reach Paystack. Please check your internet connection.');
      }
      
      // Paystack API errors
      const status = error.response?.status;
      const message = error.response?.data?.message;
      
      if (status === 400) {
        // Check for specific Paystack error messages
        if (message?.includes('subaccount already exists') || message?.includes('already exist')) {
          throw new Error('Payment account already set up for this bank account. Contact support if you need to update it.');
        }
        if (message?.includes('invalid account number')) {
          throw new Error('Invalid bank account number. Please verify your account details.');
        }
        throw new Error(message || 'Invalid payment setup data. Please check all fields and try again.');
      }
      if (status === 422) {
        throw new Error('Invalid bank account details. Please verify the account number and bank code.');
      }
      if (status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (status === 401) {
        throw new Error('Payment gateway authentication failed. Please contact support.');
      }
      if (status === 503 || status === 504) {
        throw new Error('Paystack service temporarily unavailable. Please try again in a few minutes.');
      }
      
      throw new Error(message || 'Failed to set up payment account. Please try again or contact support.');
    }
  }

  async getGhanaBanks(): Promise<PaystackBankListResponse> {
    try {
      const response = await axios.get<PaystackBankListResponse>(
        `${PAYSTACK_BASE_URL}/bank?country=ghana&type=ghipss`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banks');
    }
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string): Promise<PaystackAccountVerificationResponse> {
    try {
      const response = await axios.get<PaystackAccountVerificationResponse>(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.headers, timeout: 15000 }
      );
      return response.data;
    } catch (error: any) {
      // Network or timeout errors
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to reach Paystack. Please check your internet connection.');
      }
      
      // Paystack API errors
      const status = error.response?.status;
      const message = error.response?.data?.message;
      
      if (status === 422) {
        throw new Error('Invalid account number or bank code. Please check your details and try again.');
      }
      if (status === 404) {
        throw new Error('Account not found. Please verify the account number and bank are correct.');
      }
      if (status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (status === 401) {
        throw new Error('Payment gateway authentication failed. Please contact support.');
      }
      
      throw new Error(message || 'Could not verify account. Please check the account number and bank details.');
    }
  }

  async initializeTransaction(data: {
    email: string;
    amount: number;
    reference: string;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: 'account' | 'subaccount';
    metadata?: any;
  }) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initialize transaction');
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify transaction');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}

export const paystackService = new PaystackService();
