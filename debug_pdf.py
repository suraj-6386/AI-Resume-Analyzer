import sys, traceback
sys.path.insert(0, r'c:\Users\sg022\OneDrive\Desktop\Python Project')

# Force reload to bypass any import cache
import importlib
import core.pdf_builder as pb
importlib.reload(pb)

try:
    from core.pdf_builder import generate_pdf
    with open(r'c:\Users\sg022\OneDrive\Desktop\Python Project\sample_resume.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    buf = generate_pdf(text)
    data = buf.read()
    print('SUCCESS', len(data), 'bytes')
    print('Valid PDF:', data[:4] == b'%PDF')
except Exception as e:
    with open(r'c:\Users\sg022\OneDrive\Desktop\Python Project\debug_error.txt', 'w') as out:
        traceback.print_exc(file=out)
    traceback.print_exc()
    print('FAILED:', type(e).__name__, str(e))
