"""Gera os vídeos leves do site a partir de um zip do MINDS-Libras.

Uso: python recortar_videos.py ZIP PASTA_SAIDA
"""
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

TOMADAS = (1, 2, 3)
BAIXA_PRIORIDADE = getattr(subprocess, "BELOW_NORMAL_PRIORITY_CLASS", 0)
PADRAO = re.compile(r"/\d+-\d{2}([A-Za-z]+)_(\d)RGB\.mp4$")


def converter(origem: Path, destino: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(origem),
            # Aproxima a pessoa: em 1920x1080 sobra fundo dos lados e abaixo da cintura.
            "-an", "-vf", "crop=1280:720:320:60,scale=640:360,fps=30",
            "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
            "-threads", "2", "-movflags", "+faststart", str(destino),
        ],
        check=True,
        creationflags=BAIXA_PRIORIDADE,
    )


def main() -> None:
    arquivo_zip, saida = sys.argv[1], Path(sys.argv[2])
    saida.mkdir(parents=True, exist_ok=True)
    feitos = 0
    with zipfile.ZipFile(arquivo_zip) as z, tempfile.TemporaryDirectory() as tmp:
        for nome in z.namelist():
            achado = PADRAO.search(nome)
            if not achado or int(achado[2]) not in TOMADAS:
                continue
            sinal, tomada = achado[1].lower(), achado[2]
            origem = Path(z.extract(nome, tmp))
            converter(origem, saida / f"{sinal}-{tomada}.mp4")
            origem.unlink()
            feitos += 1
    print(f"vídeos gerados: {feitos}")


if __name__ == "__main__":
    main()
