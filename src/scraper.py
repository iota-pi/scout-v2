#!/usr/bin/python3

from lxml import html
import datetime
import requests
import json
import numpy as np
import math
import sys
import ast

KEEP_HALFS = False

TIMES = [
    ("fr_week", "30"),
    ("fr_date", "Mon 24 Jul 2017"),
    ("to_week", "43"),
    ("to_date", "Sun 29 Oct 2017"),
]


def main(region):
    global START_HOUR, END_HOUR, DAY_ROWS, KEEP_HALFS

    # Load the page data
    fname = region
    page = loadPage(fname)

    # Find our main table
    table = page.xpath("//table[3]")[0]
    # rows = table.xpath('tr[@class="rowHighlight" or @class="rowLowlight"]')

    # Get all class names
    roomlist = table.xpath('tr[1]/td[@class="note ttpad"]/b/text()')

    # Get the rows of the tables for each day
    days = getDays(table)

    # Find the mask
    mask = page.xpath("//table[2]/tr[1]/td[2]/text()")[0].split(" ")[-1]

    data = {}

    # Build an array of starting and ending times
    dow = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    starts = []
    ends = []
    for day in dow:
        starts.append(getHour(days[day][0][0].text))
        ends.append(math.ceil(getHour(days[day][-1][0].text)))

    # Scrape data for each timeslot in each day
    for day in days:
        rows = days[day]

        # Align first row with the start on an hour
        if not starts[dow.index(day)].is_integer():
            # Duplicate first entry
            rows.insert(0, rows[0])

        # Rooms
        rooms = list(np.array([row[1:-1] for row in rows]).transpose())
        data[day] = [
            compact(list(map(lambda x: extract(x, mask), room))) for room in rooms
        ]

    # Create settings hash to add to JSON output
    date = datetime.date.today()
    starts = list(map(int, starts))
    settings = {
        "start": starts,
        "end": ends,
        "days": len(days),
        "halfhours": KEEP_HALFS,
        "sem": "T1",
        "year": date.strftime("%Y"),
        "updated": date.strftime("%d/%m/%Y"),
    }

    with open("data/" + fname + ".json", "w") as f:
        json.dump([data, roomlist, settings], f, separators=(",", ":"))


#
# extract(): extracts the week data from the given cell
#
def extract(cell, mask):
    arr = cell.xpath("span/@title")
    text = cell.xpath(".//text()")
    if "".join(text).strip() in ("&nbsp;", ""):
        return 0
    elif len(arr) == 0:
        return int(mask, 2)
    else:
        midsem = mask.find("0")
        total = 0
        for item in arr:
            # Omit the MSB
            weeks = item[:midsem] + item[midsem + 1 :]

            # Turn weeks to binary and OR with previous record of booked weeks
            # NB:   the reverse is to make last week (originally on RHS)
            #       to be MSB not LSB
            total |= int(weeks[::-1], 2)

        return total


#
# getDays()
# Gets an array of the rows for each day in the table, and stores this in a hash
# Returns hash with day names as keys
#
def getDays(table):
    days = {}
    day = None

    for row in table:
        # Get the data from the first cell in this row
        #   This will either be a day of the week, or a time
        cell = "".join(row[0].xpath(".//text()")).strip(":0").replace(":3", ".5")

        # Check if first character is a digit; if so, this is a time
        if cell[0].isdigit():
            # Append this row to this day
            days[day].append(row)
        else:
            # Move on to the next row
            day = cell.lower()
            days[day] = []

    return days


#
# getHour(): turns a time string in 24-hour format into a float
#            (NB: requires 1/2 hour minimum intervals)
#
def getHour(string):
    return float(string.replace(":30", ".5").replace(":00", ""))


#
# compact(): combines consecutive half-hour-long blocks into hour-long blocks
#
def compact(arr):
    global KEEP_HALFS
    if KEEP_HALFS:
        return arr
    return [arr[i] | arr[i + 1] for i in range(0, len(arr), 2)]


#
# loadPage(): takes a URI and returns an HTML tree from the page data at that URI
# NB:         this is synchronous
#
def loadPage(fname):
    with open("html/" + fname + ".html") as f:
        tree = html.fromstring(f.read())
    return tree


def readPages():
    print("Downloading HTML data...")
    url = "https://nss.cse.unsw.edu.au/tt/view_multirooms.php?dbafile=2017-KENS-COFA.DBA&campus=KENS"
    with open("rooms") as f:
        payload = ast.literal_eval(f.read())
    for region in payload.keys():
        print("Downloading data for " + region + " campus region... ", end="")
        sys.stdout.flush()
        payload[region] += TIMES
        r = requests.post(url, payload[region])
        with open("html/" + region + ".html", "w") as f:
            f.write(r.content.decode("utf-8"))
        print("Done")


def parse():
    print("Parsing data...")
    for region in ("mid", "low", "top"):
        print("Parsing data for " + region + " campus region... ", end="")
        sys.stdout.flush()
        main(region)
        print("Done")


if __name__ == "__main__":
    download = True

    # Always download if -f option is present
    for arg in sys.argv[1:]:
        if arg[0] == "0" and "f" in arg:
            download = True

    if download:
        readPages()

    # Parse the HTML data
    parse()
