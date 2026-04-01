import json

import requests
import supabase
from os import environ as env
from typing import Optional, List, TypedDict
from dotenv import load_dotenv

load_dotenv()

class AvailableCommander(TypedDict):
    id: str
    name: str
    set_code: str
    color_identity: str
    image_uri: str
    oracle_text: str
    keywords: List[str]
    type_line: str

class PartnerCategories(TypedDict):
    GENERIC: List[AvailableCommander]
    FRIENDS_FOREVER: List[AvailableCommander]
    BACKGROUND: List[AvailableCommander]
    DOCTOR_COMPANION: List[AvailableCommander]
    SPECIFIC: List[AvailableCommander]

class PartnerPair(TypedDict):
    first_id: str
    second_id: str
    name: str
    color_identity: str
    image_uri: List[str]
    partner_type: str

def get_client() -> supabase.Client:
    return supabase.create_client(
        supabase_url=env.get('SUPABASE_URL'),
        supabase_key=env.get('SUPABASE_KEY')
    )

def get_cards(client: supabase.Client) -> List[AvailableCommander]:
    cards = []
    current = -1
    fetch_more = True
    while fetch_more:
        print(f"Fetching cards from {current + 2} to {current + 1001}... ", end="")
        response = client.from_('available_commanders').select('*').range(current + 1, current + 1000).execute()
        total = response.count or len(response.data)
        if total == 0:
            print("NO CARDS FOUND, STOPPING.")
            fetch_more = False
        else:
            cards.extend(response.data)
            print(f"RETRIEVED {total} CARDS.")

            current += 1000
            fetch_more = total == 1000

    return cards

def discard_non_partner_cards(cards: List[AvailableCommander]) -> List[AvailableCommander]:
    partner_cards = []
    for card in cards:
        if "Partner" in card["keywords"]:
            partner_cards.append(card)
            continue
        if "Time Lord Doctor" in card["type_line"]:
            partner_cards.append(card)
            continue
        if "Background" in card["type_line"]:
            partner_cards.append(card)
            continue
        if "Choose a background" in card["keywords"]:
            partner_cards.append(card)
            continue
        if card.get("oracle_text") and "Doctor's companion" in card["oracle_text"]:
            partner_cards.append(card)
            continue
    
    return partner_cards

def categorize_partners(partner_cards: List[AvailableCommander]) -> PartnerCategories:
    categories: PartnerCategories = {
        'GENERIC': [],
        'FRIENDS_FOREVER': [],
        'BACKGROUND': [],
        'DOCTOR_COMPANION': [],
        'SPECIFIC': []
    }

    for card in partner_cards:
        if "Partner with" in card["keywords"]:
            categories['SPECIFIC'].append(card)
            print(f"Adding {card['name']} to SPECIFIC PARTNERS")
        elif "Time Lord Doctor" in card["type_line"] or "Doctor's companion" in card["oracle_text"]:
            categories['DOCTOR_COMPANION'].append(card)
            print(f"Adding {card['name']} to DOCTOR WHO PARTNERS")
        elif "Background" in card["type_line"] or "Choose a background" in card["keywords"]:
            categories['BACKGROUND'].append(card)
            print(f"Adding {card['name']} to CHOOSE A BACKGROUND PARTNERS")
        elif "Partner—Friends forever" in card["oracle_text"]:
            categories['FRIENDS_FOREVER'].append(card)
            print(f"Adding {card['name']} to FRIENDS FOREVER")
        else:
            categories['GENERIC'].append(card)
            print(f"Adding {card['name']} to GENERIC PARTNERS")

    return categories

def parse_color_identity(color_identity_first: str, color_identity_second: str) -> str:
    if color_identity_first == color_identity_second:
        return color_identity_first
    if color_identity_first in ("", "C"):
        return color_identity_second
    if color_identity_second in ("", "C"):
        return color_identity_first
    
    return "".join(set("WUBRG") & set(color_identity_first + color_identity_second))

