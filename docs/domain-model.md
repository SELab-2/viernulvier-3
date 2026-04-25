# Domeinmodel (ERD)

![ER diagram](assets/er_diagram.png)

<details>
<summary>Click to see DBML</summary>

```
Table productions {
    id int [pk] // production unique ID
    viernulvier_id int [unique]

    performer_type varchar // e.g., "group", "individual"
    attendance_mode varchar // e.g., "offline", "online", "hybrid"

    created_at timestamp
    updated_at timestamp

    earliest_at timestamp
    latest_at timestamp
}

Table prod_info {
  production_id int [ref: > productions.id]
  language varchar [pk]

  title varchar
  supertitle varchar
  artist varchar
  tagline varchar
  teaser varchar
  description varchar
  info varchar
}

Table tags {
  id int [pk]
  viernulvier_id int [unique]
}

Table tag_names {
  tag_id int [ref: > tags.id]
  language varchar [pk]
  name varchar
}

Table prod_tags {
  tag_id int [ref: - tags.id]
  prod_id int [ref: - productions.id]
}

Table events {
    id int [pk]                     // event ID from "@id"
    viernulvier_id int [unique]

    production_id int [ref: > productions.id]
    hall_id int [ref: > halls.id]

    starts_at timestamp
    ends_at timestamp

    order_url varchar

    created_at timestamp
    updated_at timestamp
}

Table event_prices {
    id int [pk]
    viernulvier_id int [unique]

    event_id int [ref: > events.id]

    amount decimal
    available int
    expires_at timestamp

    created_at timestamp
    updated_at timestamp
}

Table halls {
  id int [pk]
  address varchar
  name varchar

}

Table media {
  id int [pk]
  production_id int [ref: > productions.id]
  blog_id int [ref: > blogs.id]
  object_key varchar
  content_type varchar
  uploaded_at datetime
}

Table prod_blogs {
  prod_id int [ref: - productions.id]
  blog_id int [ref: - blogs.id]
}

Table blogs {
  id int [pk]
  title varchar
  content varchar
  author int [ref: > users.id]
}

Table users {
  id int [pk]
  username varchar
  hashed_password varchar
  token_version integer
  super_user bool
  created_at datetime
  last_login_at datetime
}

Table user_roles {
  user_id int [ref: - users.id]
  role_id int [ref: - roles.id]
}

Table roles {
  id int [pk]
  name varchar
}

Table role_permissions {
  role_id int [ref: - roles.id]
  permission_id int [ref: - permissions.id]
}

Table permissions {
  id int [pk]
  name varchar
}
```
</details>
