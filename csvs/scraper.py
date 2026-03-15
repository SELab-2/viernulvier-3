import csv

prod_file = "Productions - output.csv"
event_file = "Events - voorstellingen.csv"

producties = dict()
events = dict()

# Productions
with open(prod_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        # Sla alle entries met onnuttige data over
        if len(row) == 7 and row[5] != "" and row[0] != "":
            producties[row[5]] = row

# Events
with open(event_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        # Sla alle entries met onbestaande producties over
        if row[3] in producties:
            if row[3] in events:
                events[row[3]].append(row)
            else:
                events[row[3]] = [row]
