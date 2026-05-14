import os
from PIL import Image

source_dir = r'c:\Users\PC\Documents\GENERATION\Memories\assets\avatars\raw'
dest_dir = r'c:\Users\PC\Documents\GENERATION\Memories\assets\avatars'

files = os.listdir(source_dir)

for f in files:
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        source_path = os.path.join(source_dir, f)
        name, ext = os.path.splitext(f)
        dest_path = os.path.join(dest_dir, name + '.png')
        
        print(f"Converting {f} to {name}.png...")
        try:
            with Image.open(source_path) as img:
                img.save(dest_path, 'PNG')
            print(f"Saved to {dest_path}")
        except Exception as e:
            print(f"Error converting {f}: {e}")
