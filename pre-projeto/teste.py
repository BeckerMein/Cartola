import os
import requests
import pandas as pd

URL = "https://api.cartola.globo.com/atletas/mercado"

def main():
    os.makedirs("out", exist_ok=True)

    r = requests.get(URL, timeout=30)
    r.raise_for_status()
    data = r.json()

    atletas = data.get("atletas", [])
    clubes = data.get("clubes", {})
    posicoes = data.get("posicoes", {})
    status = data.get("status", {})

    linhas = []

    for a in atletas:
        clube_id = str(a.get("clube_id")) if a.get("clube_id") else None
        pos_id = str(a.get("posicao_id")) if a.get("posicao_id") else None
        status_id = str(a.get("status_id")) if a.get("status_id") else None

        linhas.append({
            "atleta_id": a.get("atleta_id"),
            "nome": a.get("nome"),
            "apelido": a.get("apelido"),
            "slug": a.get("slug"),
            "clube_id": a.get("clube_id"),
            "clube_nome": (clubes.get(clube_id) or {}).get("nome"),
            "clube_abreviacao": (clubes.get(clube_id) or {}).get("abreviacao"),
            "posicao_id": a.get("posicao_id"),
            "posicao_nome": (posicoes.get(pos_id) or {}).get("nome"),
            "status_id": a.get("status_id"),
            "status_nome": (status.get(status_id) or {}).get("nome"),
            "preco_num": a.get("preco_num"),
            "variacao_num": a.get("variacao_num"),
            "media_num": a.get("media_num"),
            "jogos_num": a.get("jogos_num"),
            "pontos_num": a.get("pontos_num"),
        })

    df = pd.DataFrame(linhas)

    caminho_saida = "out/jogadores_cartola_2026.csv"
    df.to_csv(caminho_saida, index=False, encoding="utf-8-sig", sep=";")

    print(f"✅ CSV gerado com sucesso: {caminho_saida}")
    print(f"📌 Total de jogadores: {len(df)}")

if __name__ == "__main__":
    main()
