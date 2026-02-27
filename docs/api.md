GET /
Accept: application/json
Response: 303 See /productions

GET /productions
Accept: application/json
Response: 200 OK
```json
{
	"status": "succes",
	"data": [
	{
		"id": "0000",
		"title": "programma0",
		"supertitle": "programma0.0",
		"artist": "artiest",
		"startdate": "xxxxxxx",
		"enddate": "xxxxxxx",
		"description": "Lorem ipsum...",
		"thumbnail": "image.png",
		"tags": ["tag1", "tag2"]
	},
	{
		"id": "0001",
		"title": "programma1",
		"supertitle": "programma1.0",
		"artist": "artiest2",
		"startdate": "xxxxxxx",
		"enddate": "xxxxxxx",
		"description": "Lorem ipsum...",
		"thumbnail": "image.png",
		"tags": ["tag1", "tag2"]
	},
	...
	]
}
```

GET /productions/{id}
Accept: application/json
Response: 200 OK
```json
{
	"status": "succes",
	"data": {
		"title": "programma0",
		"supertitle": "programma0.0",
		"artist": "artiest",
        "tagline": "tagline",
        "teaser": "teaser",
		"description": "Lorem ipsum...",
        "info": "info",
		"thumbnail": "image.png",
		"events": [
		{
			"location": {"address": "Gent, ergens", "name": "iets"},
			"starts_at": "xxxxxxx",
			"ends_at": "xxxxxxx",
			"prices": [
				{ "label": "minderjarigen", "price": "€10" },
				{ "label": "18+", "price": "€15" }
			]
		}
        ],
		"media_gallery": [
			"image2.png",
			"video.mp4"
		],
		"tags": ["tag1", "tag2"],
        "genres": ["genre1", "genre2"]
	}
}
```

POST /login
Content-Type: application/json
Accept: application/json
```json
{
	"email": "foo@bar.com",
	"password": "supersecure"
}
```
Response 200 OK
Set-Cookie:
	JWT=xxxxxxxxxxx;
	HttpOnly;
	Secure;
	SameSite=Strict;
	Path=/;
	Max-Age=604800
```json
{ "status": "ok" }
```
// Bij verkeerde invoer:
Response 401 Unauthorized
```json
{ "error": "Invalid credentials" }
```

// Alles hierna geeft 401 Unauthorized terug als er geen correcte cookie is meegegeven

PATCH /productions
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Tags lijkt me het enige dat je in bulk zou willen aanpassen
```json
{
	"ids": ["0000", "00001"],
	"update": {
		"tags": ["tag1", "tag2", ...]
	}
}
```
Response: 200 OK
```json
{ "status": "ok" }
```

PATCH /productions/{id}
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Hier mag alles aangepast worden
```json
{
    "title": "programma0",
    "supertitle": "programma0.0",
    "artist": "artiest",
    "tagline": "tagline",
    "teaser": "teaser",
    "description": "Lorem ipsum...",
    "info": "info",
    "thumbnail": "image.png",
    "events": [
    {
        "location": {"address": "Gent, ergens", "name": "iets"},
        "starts_at": "xxxxxxx",
        "ends_at": "xxxxxxx",
        "prices": [
            { "label": "minderjarigen", "price": "€10" },
            { "label": "18+", "price": "€15" }
        ]
    }
    ],
    "media_gallery": [
        "image2.png",
        "video.mp4"
    ],
    "tags": ["tag1", "tag2"],
    "genres": ["genre1", "genre2"]
}
```
Response: 200 OK
```json
{ "status": "ok" }
```

POST /productions
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Nieuwe productie aanmaken.
```json
{
    "title": "programma0",
    "supertitle": "programma0.0",
    "artist": "artiest",
    "tagline": "tagline",
    "teaser": "teaser",
    "description": "Lorem ipsum...",
    "info": "info",
    "thumbnail": "image.png",
    "events": [
    {
        "location": {"address": "Gent, ergens", "name": "iets"},
        "starts_at": "xxxxxxx",
        "ends_at": "xxxxxxx",
        "prices": [
            { "label": "minderjarigen", "price": "€10" },
            { "label": "18+", "price": "€15" }
        ]
    }
    ],
    "media_gallery": [
        "image2.png",
        "video.mp4"
    ],
    "tags": ["tag1", "tag2"],
    "genres": ["genre1", "genre2"]
}
```
Response: 200 OK
```json
{
    "status": "ok",
    "id": "0003"
}
```

DELETE /productions/{id}
Cookie: JWT=xxxxxxxxxxxx
Accept: application/json
Response: 200 OK
```json
{ "status": "succes" }
```

PATCH /productions/{id}/event/{id}
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Hier mag alles aangepast worden
```json
{
    "location": {"address": "Gent, ergens", "name": "iets"},
    "starts_at": "xxxxxxx",
    "ends_at": "xxxxxxx",
    "prices": [
        { "label": "minderjarigen", "price": "€10" },
        { "label": "18+", "price": "€15" }
    ]
}
```
Response: 200 OK
```json
{ "status": "ok" }
```

POST /productions/{id}/event/
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Hier moet alles ingevuld worden
```json
{
    "location": {"address": "Gent, ergens", "name": "iets"},
    "starts_at": "xxxxxxx",
    "ends_at": "xxxxxxx",
    "prices": [
        { "label": "minderjarigen", "price": "€10" },
        { "label": "18+", "price": "€15" }
    ]
}
```
Response: 200 OK
```json
{
    "status": "ok"
    "id": "0004"
}
```

DELETE /productions/{id}/events/{id}
Cookie: JWT=xxxxxxxxxxxx
Accept: application/json
Response: 200 OK
```json
{ "status": "ok" }
```

POST /tags
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Nieuwe productie aanmaken.
```json
{ "name": "tagX" }
```
Response: 200 OK
```json
{
    "status": "ok",
    "id": "0003"
}
```

DELETE /tags/{id}
Cookie: JWT=xxxxxxxxxxxx
Accept: application/json
Response: 200 OK
```json
{ "status": "ok" }
```
