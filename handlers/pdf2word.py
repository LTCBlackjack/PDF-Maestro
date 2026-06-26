import sys
import traceback
from pdf2docx import Converter

if len(sys.argv) < 3:
    print("Usage: python pdf2word.py <input.pdf> <output.docx>")
    sys.exit(1)

pdf_file = sys.argv[1]
docx_file = sys.argv[2]

try:
    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()
    print("SUCCESS")
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
    sys.exit(1)
