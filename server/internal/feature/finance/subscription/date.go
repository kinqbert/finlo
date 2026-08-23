package subscription

import (
	"time"

	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
)

func NextBillingDate(billingDay int, from time.Time) time.Time {
	location := from.Location()
	today := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, location)
	next := billingDate(from.Year(), from.Month(), billingDay, location)
	if next.Before(today) {
		nextMonth := time.Date(from.Year(), from.Month()+1, 1, 0, 0, 0, 0, location)
		next = billingDate(nextMonth.Year(), nextMonth.Month(), billingDay, location)
	}
	return next
}

func ResolveNextPaymentDates(subscriptions []model.Subscription, from time.Time) {
	today := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, from.Location())
	for index := range subscriptions {
		if !subscriptions[index].Active {
			continue
		}
		if subscriptions[index].NextPaymentDate != nil {
			persisted := subscriptions[index].NextPaymentDate.In(from.Location())
			persistedDate := time.Date(persisted.Year(), persisted.Month(), persisted.Day(), 0, 0, 0, 0, from.Location())
			if !persistedDate.Before(today) {
				continue
			}
		}
		next := NextBillingDate(subscriptions[index].BillingDay, from)
		subscriptions[index].NextPaymentDate = &next
	}
}

func billingDate(year int, month time.Month, preferredDay int, location *time.Location) time.Time {
	lastDay := time.Date(year, month+1, 0, 0, 0, 0, 0, location).Day()
	day := max(1, min(preferredDay, lastDay))
	return time.Date(year, month, day, 0, 0, 0, 0, location)
}
