"""Generate partner pairs for Magic: The Gathering commanders."""

import itertools
import logging
from typing import List, TypedDict

import supabase

from common import setup, get_supabase_client

setup()


class AvailableCommander(TypedDict):
    """Commander card from available_commanders table."""

    id: str
    name: str
    set_code: str
    color_identity: str
    image_uri: str
    oracle_text: str
    keywords: List[str]
    type_line: str


class PartnerCategories(TypedDict):
    """Categories of partner cards."""

    GENERIC: List[AvailableCommander]
    FRIENDS_FOREVER: List[AvailableCommander]
    BACKGROUND: List[AvailableCommander]
    DOCTOR_COMPANION: List[AvailableCommander]
    SPECIFIC: List[AvailableCommander]


class PartnerPair(TypedDict):
    """Partner pair record."""

    first_id: str
    second_id: str
    name: str
    color_identity: str
    image_uri: List[str]
    partner_type: str


def get_cards(client: supabase.Client) -> List[AvailableCommander]:
    """Fetch all available commanders from database in 1000-card batches."""
    cards = []
    current = -1
    fetch_more = True
    while fetch_more:
        logging.info("Fetching cards from %d to %d...", current + 2, current + 1001)
        response = (
            client.from_("available_commanders")
            .select("*")
            .range(current + 1, current + 1000)
            .execute()
        )
        total = response.count or len(response.data)
        if total == 0:
            logging.info("NO CARDS FOUND, STOPPING.")
            fetch_more = False
        else:
            cards.extend(response.data)
            logging.info("RETRIEVED %d CARDS.", total)

            current += 1000
            fetch_more = total == 1000

    return cards


def discard_non_partner_cards(
    cards: List[AvailableCommander],
) -> List[AvailableCommander]:
    """Filter cards to only partner-eligible ones."""
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


def categorize_partners(
    partner_cards: List[AvailableCommander],
) -> PartnerCategories:
    """Categorize partner cards by partner type."""
    categories: PartnerCategories = {
        "GENERIC": [],
        "FRIENDS_FOREVER": [],
        "BACKGROUND": [],
        "DOCTOR_COMPANION": [],
        "SPECIFIC": [],
    }

    for card in partner_cards:
        if "Partner with" in card["keywords"]:
            categories["SPECIFIC"].append(card)
            logging.info("Adding %s to SPECIFIC PARTNERS", card["name"])
        elif "Time Lord Doctor" in card["type_line"] or "Doctor's companion" in (
            card.get("oracle_text") or ""
        ):
            categories["DOCTOR_COMPANION"].append(card)
            logging.info("Adding %s to DOCTOR WHO PARTNERS", card["name"])
        elif (
            "Background" in card["type_line"]
            or "Choose a background" in card["keywords"]
        ):
            categories["BACKGROUND"].append(card)
            logging.info("Adding %s to CHOOSE A BACKGROUND PARTNERS", card["name"])
        elif "Partner—Friends forever" in (card.get("oracle_text") or ""):
            categories["FRIENDS_FOREVER"].append(card)
            logging.info("Adding %s to FRIENDS FOREVER", card["name"])
        else:
            categories["GENERIC"].append(card)
            logging.info("Adding %s to GENERIC PARTNERS", card["name"])

    return categories


def parse_color_identity(color_identity_first: str, color_identity_second: str) -> str:
    """Merge two color identities."""
    if color_identity_first == color_identity_second:
        return color_identity_first
    if color_identity_first in ("", "C"):
        return color_identity_second
    if color_identity_second in ("", "C"):
        return color_identity_first

    combined = set(color_identity_first + color_identity_second)
    return "".join(c for c in "WUBRG" if c in combined)


def process_specific_partners(
    cards: List[AvailableCommander], partner_type: str
) -> List[PartnerPair]:
    """Create partner pairs for 'Partner with' specific commanders."""
    pairs = []
    unpaired = {}
    for card in cards:
        if card["name"] in unpaired:
            partner = unpaired[card["name"]]
            # Canonicalize order by sorting UUIDs
            if card["id"] < partner["id"]:
                first, second = card, partner
            else:
                first, second = partner, card
            pairs.append(
                {
                    "first_id": first["id"],
                    "second_id": second["id"],
                    "name": f"{first['name']} | {second['name']}",
                    "color_identity": parse_color_identity(
                        first["color_identity"], second["color_identity"]
                    ),
                    "image_uri": [first["image_uri"], second["image_uri"]],
                    "partner_type": partner_type,
                }
            )
            del unpaired[card["name"]]
        else:
            partner_text = card["oracle_text"].split("Partner with ")[-1]
            partner = partner_text.split("\n")[0].split(" (")[0].strip()
            unpaired[partner] = card

    if len(unpaired) > 0:
        logging.warning("%d unpaired specific partners found:", len(unpaired))
        for partner_name, card in unpaired.items():
            logging.warning(
                " - %s (expects partner named '%s')", card["name"], partner_name
            )

    return pairs


