#!/usr/bin/env python3

from collections import defaultdict
from datetime import datetime
from dateutil import parser
from typing import Dict, List, Sequence, Tuple
import json
import logging

import requests
from bs4 import BeautifulSoup


RoomData = Dict[float, int]
DayData = Dict[str, RoomData]
WeekData = Dict[str, DayData]

BASE_URL = "https://nss.cse.unsw.edu.au/tt"
FULL_URL = f"{BASE_URL}/view_multirooms.php?dbafile=2021-KENS-COFA.DBA&campus=KENS"
REGIONS = (
    "mid",
    "low",
    "top",
)
PRECINCT_MAP: Dict[str, List[str]] = {
    "low": ["PR_SQHS", "PR_TETB", "PR_LAW"],
    "mid": ["PR_GOLD", "PR_QUAD"],
    "top": ["PR_AGSM", "PR_MATHEWS", "PR_MORVENBRN"],
}

logging.basicConfig()
logger = logging.getLogger("scout-scraper")
logger.setLevel(logging.INFO)


def scrape():
    """Scrape data for every campus region for the current term"""
    logger.info(f"Fetching term metadata")
    times = get_terms_and_times()
    term = get_current_term(times)
    meta = get_metadata(times[term], term)
    for region in REGIONS:
        logger.info(f"Parsing data for {region} campus region")
        data = scrape_region(region, times[term])
        write_data(region, data, meta)


def scrape_region(region: str, times: dict) -> WeekData:
    """Scrape data for one campus region"""
    precincts = PRECINCT_MAP[region]
    rooms = fetch_rooms(precincts)
    page = fetch_bookings_page(rooms, precincts, times)
    data = parse_bookings_page(page)
    return data


def write_data(region: str, data: WeekData, meta: dict):
    """Writes the region's data to a file"""
    full_data = {
        "data": data,
        "meta": meta,
    }
    with open(f"data/{region}.json", "w") as f:
        json.dump(full_data, f, indent=2)


def fetch_rooms(precincts: List[str]) -> List[str]:
    """Fetch all room ids for the given precinct(s)"""
    precinct_items = [("PR[]", precinct) for precinct in precincts]
    payload = (
        ("RU[]", "RU_GP-TUTSEM"),
        *precinct_items,
        ("roomsize", "all"),
        ("building", "all"),
        ("search_rooms", "Search"),
    )
    r = requests.post(FULL_URL, payload)
    soup = BeautifulSoup(r.content, "lxml")
    room_inputs = soup.find_all("input", attrs={"type": "checkbox", "name": "rooms[]"})
    room_ids = [room["value"] for room in room_inputs]
    return room_ids


def fetch_bookings_page(
    rooms: Sequence[str],
    precincts: List[str],
    times: dict,
) -> BeautifulSoup:
    """Request the page with the main bookings table"""
    payload = [
        ("view", "View Selected Rooms"),
        ("check_cntrl", "on"),
        ("roomtype", "all"),
        ("roomsize", "all"),
        ("acadorg", "all"),
        ("building", "all"),
        ("roomsuits", f"RU_GP-TUTSEM|{','.join(precincts)}"),
        *get_teaching_period_params(times),
    ]
    payload.extend([("rooms[]", room) for room in rooms])
    r = requests.post(FULL_URL, payload)
    soup = BeautifulSoup(r.content, "lxml")
    return soup


def parse_bookings_page(page: BeautifulSoup) -> WeekData:
    """Extract booking data from the main bookings page"""
    table: BeautifulSoup = page.find_all("table", attrs={"class": "grid"})[-1]
    rows: Sequence[BeautifulSoup] = table.find_all("tr")
    mask = get_teaching_mask(page)
    day = ""
    rooms: List[str] = []
    data: WeekData = {}

    for row in rows:
        first_cell_text: str = row.td.text
        if first_cell_text[0].isalpha():
            day = first_cell_text.lower()
            if len(rooms) == 0:
                rooms = get_room_names(row)
            data.setdefault(day, defaultdict(dict))
            continue

        cells = row.find_all("td")[1:-1]
        hour = int(get_hour(first_cell_text))
        for room, cell in zip(rooms, cells):
            value = extract(cell, mask)
            newValue = data[day][room].get(hour, 0) | value
            if newValue:
                data[day][room][hour] = newValue

    return data


def get_terms_and_times():
    """Gets the times for each term (aka. teaching period)"""

    def extract_term(text: str) -> str:
        return text.split()[-1]

    def extract_term_times(text: str) -> dict:
        from_week, from_date, to_week, to_date = text.split(",")
        return {
            "from_week": from_week,
            "from_date": parser.parse(from_date),
            "to_week": to_week,
            "to_date": parser.parse(to_date),
        }

    r = requests.get(FULL_URL)
    soup = BeautifulSoup(r.content, "lxml")
    select = soup.find("select", id="teachingperiod")
    options = select.find_all("option")
    times = {
        extract_term(option.text): extract_term_times(option["value"])
        for option in options
    }
    return times


def get_current_term(times: dict):
    """Gets the current term (or upcoming term if none is current)"""
    terms = ["T1", "T2", "T3"]
    for term in terms:
        if times[term]["from_date"] < datetime.now():
            return term
    raise ValueError("Could not find current term")


def get_metadata(times: dict, term: str):
    """Get metadata dict to be included with final output"""
    return {
        "from": str(times["from_date"]),
        "to": str(times["to_date"]),
        "term": term,
    }


def get_room_names(row: BeautifulSoup) -> List[str]:
    """Retrieve list of room names from a table row"""
    cells = row.find_all("td")[1:-1]
    names = [cell.b.text for cell in cells]
    return names


def get_teaching_mask(page: BeautifulSoup) -> str:
    """Get the binary mask of which weeks are teaching weeks"""
    table = page.find_all("table", attrs={"class": "grid"})[0]
    return table.tr.text.split()[-1]


def get_teaching_period_params(times: dict) -> Tuple[Tuple[str, str], ...]:
    """Get params to describe the current teaching period"""
    from_week = str(times["from_week"])
    from_date = str(times["from_date"])
    to_week = str(times["to_week"])
    to_date = str(times["to_date"])
    teaching_period_params = (
        ("teachingperiod", f"{from_week},{from_date},{to_week},{to_date}"),
        ("fr_week", from_week),
        ("fr_date", from_date),
        ("to_week", to_week),
        ("to_date", to_date),
    )
    return teaching_period_params


def extract(cell: BeautifulSoup, mask: str) -> int:
    """Extracts the week data from the given cell"""
    spans = cell.find_all("span")
    if cell.text.replace("&nbsp;", "").strip() == "":
        return 0
    elif len(spans) == 0:
        return int(mask, 2)

    total = 0
    for span in spans:
        weeks = "".join(x for (x, m) in zip(span["title"], mask) if m == "1")
        total |= int(weeks[::-1], 2)
    return total


def get_hour(string):
    """Turns a 24-hour time string into a float"""
    return float(string.replace(":30", ".5").replace(":00", ""))


def main(event=None, context=None):
    scrape()
