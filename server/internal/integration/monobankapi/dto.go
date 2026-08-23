package monobankapi

type ClientInfo struct {
	ClientID       string          `json:"clientId"`
	Name           string          `json:"name"`
	WebhookURL     string          `json:"webHookUrl"`
	Permissions    string          `json:"permissions"`
	Accounts       []Account       `json:"accounts"`
	Jars           []Jar           `json:"jars"`
	ManagedClients []ManagedClient `json:"managedClients"`
}

type Account struct {
	ID           string   `json:"id"`
	SendID       string   `json:"sendId"`
	Balance      int64    `json:"balance"`
	CreditLimit  int64    `json:"creditLimit"`
	Type         string   `json:"type"`
	CurrencyCode int      `json:"currencyCode"`
	CashbackType string   `json:"cashbackType"`
	MaskedPAN    []string `json:"maskedPan"`
	IBAN         string   `json:"iban"`
}

type Jar struct {
	ID           string `json:"id"`
	SendID       string `json:"sendId"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	CurrencyCode int    `json:"currencyCode"`
	Balance      int64  `json:"balance"`
	Goal         int64  `json:"goal"`
}

type ManagedClient struct {
	ClientID string    `json:"clientId"`
	TIN      int64     `json:"tin"`
	Name     string    `json:"name"`
	Accounts []Account `json:"accounts"`
}

type StatementItem struct {
	ID              string `json:"id"`
	Time            int64  `json:"time"`
	Description     string `json:"description"`
	MCC             int    `json:"mcc"`
	OriginalMCC     int    `json:"originalMcc"`
	Hold            bool   `json:"hold"`
	Amount          int64  `json:"amount"`
	OperationAmount int64  `json:"operationAmount"`
	CurrencyCode    int    `json:"currencyCode"`
	CommissionRate  int64  `json:"commissionRate"`
	CashbackAmount  int64  `json:"cashbackAmount"`
	Balance         int64  `json:"balance"`
	Comment         string `json:"comment"`
	ReceiptID       string `json:"receiptId"`
	InvoiceID       string `json:"invoiceId"`
	CounterEDRPOU   string `json:"counterEdrpou"`
	CounterIBAN     string `json:"counterIban"`
	CounterName     string `json:"counterName"`
}

type WebhookEvent struct {
	Type string `json:"type"`
	Data struct {
		Account       string        `json:"account"`
		StatementItem StatementItem `json:"statementItem"`
	} `json:"data"`
}

type CurrencyRate struct {
	CurrencyCodeA int     `json:"currencyCodeA"`
	CurrencyCodeB int     `json:"currencyCodeB"`
	Date          int64   `json:"date"`
	RateSell      float64 `json:"rateSell"`
	RateBuy       float64 `json:"rateBuy"`
	RateCross     float64 `json:"rateCross"`
}