def process_generic_partner(
    cards: List[AvailableCommander], partner_type: str
) -> List[PartnerPair]:
    """Create all possible partner pairs from cards."""
    pairs = []
    for first, second in itertools.combinations(cards, 2):
        # Canonicalize order by sorting UUIDs
        if first["id"] > second["id"]:
            first, second = second, first
        pairs.append(
            {
                "first_id": first["id"],
                "second_id": second["id"],
                "name": f"{first['name']} | {second['name']}",
                "color_identity": parse_color_identity(
                    first["color_identity"], second["color_identity"]
                ),
                "image_uri": [first["image_uri"], second["image_uri"]],
                "partner_type": partner_type,
            }
        )

    return pairs


def process_type_partner(
    cards: List[AvailableCommander], type_line: str, partner_type: str
) -> List[PartnerPair]:
    """Create partner pairs between type_line cards and others."""
    available_to_pair = [card for card in cards if type_line in card["type_line"]]
    rest = [card for card in cards if card not in available_to_pair]
    pairs = []
    for card in rest:
        for base_card in available_to_pair:
            # Canonicalize order by sorting UUIDs
            if card["id"] < base_card["id"]:
                first, second = card, base_card
            else:
                first, second = base_card, card
            pairs.append(
                {
                    "first_id": first["id"],
                    "second_id": second["id"],
                    "name": f"{first['name']} | {second['name']}",
                    "color_identity": parse_color_identity(
                        first["color_identity"], second["color_identity"]
                    ),
                    "image_uri": [first["image_uri"], second["image_uri"]],
                    "partner_type": partner_type,
                }
            )

    return pairs


def upsert_partners(client: supabase.Client, pairs: List[PartnerPair]) -> None:
    """Upsert partner pairs to database."""
    try:
        response = client.table("partners").upsert(pairs).execute()
        logging.info("Upserted %d partner pairs.", len(response.data))
    except Exception as exc:  # pylint: disable=broad-exception-caught
        logging.error("Error upserting partners: %s", exc)


if __name__ == "__main__":
    supabase_client = get_supabase_client()
    all_commanders = get_cards(supabase_client)
    logging.info(
        "Retrieved %d available commanders from database.", len(all_commanders)
    )
    non_partner_filtered = discard_non_partner_cards(all_commanders)
    logging.info("Filtered to %d partner cards.", len(non_partner_filtered))
    categorized = categorize_partners(non_partner_filtered)
    logging.info("Cleaning up the partner table...")
    supabase_client.table("partners").delete().neq("name", "All").execute()
    logging.info("Creating pairs for 'Partner with' commanders...")
    partner_with_pairs = process_specific_partners(
        categorized["SPECIFIC"], "Partner with"
    )
    upsert_partners(supabase_client, partner_with_pairs)
    logging.info("Creating pairs for 'Doctor Who' commanders...")
    doctor_companions = process_type_partner(
        categorized["DOCTOR_COMPANION"], "Time Lord Doctor", "Doctor Who"
    )
    upsert_partners(supabase_client, doctor_companions)
    logging.info("Creating pairs for 'Background' commanders...")
    backgrounds = process_type_partner(
        categorized["BACKGROUND"], "Background", "Background"
    )
    upsert_partners(supabase_client, backgrounds)
    logging.info("Creating pairs for 'Friends Forever' commanders...")
    friends_forever = process_generic_partner(
        categorized["FRIENDS_FOREVER"], "Friends Forever"
    )
    upsert_partners(supabase_client, friends_forever)
    logging.info("Creating pairs for generic partners...")
    generic_partners = process_generic_partner(categorized["GENERIC"], "Partner")
    upsert_partners(supabase_client, generic_partners)

    logging.info("Partner pairs upserted successfully.")
