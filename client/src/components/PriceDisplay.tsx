import { useLanguage } from "@/contexts/LanguageContext";

interface PriceDisplayProps {
  amount: number | string;
  className?: string;
  "data-testid"?: string;
}

export function PriceDisplay({ amount, className, "data-testid": testId }: PriceDisplayProps) {
  const { formatPrice } = useLanguage();
  
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const validAmount = isNaN(numericAmount) ? 0 : numericAmount;
  
  return (
    <span className={className} data-testid={testId}>
      {formatPrice(validAmount)}
    </span>
  );
}

export function parseAmount(value: number | string): number {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(numeric) ? 0 : numeric;
}
