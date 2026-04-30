from pydantic import BaseModel


class CurrencyInfo(BaseModel):
    countryName: str
    currencyCode: str
    currencyName: str


class ExchangeRateResponse(BaseModel):
    fromCurrencyCode: str
    toCurrencyCode: str
    exchangeRate: str