def process_specific_partners(cards: List[AvailableCommander], partner_type: str) -> List[PartnerPair]:
    pairs = []
    unpaired = {}
    for card in cards:
        if card["name"] in unpaired:
            pairs.append({
                "first_id": card["id"],
                "second_id": unpaired[card["name"]]["id"],
                "name": f"{card['name']} | {unpaired[card['name']]['name']}",
                "color_identity": parse_color_identity(card["color_identity"], unpaired[card["name"]]["color_identity"]),
                "image_uri": [card["image_uri"], unpaired[card["name"]]["image_uri"]],
                "partner_type": partner_type
            })
            del unpaired[card["name"]]
        else:
            partner = card["oracle_text"].split("Partner with ")[-1].split("\n")[0].split(" (")[0].strip()  # Jank but works
            unpaired[partner] = card

    if len(unpaired) > 0:
        print(f"WARNING: {len(unpaired)} unpaired specific partners found:")
        for partner_name, card in unpaired.items():
            print(f" - {card['name']} (expects partner named '{partner_name}')")

    return pairs

def process_generic_partner(cards: List[AvailableCommander], partner_type: str) -> List[PartnerPair]:
    pairs = []
    already_paired = set()
    for card in cards:
        for base_card in cards:
            if base_card["id"] == card["id"] or base_card["id"] + card["id"] in already_paired or card["id"] + base_card["id"] in already_paired:
                continue
            else:
                pairs.append({
                    "first_id": card["id"],
                    "second_id": base_card["id"],
                    "name": f"{card['name']} | {base_card['name']}",
                    "color_identity": parse_color_identity(card["color_identity"], base_card["color_identity"]),
                    "image_uri": [card["image_uri"], base_card["image_uri"]],
                    "partner_type": partner_type
                })
                already_paired.add(card["id"] + base_card["id"])
                already_paired.add(base_card["id"] + card["id"])

    return pairs

def process_type_partner(cards: List[AvailableCommander], type_line: str, partner_type: str) -> List[PartnerPair]:
    available_to_pair = [card for card in cards if type_line in card["type_line"]]
    rest = [card for card in cards if card not in available_to_pair]
    pairs = []
    for card in rest:
        for base_card in available_to_pair:
            pairs.append({
                "first_id": card["id"],
                "second_id": base_card["id"],
                "name": f"{card['name']} | {base_card['name']}",
                "color_identity": parse_color_identity(card["color_identity"], base_card["color_identity"]),
                "image_uri": [card["image_uri"], base_card["image_uri"]],
                "partner_type": partner_type
            })

    return pairs

def upsert_partners(client: supabase.Client, pairs: List[PartnerPair]):
    try:
        response = client.table('partners').upsert(pairs).execute()
        print(f"Upserted {len(response.data)} partner pairs.")
    except Exception as e:
        print(f"Error upserting partners: {e}")

if __name__ == "__main__":
    client = get_client()
    commanders = get_cards(client)
    print(f"Retrieved {len(commanders)} available commanders from the database.")
    partner_cards = discard_non_partner_cards(commanders)
    print(f"Filtered to {len(partner_cards)} partner cards.")
    categorized_partners = categorize_partners(partner_cards)
    print("Creating pairs for 'Partner with' commanders...")
    partner_with = process_specific_partners(categorized_partners['SPECIFIC'], "Partner with")
    upsert_partners(client, partner_with)
    print("Creating pairs for 'Doctor Who' commanders...")
    doctor_companions = process_type_partner(categorized_partners['DOCTOR_COMPANION'], "Time Lord Doctor", "Doctor Who")
    upsert_partners(client, doctor_companions)
    print("Creating pairs for 'Background' commanders...")
    backgrounds = process_type_partner(categorized_partners['BACKGROUND'], "Background", "Background")
    upsert_partners(client, backgrounds)
    print("Creating pairs for 'Friends Forever' commanders...")
    friends_forever = process_generic_partner(categorized_partners['FRIENDS_FOREVER'], "Friends Forever")
    upsert_partners(client, friends_forever)
    print("Creating pairs for generic partners...")
    generic_partners = process_generic_partner(categorized_partners['GENERIC'], "Partner")
    upsert_partners(client, generic_partners)

    print("Partner pairs upserted successfully.")
