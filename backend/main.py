# Ask for trip details
destination = input("Destination: ")
country = input("Country: ")
days = int(input("Days: "))
budget = float(input("Budget: "))
currency = input("Currency: ")
travel_month = input("Travel Month: ")


# Function to display trip summary
def print_trip_summary(destination, country, days, budget, currency, travel_month):
    print("====================")
    print("KelanaAI")
    print("====================")
    print(f"Destination : {destination}")
    print(f"Country     : {country}")
    print(f"Days        : {days}")
    print(f"Budget      : {budget} {currency}")
    print(f"Currency    : {currency}")
    print(f"Travel Month: {travel_month}")


# Display trip summary
print_trip_summary(
    destination,
    country,
    days,
    budget,
    currency,
    travel_month
)