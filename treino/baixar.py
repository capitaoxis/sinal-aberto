"""Baixa partes do MINDS-Libras (Zenodo, CC BY 4.0), com retomada e conferência de MD5.

Uso: python baixar.py PASTA_DESTINO 12 [01 02 ...]
"""
import hashlib
import sys
import urllib.request
from pathlib import Path

REGISTRO = "4322984"
MD5 = {
    "01": "ea2a99173f4b30eab863e728579c98a8",
    "02": "cc24bfd631fc683a93f9b57f25793360",
    "03": "76b1e51be29ec103b4d283ee2513c099",
    "04": "76c221189495214142f67d7bd966d5ac",
    "05": "404a6b857dad1713fb9749109dde7d0e",
    "06": "1b2f2f4c2857e9aebcd82c316d3f9181",
    "07": "661de70368f622baf5a96380e34bddf2",
    "08": "ae6ce0b80a42198dbaca0fda0893c9ef",
    "09": "19321938c7d10441b72d7bc9f732eb98",
    "10": "e5cddd1cacdec786e2997fbb809fa491",
    "11": "ebf6ddeed55c070a80f882c2b9bde18d",
    "12": "feab9e11f088e7396f451fc5e675177e",
}
BLOCO = 1024 * 1024


def md5_do_arquivo(caminho: Path) -> str:
    h = hashlib.md5()
    with caminho.open("rb") as f:
        while bloco := f.read(BLOCO):
            h.update(bloco)
    return h.hexdigest()


def baixar(numero: str, destino: Path) -> Path:
    nome = f"Sinalizador{numero}.zip"
    final = destino / nome
    if final.exists() and md5_do_arquivo(final) == MD5[numero]:
        print(f"{nome}: já baixado e conferido", flush=True)
        return final

    parcial = destino / (nome + ".parcial")
    inicio = parcial.stat().st_size if parcial.exists() else 0
    url = f"https://zenodo.org/records/{REGISTRO}/files/{nome}?download=1"
    pedido = urllib.request.Request(url, headers={"User-Agent": "libras-aberto/0.1"})
    if inicio:
        pedido.add_header("Range", f"bytes={inicio}-")

    with urllib.request.urlopen(pedido, timeout=120) as resposta:
        # Servidor que ignora o Range devolve 200: recomeça do zero.
        modo = "ab" if resposta.status == 206 else "wb"
        with parcial.open(modo) as saida:
            while bloco := resposta.read(BLOCO):
                saida.write(bloco)

    obtido = md5_do_arquivo(parcial)
    if obtido != MD5[numero]:
        parcial.unlink()
        raise RuntimeError(f"{nome}: MD5 não confere ({obtido})")
    parcial.replace(final)
    print(f"{nome}: baixado e conferido", flush=True)
    return final


def main() -> None:
    destino = Path(sys.argv[1])
    destino.mkdir(parents=True, exist_ok=True)
    for numero in sys.argv[2:]:
        baixar(numero, destino)


if __name__ == "__main__":
    main()
