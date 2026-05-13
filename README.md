# Memories

Static frontend for a premium professional memories feed. It uses only HTML, CSS, Bootstrap, and vanilla JavaScript.

## Run locally

```bash
npm run serve
```

Then open `http://localhost:8080`. A static server is required because browsers block `fetch()` for local JSON files opened directly with `file://`.

## Data contract

Colleagues can add or edit data in `data/profiles.json` through PRs.

```json
{
  "generation": "Generation CH65",
  "profiles": [
    {
      "username": "anaid",
      "name": "Anaid",
      "role": "QA Engineer",
      "profilePicture": "assets/avatars/anaid.png",
      "memories": [
        {
          "id": "anaid-from-antonio-01",
          "author": "antonio-m",
          "body": "Memory text up to 1000 characters.",
          "image": "https://example.com/image.webp",
          "heartCount": 30,
          "createdAt": "2026-05-09T19:15:00.000Z",
          "comments": [
            {
              "profile": "sam",
              "body": "Comment text."
            }
          ]
        }
      ]
    }
  ]
}
```

Notes:

- `username` values are stable IDs.
- A memory belongs to the recipient profile that contains it.
- `author` and comment `profile` must match an existing `username`.
- `body` is limited to 1000 characters.
- Production updates happen through JSON PRs.

## Checks

```bash
npm test
```