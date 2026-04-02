import requests
import ijson
from dotenv import load_dotenv
from typing import Dict, List, Optional, TypedDict
from os import environ as env
import argparse

load_dotenv()

SCRYFALL_URL = "https://api.scryfall.com/bulk-data/default-cards"

arg_parser = argparse.ArgumentParser(description="Bulk upsert cards from Scryfall")
arg_parser.add_argument("--batch-size", "-s", type=int, default=None, help="Size of each batch to process")
arg_parser.add_argument("--include", "-i", nargs="*", default=[], help="Card types to include (e.g. Planeswalker, Creature, Vehicle, Spacecraft, Background)")

class CardBatches(TypedDict):
    Planeswalker: List[List[Dict]]
    Creature: List[List[Dict]]
    Vehicle: List[List[Dict]]
    Spacecraft: List[List[Dict]]
    Background: List[List[Dict]]

def get_download_uri(session: requests.Session, url: str) -> str:
    response = session.get(url)
    response.raise_for_status()
    data = response.json()

    if "download_uri" not in data:
        raise ValueError("download_uri not found in response")
    return data["download_uri"]

def upsert_batch(cards: list[dict]):
    url = f"{env.get('SUPABASE_URL')}/rest/v1/cards?on_conflict=id"
    
    mapped_cards = []
    for card in cards:
        card["cmc"] = str(card.get("cmc", 0))  # Ugly, but fixes JSON serialization error
        mapped_cards.append({
            "id": card["id"],
            "name": card.get("name", "Unknown"),
            "set_code": card.get("set", "Unknown"),
            "collector_number": card.get("collector_number", "Unknown"),
            "rarity": card.get("rarity", "Unknown"),
            "cmc": card["cmc"],
            "type_line": card.get("type_line", "Unknown"),
            "released_at": card.get("released_at", "1970-01-01"),
            "mana_cost": card.get("mana_cost"),
            "color_identity": card.get("color_identity"),
            "colors": card.get("colors"),
            "image_uris": card.get("image_uris"),
            "raw_card": card
        })
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "apikey": env.get('SUPABASE_KEY'),
            "Authorization": f"Bearer {env.get('SUPABASE_KEY')}",
            "Prefer": "resolution=merge-duplicates"
        },
        json=mapped_cards
    )
    response.raise_for_status()
    action_message = 'UPSERTED' if response.status_code == 201 else 'NO CHANGES'
    print(f"{action_message} (HTTP {response.status_code}) - Sent {len(mapped_cards)} cards")

def process_cards(session: requests.Session, url: str, batch_size: Optional[int] = None) -> CardBatches:
    uri = get_download_uri(session, url)
    with session.get(uri, stream=True) as response:
        print(f"Downloading card data from Scryfall...")
        response.raise_for_status()
        response.raw.decode_content = True
        
        objects = ijson.items(response.raw, "item")
        batches: CardBatches = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": [],
            "Background": []
        }
        items: dict[str, list] = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": [],
            "Background": []
        }
        non_legends = 0
        non_commanders = 0
        digital_cards = 0
        for item in objects:
            if item.get("digital", False):
                digital_cards += 1
                continue
            if "Background" in item.get("type_line", ""):
                items["Background"].append(item)
            if "Planeswalker" in item.get("type_line", ""):
                items["Planeswalker"].append(item)
            elif "Legendary" in item.get("type_line", ""):
                if "Creature" in item.get("type_line", ""):
                    items["Creature"].append(item)
                elif "Vehicle" in item.get("type_line", ""):
                    items["Vehicle"].append(item)
                elif "Spacecraft" in item.get("type_line", ""):
                    items["Spacecraft"].append(item)
                else:
                    non_commanders += 1
            else:
                non_legends += 1

            for card_type, card_list in items.items():
                if batch_size and len(card_list) >= batch_size:
                    batches[card_type].append(card_list)
                    items[card_type] = []

        for card_type, card_list in items.items():
            if len(card_list) > 0:
                batches[card_type].append(card_list)
        
        print(f"Skipped {non_legends} non-legendary cards")
        print(f"Skipped {non_commanders} non-commander cards")
        print(f"Skipped {digital_cards} digital cards")

        return batches

def upsert_cards(session: requests.Session, cards: CardBatches, include_types: Optional[List[str]] = None):
    for batch_type in cards.keys():
        if include_types and batch_type not in include_types:
            continue
        print(f"Processing {batch_type}: {len(cards[batch_type])} batches of size {len(cards[batch_type][0]) if cards[batch_type] else 0}")
        for batch in cards[batch_type]:
            try:
                upsert_batch(batch)
            except requests.exceptions.HTTPError as e:
                print(f"Error upserting batch: {e.response.text}")
            except Exception as e:
                print(f"Unexpected error: {e}")
    print("Finished processing cards")

if __name__ == "__main__":
    args = arg_parser.parse_args()
    print(f"Starting bulk card upsert with batch size {args.batch_size if args.batch_size else 'All'} and include types: {args.include if args.include else 'All'}")
    scryfall_session = requests.Session()
    scryfall_session.headers.update({"User-Agent": "cmd_results/0.1"})

    cards_to_process = process_cards(scryfall_session, SCRYFALL_URL, batch_size=args.batch_size)
    
    upsert_cards(scryfall_session, cards_to_process, include_types=args.include)
