#!/usr/bin/env python3
"""Ingest Cartola API data into Supabase tables.

Tables populated:
- public.clubs
- public.positions
- public.athletes
- public.rounds
- public.market
- public.athlete_scores (optional)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urlencode

import requests


CARTOLA_MERCADO_URL = "https://api.cartola.globo.com/atletas/mercado"
CARTOLA_STATUS_URL = "https://api.cartola.globo.com/mercado/status"
CARTOLA_PONTUADOS_URL = "https://api.cartola.globo.com/atletas/pontuados"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest Cartola API data into Supabase."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write to Supabase; only print what would be sent.",
    )
    parser.add_argument(
        "--include-scores",
        action="store_true",
        help="Also ingest athlete scores into public.athlete_scores.",
    )
    parser.add_argument(
        "--round-id",
        type=int,
        default=None,
        help="Override round id used for market and scores.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Batch size for upsert operations (default: 500).",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="HTTP timeout in seconds (default: 30).",
    )
    return parser.parse_args()


def load_env_file(env_path: str) -> None:
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as file:
        for raw in file:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            os.environ.setdefault(key, value)


def required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


def optional_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def optional_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def optional_iso_datetime(value: Any) -> Optional[str]:
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).strip()
        if not text:
            return None
        text = text.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(text)
        except ValueError:
            # Fallback for "YYYY-MM-DD HH:MM:SS"
            try:
                dt = datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def chunks(items: List[Dict[str, Any]], size: int) -> Iterable[List[Dict[str, Any]]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


@dataclass
class SupabaseClient:
    base_url: str
    service_role_key: str
    timeout: int = 30

    def _headers(self, prefer: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Optional[Dict[str, str]] = None,
        payload: Any = None,
        prefer: Optional[str] = None,
    ) -> requests.Response:
        base = self.base_url.rstrip("/")
        url = f"{base}{path}"
        if query:
            url = f"{url}?{urlencode(query)}"
        response = requests.request(
            method=method,
            url=url,
            headers=self._headers(prefer=prefer),
            json=payload,
            timeout=self.timeout,
        )
        if not response.ok:
            raise RuntimeError(
                f"Supabase request failed ({response.status_code}) {method} {path}: {response.text}"
            )
        return response

    def upsert(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        *,
        on_conflict: str,
        batch_size: int,
    ) -> None:
        if not rows:
            return
        query = {"on_conflict": on_conflict}
        prefer = "resolution=merge-duplicates,return=minimal"
        for batch in chunks(rows, batch_size):
            self.request(
                "POST",
                f"/rest/v1/{table}",
                query=query,
                payload=batch,
                prefer=prefer,
            )

    def delete(self, table: str, *, filters: Dict[str, str]) -> None:
        self.request("DELETE", f"/rest/v1/{table}", query=filters, prefer="return=minimal")

    def patch(
        self,
        table: str,
        *,
        filters: Dict[str, str],
        values: Dict[str, Any],
    ) -> None:
        self.request(
            "PATCH",
            f"/rest/v1/{table}",
            query=filters,
            payload=values,
            prefer="return=minimal",
        )


def fetch_json(url: str, timeout: int) -> Dict[str, Any]:
    headers = {"User-Agent": "cartola-ingest/1.0"}
    response = requests.get(url, timeout=timeout, headers=headers)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected JSON payload from {url}")
    return data


def build_clubs(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    clubs_raw = payload.get("clubes") or {}
    rows: List[Dict[str, Any]] = []
    for key, club in clubs_raw.items():
        if not isinstance(club, dict):
            continue
        club_id = optional_int(club.get("id") or key)
        name = club.get("nome") or club.get("nome_fantasia")
        abbreviation = club.get("abreviacao")
        if club_id is None or not name or not abbreviation:
            continue
        rows.append(
            {
                "id": club_id,
                "name": str(name).strip(),
                "abbreviation": str(abbreviation).strip(),
            }
        )
    return rows


def build_positions(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    positions_raw = payload.get("posicoes") or {}
    rows: List[Dict[str, Any]] = []
    for key, position in positions_raw.items():
        if not isinstance(position, dict):
            continue
        position_id = optional_int(position.get("id") or key)
        name = position.get("nome")
        if position_id is None or not name:
            continue
        rows.append({"id": position_id, "name": str(name).strip()})
    return rows


def build_athletes(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    athletes_raw = payload.get("atletas") or []
    rows: List[Dict[str, Any]] = []
    for athlete in athletes_raw:
        if not isinstance(athlete, dict):
            continue
        athlete_id = optional_int(athlete.get("atleta_id"))
        if athlete_id is None:
            continue
        rows.append(
            {
                "id": athlete_id,
                "name": str(athlete.get("nome") or athlete.get("apelido") or "").strip(),
                "nickname": athlete.get("apelido"),
                "slug": athlete.get("slug"),
                "club_id": optional_int(athlete.get("clube_id")),
                "position_id": optional_int(athlete.get("posicao_id")),
                "status_id": optional_int(athlete.get("status_id")),
                "price": optional_float(athlete.get("preco_num")),
            }
        )
    # Filter rows missing mandatory name.
    return [row for row in rows if row["name"]]


def resolve_round_id(
    mercado_payload: Dict[str, Any],
    status_payload: Dict[str, Any],
    round_override: Optional[int],
) -> Optional[int]:
    if round_override is not None:
        return round_override
    return optional_int(
        mercado_payload.get("rodada_atual")
        or status_payload.get("rodada_atual")
        or status_payload.get("rodada")
    )


def is_market_open(status_payload: Dict[str, Any]) -> bool:
    status_mercado = status_payload.get("status_mercado")
    value = optional_int(status_mercado)
    if value is None:
        # Keep market open as a conservative default.
        return True
    return value == 1


def build_round_row(
    mercado_payload: Dict[str, Any],
    status_payload: Dict[str, Any],
    round_id: int,
) -> Dict[str, Any]:
    starts_at = (
        status_payload.get("inicio_rodada")
        or mercado_payload.get("inicio_rodada")
        or mercado_payload.get("inicio")
    )
    ends_at = (
        status_payload.get("fim_rodada")
        or status_payload.get("fim_mercado")
        or mercado_payload.get("fim_rodada")
        or mercado_payload.get("fechamento")
    )
    return {
        "id": round_id,
        "starts_at": optional_iso_datetime(starts_at),
        "ends_at": optional_iso_datetime(ends_at),
        "is_open": is_market_open(status_payload),
    }


def build_market_rows(mercado_payload: Dict[str, Any], round_id: int) -> List[Dict[str, Any]]:
    athletes_raw = mercado_payload.get("atletas") or []
    rows: List[Dict[str, Any]] = []
    for athlete in athletes_raw:
        if not isinstance(athlete, dict):
            continue
        athlete_id = optional_int(athlete.get("atleta_id"))
        price = optional_float(athlete.get("preco_num"))
        if athlete_id is None or price is None:
            continue
        rows.append(
            {
                "round_id": round_id,
                "athlete_id": athlete_id,
                "price": price,
                "price_variation": optional_float(athlete.get("variacao_num")),
                "status_id": optional_int(athlete.get("status_id")),
            }
        )
    return rows


def fetch_scores(round_id: Optional[int], timeout: int) -> Dict[str, Any]:
    if round_id is None:
        try:
            return fetch_json(CARTOLA_PONTUADOS_URL, timeout=timeout)
        except Exception:
            return {}
    try:
        return fetch_json(f"{CARTOLA_PONTUADOS_URL}/{round_id}", timeout=timeout)
    except requests.HTTPError:
        # API shape can change across seasons; fallback to current-round endpoint.
        try:
            return fetch_json(CARTOLA_PONTUADOS_URL, timeout=timeout)
        except Exception:
            return {}


def build_score_rows(
    scores_payload: Dict[str, Any], round_id: int
) -> List[Dict[str, Any]]:
    athletes = scores_payload.get("atletas") or {}
    rows: List[Dict[str, Any]] = []
    if not isinstance(athletes, dict):
        return rows

    for key, payload in athletes.items():
        if not isinstance(payload, dict):
            continue
        athlete_id = optional_int(payload.get("atleta_id") or key)
        points = optional_float(payload.get("pontuacao"))
        if athlete_id is None or points is None:
            continue
        rows.append(
            {
                "round_id": round_id,
                "athlete_id": athlete_id,
                "points": points,
            }
        )
    return rows


def print_summary(
    *,
    clubs: int,
    positions: int,
    athletes: int,
    round_id: Optional[int],
    market: int,
    scores: int,
    dry_run: bool,
) -> None:
    print("")
    print("Ingest summary")
    print("-" * 40)
    print(f"clubs:      {clubs}")
    print(f"positions:  {positions}")
    print(f"athletes:   {athletes}")
    print(f"round_id:   {round_id if round_id is not None else 'n/a'}")
    print(f"market:     {market}")
    print(f"scores:     {scores}")
    print(f"mode:       {'dry-run' if dry_run else 'write'}")


def main() -> int:
    args = parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    load_env_file(os.path.join(project_root, ".env"))

    try:
        supabase_url = (
            os.getenv("SUPABASE_URL")
            or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
            or ""
        )
        if supabase_url and "://" not in supabase_url and os.getenv("EXPO_PUBLIC_SUPABASE_URL"):
            # Fallback for malformed local SUPABASE_URL values.
            supabase_url = os.getenv("EXPO_PUBLIC_SUPABASE_URL", "")

        if not supabase_url:
            raise RuntimeError(
                "Missing Supabase URL. Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL."
            )

        service_role_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_SERVICE_KEY")
        )
        if not service_role_key:
            raise RuntimeError(
                "Missing service key. Set SUPABASE_SERVICE_ROLE_KEY to bypass RLS for ingest."
            )

        mercado = fetch_json(CARTOLA_MERCADO_URL, timeout=args.timeout)
        status = fetch_json(CARTOLA_STATUS_URL, timeout=args.timeout)

        clubs_rows = build_clubs(mercado)
        positions_rows = build_positions(mercado)
        athletes_rows = build_athletes(mercado)

        round_id = resolve_round_id(mercado, status, args.round_id)
        market_rows: List[Dict[str, Any]] = []
        round_row: Optional[Dict[str, Any]] = None

        if round_id is not None:
            round_row = build_round_row(mercado, status, round_id)
            market_rows = build_market_rows(mercado, round_id)

        score_rows: List[Dict[str, Any]] = []
        if args.include_scores and round_id is not None:
            scores_payload = fetch_scores(round_id, timeout=args.timeout)
            score_rows = build_score_rows(scores_payload, round_id)

        print_summary(
            clubs=len(clubs_rows),
            positions=len(positions_rows),
            athletes=len(athletes_rows),
            round_id=round_id,
            market=len(market_rows),
            scores=len(score_rows),
            dry_run=args.dry_run,
        )

        if args.dry_run:
            print("")
            print("Dry-run enabled. No data was written.")
            return 0

        client = SupabaseClient(
            base_url=supabase_url,
            service_role_key=service_role_key,
            timeout=args.timeout,
        )

        client.upsert("clubs", clubs_rows, on_conflict="id", batch_size=args.batch_size)
        client.upsert(
            "positions", positions_rows, on_conflict="id", batch_size=args.batch_size
        )
        client.upsert(
            "athletes", athletes_rows, on_conflict="id", batch_size=args.batch_size
        )

        if round_row is not None and round_id is not None:
            client.patch("rounds", filters={"id": f"neq.{round_id}"}, values={"is_open": False})
            client.upsert("rounds", [round_row], on_conflict="id", batch_size=1)
            client.delete("market", filters={"round_id": f"eq.{round_id}"})
            client.upsert(
                "market",
                market_rows,
                on_conflict="round_id,athlete_id",
                batch_size=args.batch_size,
            )

        if score_rows:
            client.delete("athlete_scores", filters={"round_id": f"eq.{round_id}"})
            client.upsert(
                "athlete_scores",
                score_rows,
                on_conflict="round_id,athlete_id",
                batch_size=args.batch_size,
            )

        print("")
        print("Ingest completed successfully.")
        return 0
    except requests.HTTPError as exc:
        print(f"HTTP error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
