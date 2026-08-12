from services.trip_services import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation
)


budget = float(input("Budget: "))

destinations = []

while True:
    destination = input("Destination (type 'done' to finish): ")

    if destination.lower() == "done":
        break

    destinations.append(destination)

days = int(input("Days: "))

daily = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
transportation = get_transportation(category)

print(f"{category} ({daily:.2f} USD/day)")
print(f"Recommended Transportation: {transportation}")
print(f"Your Destinations: {', '.join(destinations)}")
