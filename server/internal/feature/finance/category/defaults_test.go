package category

import "testing"

func TestDefaultCategories(t *testing.T) {
	t.Parallel()

	const userID = "2d440831-d5e7-475b-9af4-8a1afc823188"
	want := map[string][]string{
		"expense": {
			"Housing & Utilities",
			"Food & Dining",
			"Transportation",
			"Shopping & Leisure",
			"Other Expenses",
		},
		"income": {
			"Salary",
			"Freelance & Business",
			"Investments",
			"Gifts",
			"Other Income",
		},
	}

	categories := defaultCategories(userID)
	if len(categories) != 10 {
		t.Fatalf("defaultCategories() returned %d categories, want 10", len(categories))
	}

	positions := map[string]int{}
	for _, category := range categories {
		if category.ID == "" {
			t.Error("defaultCategories() returned a category without an ID")
		}
		if category.UserID != userID {
			t.Errorf("category %q user ID = %q, want %q", category.Name, category.UserID, userID)
		}

		names, ok := want[category.Type]
		if !ok {
			t.Errorf("category %q has unexpected type %q", category.Name, category.Type)
			continue
		}
		position := positions[category.Type]
		if position >= len(names) {
			t.Errorf("too many %q categories", category.Type)
			continue
		}
		if category.Name != names[position] {
			t.Errorf("%s category at position %d = %q, want %q", category.Type, position, category.Name, names[position])
		}
		if category.SortOrder != position {
			t.Errorf("category %q sort order = %d, want %d", category.Name, category.SortOrder, position)
		}
		positions[category.Type]++
	}

	for categoryType, names := range want {
		if positions[categoryType] != len(names) {
			t.Errorf("created %d %s categories, want %d", positions[categoryType], categoryType, len(names))
		}
	}
}
