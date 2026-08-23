package dashboard

import "testing"

func TestConvertMinor(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name   string
		amount int64
		rate   int64
		want   int64
	}{
		{name: "one dollar", amount: 100, rate: 44_430_000, want: 4443},
		{name: "fraction rounds", amount: 1, rate: 44_600_000, want: 45},
		{name: "negative balance", amount: -100, rate: 44_430_000, want: -4443},
	} {
		t.Run(test.name, func(t *testing.T) {
			got, err := convertMinor(test.amount, test.rate)
			if err != nil || got != test.want {
				t.Fatalf("convertMinor() = %d, %v; want %d", got, err, test.want)
			}
		})
	}
}

func TestConvertFromBaseMinor(t *testing.T) {
	t.Parallel()

	got, err := convertFromBaseMinor(4_443, 44_430_000)
	if err != nil || got != 100 {
		t.Fatalf("convertFromBaseMinor() = %d, %v; want 100", got, err)
	}
	if _, err := convertFromBaseMinor(100, 0); err == nil {
		t.Fatal("convertFromBaseMinor() accepted a zero rate")
	}
}
