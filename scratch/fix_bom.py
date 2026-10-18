import os

# Remove BOM from .env.local and .env.test
def remove_bom(file_path):
    if not os.path.exists(file_path): return
    with open(file_path, 'rb') as f:
        content = f.read()
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]
        with open(file_path, 'wb') as f:
            f.write(content)
            print(f"Removed BOM from {file_path}")

remove_bom('.env.local')
remove_bom('.env.test')

