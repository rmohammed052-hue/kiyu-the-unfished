import axios from "axios";

const EXCHANGE_RATE_API = "https://api.frankfurter.app";
const DEFAULT_CURRENCY = "GHS";
const API_BASE_CURRENCY = "EUR"; // Frankfurter.dev supports EUR but not GHS

interface ExchangeRates {
  [key: string]: number;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: ExchangeRates;
}

let ratesCache: { base: string; rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_DURATION = 3600000; // 1 hour

// Approximate GHS to EUR rate (updated periodically)
const GHS_TO_EUR_RATE = 0.075; // 1 GHS ≈ 0.075 EUR

export async function getExchangeRates(base: string = DEFAULT_CURRENCY): Promise<ExchangeRates> {
  const now = Date.now();
  
  if (ratesCache && ratesCache.base === base && now - ratesCache.timestamp < CACHE_DURATION) {
    return ratesCache.rates;
  }

  try {
    // Fetch rates from EUR - frankfurter.dev only supports major currencies
    const currencies = "USD,GBP";
    const response = await axios.get<FrankfurterResponse>(
      `${EXCHANGE_RATE_API}/latest?from=${API_BASE_CURRENCY}&to=${currencies}`
    );
    
    if (!response.data || !response.data.rates) {
      console.error("Invalid exchange rate response:", response.data);
      return { [base]: 1 };
    }
    
    const eurRates = response.data.rates;
    
    // If base is GHS, convert all EUR rates to GHS rates and add approximations for African currencies
    if (base === "GHS") {
      const rates: ExchangeRates = { 
        GHS: 1, 
        EUR: 1 / GHS_TO_EUR_RATE 
      };
      
      // Convert major currencies from EUR to GHS
      for (const [currency, eurRate] of Object.entries(eurRates)) {
        rates[currency] = eurRate / GHS_TO_EUR_RATE;
      }
      
      // Add approximate rates for African currencies (relative to USD)
      const usdToGhs = rates.USD || 13.33; // Fallback rate
      rates.NGN = usdToGhs * 0.0013; // 1 NGN ≈ 0.0013 USD
      rates.XOF = usdToGhs * 0.0017; // 1 XOF ≈ 0.0017 USD  
      rates.ZAR = usdToGhs * 0.055; // 1 ZAR ≈ 0.055 USD
      rates.KES = usdToGhs * 0.0077; // 1 KES ≈ 0.0077 USD
      
      ratesCache = { base, rates, timestamp: now };
      return rates;
    }
    
    // For other bases, return rates as-is with base currency added
    const rates = { ...eurRates, [base]: 1 };
    ratesCache = { base, rates, timestamp: now };
    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return { [base]: 1 };
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  
  const rates = await getExchangeRates(from);
  const rate = rates[to];
  
  if (!rate) {
    console.error(`No exchange rate found for ${from} to ${to}`);
    return amount;
  }
  
  return amount * rate;
}

export const SUPPORTED_CURRENCIES = ["GHS", "USD", "NGN", "EUR", "GBP", "XOF", "ZAR", "KES"];
