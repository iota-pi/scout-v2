#!/usr/bin/python3

import datetime
import json
import logging
import math
import requests
from lxml import html
from typing import Any, List

KEEP_HALFS = False
REGIONS = ("mid", "low", "top")
TIMES = [
    ("fr_week", "30"),
    ("fr_date", "Mon 24 Jul 2017"),
    ("to_week", "43"),
    ("to_date", "Sun 29 Oct 2017"),
]

logger = logging.getLogger("scout-scraper")


def readPages():
    logger.info("Downloading HTML data...")
    url = (
        "https://nss.cse.unsw.edu.au/tt/view_multirooms.php"
        "?dbafile=2017-KENS-COFA.DBA&campus=KENS"
    )
    with open("data/rooms.json") as f:
        payload = json.load(f)
    for region in payload.keys():
        logger.info(f'Downloading data for campus region "{region}"')
        payload[region] += TIMES
        r = requests.post(url, payload[region])
        with open("html/" + region + ".html", "w") as f:
            f.write(r.content.decode("utf-8"))


def scrape():
    logger.info("Parsing data...")
    for region in REGIONS:
        logger.info(f"Parsing data for {region} campus region")
        scrapeRegion(region)


def scrapeRegion(region):
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
        rooms = transpose([row[1:-1] for row in rows])
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


def transpose(array: List[List[Any]]):
    """Transpose a list of lists"""
    return [[array[j][i] for j in range(len(array))] for i in range(len(array[0]))]


def extract(cell, mask):
    """Extracts the week data from the given cell"""
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
            weeks = item[:midsem] + item[(midsem + 1):]

            # Turn weeks to binary and OR with previous record of booked weeks
            # NB:   the reverse is to make last week (originally on RHS)
            #       to be MSB not LSB
            total |= int(weeks[::-1], 2)

        return total


def getDays(table):
    """Gets a hash of the data for each day"""
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
            if day in days:
                logger.warning(f"Overwriting previous data for {day}")
            days[day] = []

    return days


def getHour(string):
    """Turns a 24-hour time string into a float"""
    return float(string.replace(":30", ".5").replace(":00", ""))


def compact(arr):
    """Combines consecutive half-hour blocks into hour-long blocks"""
    if KEEP_HALFS:
        return arr
    return [arr[i] | arr[i + 1] for i in range(0, len(arr), 2)]


def loadPage(fname):
    """Reads an HTML page from local cache"""
    with open("html/" + fname + ".html") as f:
        tree = html.fromstring(f.read())
    return tree


if __name__ == "__main__":
    readPages()

    # Parse the HTML data
    scrape()
