"""Bulk upsert cards from Scryfall to Supabase."""

import argparse
import logging
from typing import Dict, List, Optional, TypedDict

import ijson
import requests

from common import setup, validate_env

setup()

SCRYFALL_URL = "https://api.scryfall.com/bulk-data/default-cards"
TIMEOUT_SECONDS = 60

arg_parser = argparse.ArgumentParser(description="Bulk upsert cards from Scryfall")
arg_parser.add_argument(
    "--batch-size",
    "-s",
    type=int,
    default=1000,
    help="Size of each batch to process",
)
arg_parser.add_argument(
    "--include",
    "-i",
    nargs="*",
    default=[],
    help=(
        "Card types to include (e.g. Planeswalker, Creature, "
        "Vehicle, Spacecraft, Background)"
    ),
)


class CardBatches(TypedDict):
    """Batches of cards by type."""

    Planeswalker: List[List[Dict]]
    Creature: List[List[Dict]]
    Vehicle: List[List[Dict]]
    Spacecraft: List[List[Dict]]
    Background: List[List[Dict]]


def get_download_uri(session: requests.Session, url: str) -> str:
    """Fetch Scryfall download URI from bulk data endpoint."""
    response = session.get(url, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()

    if "download_uri" not in data:
        raise ValueError("download_uri not found in response")
    return data["download_uri"]


def upsert_batch(cards: list[dict], supabase_url: str, supabase_key: str) -> None:
    """Map and upsert card batch to Supabase."""
    url = f"{supabase_url}/rest/v1/cards?on_conflict=id"

    mapped_cards = []
    for card in cards:
        card["cmc"] = str(card.get("cmc", 0))  # Ugly, but fixes JSON serialization
        image_uris = card.get("image_uris")
        if not image_uris:
            if "//" in card.get("name", ""):  # Double-faced card
                front_name = card["name"].split("//")[0].strip()
                for face in card.get("card_faces", []):
                    if face.get("name", "") == front_name:
                        image_uris = face.get("image_uris")
                        break

        mapped_cards.append(
            {
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
                "image_uris": image_uris,
                "raw_card": card,
            }
        )
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Prefer": "resolution=merge-duplicates",
        },
        json=mapped_cards,
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    action_message = "INSERTED + UPDATED" if response.status_code == 201 else "UPDATED"
    logging.info(
        "%s (HTTP %d) - Sent %d cards",
        action_message,
        response.status_code,
        len(mapped_cards),
    )


def categorize_card(
    type_line: str, include_types: Optional[List[str]] = None
) -> Optional[str]:
    """Categorize card by type."""
    typelines = {
        "Background": {
            "return": "Background",
            "check": lambda tl: "Background" in tl,
        },
        "Planeswalker": {
            "return": "Planeswalker",
            "check": lambda tl: "Planeswalker" in tl,
        },
        "Creature": {
            "return": "Creature",
            "check": lambda tl: "Legendary Creature" in tl,
        },
        "Vehicle": {
            "return": "Vehicle",
            "check": lambda tl: "Legendary" in tl and "Vehicle" in tl,
        },
        "Spacecraft": {
            "return": "Spacecraft",
            "check": lambda tl: "Legendary" in tl and "Spacecraft" in tl,
        },
    }

    type_lines_to_check = include_types if include_types else typelines.keys()
    for key in type_lines_to_check:
        if key in typelines and typelines[key]["check"](type_line):
            return typelines[key]["return"]
    return None


def process_cards(
    session: requests.Session,
    url: str,
    batch_size: Optional[int] = None,
    include_types: Optional[List[str]] = None,
) -> CardBatches:
    """Download and batch cards from Scryfall by type."""
    uri = get_download_uri(session, url)
    with session.get(uri, stream=True, timeout=TIMEOUT_SECONDS) as response:
        logging.info("Downloading card data from Scryfall...")
        response.raise_for_status()
        response.raw.decode_content = True

        objects = ijson.items(response.raw, "item")
        batches: CardBatches = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": [],
            "Background": [],
        }
        items: dict[str, list] = {
            "Planeswalker": [],
            "Creature": [],
            "Vehicle": [],
            "Spacecraft": [],
            "Background": [],
        }
        non_commanders = 0
        digital_cards = 0
        for item in objects:
            if item.get("digital", False):
                digital_cards += 1
                continue

            card_type = categorize_card(item.get("type_line", ""), include_types)
            if not card_type:
                non_commanders += 1
                continue
            items[card_type].append(item)

            for card_type, card_list in items.items():
                if batch_size and len(card_list) >= batch_size:
                    batches[card_type].append(card_list)
                    items[card_type] = []

        for card_type, card_list in items.items():
            if len(card_list) > 0:
                batches[card_type].append(card_list)

        logging.info("Skipped %d non-commander cards", non_commanders)
        logging.info("Skipped %d digital cards", digital_cards)

        return batches


def upsert_cards(
    cards: CardBatches,
    supabase_url: str,
    supabase_key: str,
    include_types: Optional[List[str]] = None,
) -> None:
    """Upsert card batches by type."""
    for batch_type in cards.keys():
        if include_types and batch_type not in include_types:
            continue
        batch_count = len(cards[batch_type])
        logging.info("Processing %s: %d batches", batch_type, batch_count)
        for i, batch in enumerate(cards[batch_type]):
            try:
                logging.info(
                    "Upserting batch %d/%d (%s cards)", i + 1, batch_count, len(batch)
                )
                upsert_batch(batch, supabase_url, supabase_key)
            except requests.exceptions.HTTPError as exc:
                logging.error("Error upserting batch: %s", exc.response.text)
            except Exception as exc:  # pylint: disable=broad-exception-caught
                logging.error("Unexpected error: %s", exc)
    logging.info("Finished processing cards")


if __name__ == "__main__":
    args = arg_parser.parse_args()
    env_vars = validate_env("SUPABASE_URL", "SUPABASE_KEY")

    logging.info(
        "Starting bulk card upsert with batch size %s and include types: %s",
        args.batch_size if args.batch_size else "All",
        args.include if args.include else "All",
    )
    scryfall_session = requests.Session()
    scryfall_session.headers.update({"User-Agent": "cmd_results/0.1"})

    cards_to_process = process_cards(
        scryfall_session, SCRYFALL_URL, batch_size=args.batch_size
    )

    upsert_cards(
        cards_to_process,
        env_vars["SUPABASE_URL"],
        env_vars["SUPABASE_KEY"],
        args.include,
    )
