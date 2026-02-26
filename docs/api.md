GET /
Accept: application/json
Response: 303 See /agenda

GET /agenda
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

GET /agenda/{id}
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

PATCH /agenda
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

PATCH /agenda/{id}
Cookie: JWT=xxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
// Hier mag alles aangepast worden
```json
{
	"title": "programma0",
	"subtitle": "programma0.0",
	"artist": "artiest",
	"description1": "Lorem ipsum...",
	"description2": "Lorem ipsum...",
	"description3": "Lorem ipsum...",
	"thumbnail": "image.png",
	"events": [
	{
		"datetime": "xxxxxxx",
		"location": "Gent",
		"prices": [
			{ "price for": "minderjarigen", "price": "€10" },
			{ "price for": "18+", "price": "€15" }
		]
	},
	...
	]
	"extra_media": [
		"image2.png",
		"video.mp4"
	]
	"tags": ["tag1", "tag2"]
}
```
Response: 200 OK
```json
{ "status": "ok" }
```
