import json

with open('data/profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Mapping of usernames to their new avatar filenames (without extension, they are all png now)
new_avatars = {
    "marina-a": "marina.png",
    "paula-v": "paula.png",
    "roberto-h": "roberto.png",
    "valeria-t": "valeria.png"
}

for profile in data['profiles']:
    u = profile['username']
    if u in new_avatars:
        profile['profilePicture'] = f"assets/avatars/{new_avatars[u]}"
        print(f"Updated avatar for {u} to {profile['profilePicture']}")

with open('data/profiles.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
