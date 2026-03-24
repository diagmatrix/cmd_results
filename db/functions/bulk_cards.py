import requests
import json
import ijson
from dotenv import load_dotenv
from os import environ as env

load_dotenv()

SCRYFALL_URL = "https://api.scryfall.com/bulk-data/default-cards"

scryfall_session = requests.Session()
scryfall_session.headers.update({"User-Agent": "cmd_results/0.1"})

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
    print(f"HTTP {response.status_code} - Upserted {len(mapped_cards)} cards")

def process_cards(session: requests.Session, url: str):
    uri = get_download_uri(session, url)
    with session.get(uri, stream=True) as response:
        response.raise_for_status()
        response.raw.decode_content = True
        
        objects = ijson.items(response.raw, "item")
        batches: dict[str, list] = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": []
        }
        items: dict[str, list] = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": []
        }
        non_legends = 0
        non_commanders = 0
        digital_cards = 0
        for item in objects:
            if item.get("digital", False):
                print(f"Skipping digital card: {item.get('name', 'Unknown')}")
                digital_cards += 1
                continue
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
                    print(f"Skipping non-commander card: {item.get('name', 'Unknown')}")
                    non_commanders += 1
            else:
                print(f"Skipping non-legendary card: {item.get('name', 'Unknown')}")
                non_legends += 1

            for card_type, card_list in items.items():
                if len(card_list) >= 1000:
                    batches[card_type].append(card_list)
                    items[card_type] = []

        for card_type, card_list in items.items():
            if len(card_list) > 0:
                batches[card_type].append(card_list)
        
        print(f"Skipped {non_legends} non-legendary cards")
        print(f"Skipped {non_commanders} non-commander cards")
        print(f"Skipped {digital_cards} digital cards")

        for batch_type in batches.keys():
            print(f"Processing {batch_type}: {len(batches[batch_type])} batches")
            for batch in batches[batch_type]:
                try:
                    upsert_batch(batch)
                except requests.exceptions.HTTPError as e:
                    print(f"Error upserting batch: {e.response.text}")
                except Exception as e:
                    print(f"Unexpected error: {e}")
        print("Finished processing cards")

if __name__ == "__main__":
    process_cards(scryfall_session, SCRYFALL_URL)
