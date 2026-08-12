# # Ask for trip details
# destination = input("Destination: ")
# country = input("Country: ")
# days = int(input("Days: "))
# budget = float(input("Budget: "))
# currency = input("Currency: ")
# travel_month = input("Travel Month: ")


# # Function to display trip summary
# def print_trip_summary(destination, country, days, budget, currency, travel_month):
#     print("====================")
#     print("KelanaAI")
#     print("====================")
#     print(f"Destination : {destination}")
#     print(f"Country     : {country}")
#     print(f"Days        : {days}")
#     print(f"Budget      : {budget} {currency}")
#     print(f"Currency    : {currency}")
#     print(f"Travel Month: {travel_month}")


# # Display trip summary
# print_trip_summary(
#     destination,
#     country,
#     days,
#     budget,
#     currency,
#     travel_month
# )

#=================================================================================================================

# budget = int(input("Enter your budget: "))

# if budget < 1000:
#     category = "Backpacker"
# elif budget <= 3000:
#     category = "Standard"
# else:
#     category = "Luxury"

# print(f"Category: {category}")

#=================================================================================================================

# budget = 1500
# days = 5

# daily_budget = budget / days

# print(f"Daily Budget: {daily_budget} USD/day")

#=================================================================================================================

# # List of recommended destinations
# recommended_places = [
#     "Tokyo Tower",
#     "Shibuya",
#     "Mount Fuji"
# ]

# # Loop through the list
# for place in recommended_places:
#     print(f"- {place}")

#=================================================================================================================

# Functions

def calculate_daily_budget(budget, days):
    return budget / days

def get_trip_category(budget):
    if budget < 1000:
        return "Backpacker"
    elif budget <= 3000:
        return "Standard"
    else:
        return "Luxury"

def get_transportation(category):
    if category.lower() == "backpacker":
        return "Bus"
    elif category.lower() == "standard":
        return "Train"
    else:
        return "Flight"
