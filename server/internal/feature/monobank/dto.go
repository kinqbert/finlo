package monobank

type PreviewInput struct {
	Token string `json:"token" validate:"required,notblank,max=500"`
}

type PreviewAccount struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Type         string   `json:"type"`
	Currency     string   `json:"currency"`
	BalanceMinor int64    `json:"balance_minor"`
	CreditLimit  int64    `json:"credit_limit_minor"`
	MaskedPAN    []string `json:"masked_pan"`
	IBAN         string   `json:"iban"`
}

type PreviewJar struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	Currency     string `json:"currency"`
	BalanceMinor int64  `json:"balance_minor"`
	TargetMinor  *int64 `json:"target_minor"`
}

type Preview struct {
	ConnectionID string           `json:"connection_id"`
	ClientName   string           `json:"client_name"`
	Accounts     []PreviewAccount `json:"accounts"`
	Jars         []PreviewJar     `json:"jars"`
}

type CompleteInput struct {
	ConnectionID string   `json:"connection_id" validate:"required,uuid"`
	AccountIDs   []string `json:"account_ids" validate:"dive,required"`
	JarIDs       []string `json:"jar_ids" validate:"dive,required"`
}

type ConnectionDTO struct {
	ID                string  `json:"id"`
	Status            string  `json:"status"`
	ClientName        string  `json:"client_name"`
	WebhookConfigured bool    `json:"webhook_configured"`
	AccountCount      int64   `json:"account_count"`
	JarCount          int64   `json:"jar_count"`
	LastError         string  `json:"last_error,omitempty"`
	ConnectedAt       *string `json:"connected_at,omitempty"`
}
