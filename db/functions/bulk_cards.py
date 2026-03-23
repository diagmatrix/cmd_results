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
    
    mapped_cards = [
        {
            "id": card["id"],
            "name": card.get("name", "Unknown"),
            "set_code": card.get("set", "Unknown"),
            "collector_number": card.get("collector_number", "Unknown"),
            "rarity": card.get("rarity", "Unknown"),
            "cmc": str(card.get("cmc", 0)),
            "type_line": card.get("type_line", "Unknown"),
            "mana_cost": card.get("mana_cost"),
            "color_identity": card.get("color_identity"),
            "colors": card.get("colors"),
            "image_uris": card.get("image_uris"),
            "raw_card": json.dumps(card, default=str)
        }
        for card in cards
    ]

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
    print(f"{response.status_code}: Upserted {len(mapped_cards)} cards")

def process_cards(session: requests.Session, url: str):
    uri = get_download_uri(session, url)
    with session.get(uri, stream=True) as response:
        response.raise_for_status()
        response.raw.decode_content = True
        
        objects = ijson.items(response.raw, "item")
        items = []
        for item in objects:
            if "Legendary" not in item.get("type_line", ""):
                print(f"Skipping non-legendary card: {item.get('name', 'Unknown')}")
            else:
                items.append(item)
            if len(items) >= 1000:
                try:
                    upsert_batch(items)
                except requests.exceptions.HTTPError as e:
                    print(f"Error upserting batch: {e.response.text}")
                except Exception as e:
                    print(f"Unexpected error: {e}")
                
                items = []
        
        if items:
            try:
                upsert_batch(items)
            except requests.exceptions.HTTPError as e:
                print(f"Error upserting batch: {e.response.text}")
            except Exception as e:
                print(f"Unexpected error: {e}")
    
if __name__ == "__main__":
    process_cards(scryfall_session, SCRYFALL_URL)
