'use client';

export type Currency = 'GBP' | 'USD';

interface CurrencySelectorProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm text-gray-600 dark:text-gray-400">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value as Currency)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="GBP">£ GBP</option>
        <option value="USD">$ USD</option>
      </select>
    </div>
  );
}

