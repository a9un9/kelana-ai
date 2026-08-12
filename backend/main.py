from services.trip_services import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation
)

print("==============================")
print("KelanaAI")
print("==============================")

destination     = input("Destination : ")
days            = int(input("Days       : "))
budget          = float(input("Budget     : "))
travel_month    = input("Travel Month: ")

daily = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
transportation = get_transportation(category)

print()
print(f"Destination : {destination}")
print(f"Days        : {days}")
print(f"Budget      : {budget:.0f} USD")
print(f"Category    : {category}")
print(f"Daily Budget: {daily:.0f} USD/Day")
print(f"Travel Month: {travel_month}")

if travel_month.lower() == "december":
    season = "Peak Season"
elif travel_month.lower() == "june":
    season = "Holiday Season"
else:
    season = "Regular Season"

print(f"Season      : {season}")

print()
print("Recommended Transportation")
print(f"- {transportation}")

