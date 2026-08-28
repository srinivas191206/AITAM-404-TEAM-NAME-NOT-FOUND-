export interface CurrencyQueryResult {
  status: 'placeholder' | 'ready';
  message: string;
}

class CurrencyService {
  public async identifyCurrency(): Promise<CurrencyQueryResult> {
    return {
      status: 'placeholder',
      message: 'Identifying currency note. Currency recognition is being prepared.',
    };
  }
}

export const currencyService = new CurrencyService();
