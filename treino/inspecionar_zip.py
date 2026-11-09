"""Resume a estrutura de um zip do MINDS-Libras sem extrair nada."""
import collections
import sys
import zipfile
from pathlib import PurePosixPath

with zipfile.ZipFile(sys.argv[1]) as z:
    infos = z.infolist()

print("arquivos:", len(infos))
print("extensões:", collections.Counter(PurePosixPath(i.filename).suffix.lower() for i in infos))
print("pastas:", sorted({str(PurePosixPath(i.filename).parent) for i in infos})[:40])
print("exemplos:")
for info in infos[:25]:
    print(f"  {info.filename}  ({info.file_size / 1e6:.1f} MB)")
