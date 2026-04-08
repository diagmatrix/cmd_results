"""Common utilities for database scripts."""

import logging
from os import environ as env

import supabase
from dotenv import load_dotenv


def setup() -> None:
    """Load .env and configure logging."""
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def validate_env(*var_names: str) -> dict[str, str]:
    """Validate env vars exist and return them as dict. Raise RuntimeError if missing."""
    values = {}
    missing = [name for name in var_names if not env.get(name)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variable(s): {', '.join(missing)}. "
            f"Please set them before running this script."
        )
    for name in var_names:
        values[name] = env[name]
    return values


def get_supabase_client() -> supabase.Client:
    """Create validated Supabase client."""
    env_vars = validate_env("SUPABASE_URL", "SUPABASE_KEY")
    return supabase.create_client(
        supabase_url=env_vars["SUPABASE_URL"],
        supabase_key=env_vars["SUPABASE_KEY"],
    )
