# Patitas

Patitas is a responsive pet adoption demo with a catalog you can filter by species and a request form backed by a Node.js API. The interface is in Spanish (Argentina), and the pet profiles are sample data.

## Features

- Browse dogs, cats, and rabbits and filter the catalog by species.
- Open an adoption request form for a specific pet.
- Validate contact information on the server and save accepted requests locally.

## Run locally

Requires Node.js 22 or newer. There are no packages to install.

```sh
node server.mjs
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Set the `PORT` environment variable if you need a different port. The server listens on loopback. Photos and fonts are loaded from Unsplash and Google Fonts.

## API

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/mascotas` | Returns the sample pet catalog from `pets.json`. |
| POST | `/api/solicitudes` | Accepts JSON with `petId`, `name`, and `email`. Returns HTTP 201 and a request ID on success. |

Accepted requests are appended to `solicitudes.jsonl`, which is excluded from Git. This repository contains the source for a locally run demo.

## Stack

HTML, CSS, vanilla JavaScript, and Node.js using its built-in HTTP and file system modules.
