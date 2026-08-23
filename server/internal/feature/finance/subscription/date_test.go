package subscription

import (
	"testing"
	"time"
)

func TestNextBillingDate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		billingDay int
		from       string
		want       string
	}{
		{name: "later this month", billingDay: 24, from: "2026-08-23", want: "2026-08-24"},
		{name: "today", billingDay: 23, from: "2026-08-23", want: "2026-08-23"},
		{name: "next month", billingDay: 12, from: "2026-08-23", want: "2026-09-12"},
		{name: "next month after a long month", billingDay: 15, from: "2027-01-31", want: "2027-02-15"},
		{name: "February uses its last day", billingDay: 31, from: "2027-02-01", want: "2027-02-28"},
		{name: "leap year February uses its last day", billingDay: 31, from: "2028-02-01", want: "2028-02-29"},
		{name: "April uses its last day", billingDay: 31, from: "2026-04-01", want: "2026-04-30"},
		{name: "preference returns in a longer month", billingDay: 31, from: "2026-05-01", want: "2026-05-31"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			from, err := time.Parse("2006-01-02", test.from)
			if err != nil {
				t.Fatal(err)
			}
			got := NextBillingDate(test.billingDay, from).Format("2006-01-02")
			if got != test.want {
				t.Errorf("NextBillingDate(%d, %s) = %s, want %s", test.billingDay, test.from, got, test.want)
			}
		})
	}
}
