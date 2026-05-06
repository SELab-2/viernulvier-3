from typing import List
from src.models.blogs import Blog
from src.services.blogs import (
    get_blog_by_id,
    get_blogs_paginated,
    create_blog,
    update_blog_by_id,
    delete_blog_by_id,
)
from src.services.production import get_productions_paginated
from src.schemas.blogs import (
    BlogCreate,
    BlogContentCreate,
    BlogUpdate,
    BlogContentUpdate,
)
from src.services.language import Languages

from src.api.exceptions import ValidationError

import pytest

BASE_URL = "http://test"


# Limited amount of blogs: only one page.
def test_get_blogs_paginated_limited(db_session, blogs_limited: List[Blog]):
    result = get_blogs_paginated(db_session, BASE_URL)
    assert len(result.blogs) == 2

    # Build lookup by id
    result_by_id = {b.id_url: b for b in result.blogs}
    for expected in blogs_limited:
        blog_url = f"{BASE_URL}/blogs/{expected.id}"
        blog = result_by_id[blog_url]
        assert blog.id_url == blog_url
        assert len(blog.blog_contents) == len(expected.contents)


# More blogs than limit: multiple pages.
def test_get_blogs_paginated(db_session, many_blogs):
    # Keep a set of seen ids to keep track of duplicates
    seen_ids = set()

    result = get_blogs_paginated(db_session, BASE_URL, limit=5)
    assert len(result.blogs) == 5
    assert result.pagination.has_more
    assert result.pagination.next_cursor is not None

    # Check if each returned blog is valid without relying on order
    for blog in result.blogs:
        blog_id = int(blog.id_url.split("/")[-1])

        # Ensure no duplicates
        assert blog_id not in seen_ids
        seen_ids.add(blog_id)

        # Check if blog comes from our dataset
        assert any(blog_id == expected_blog.id for expected_blog in many_blogs)

        assert len(blog.blog_contents) == 2

    next_cursor = result.pagination.next_cursor
    result = get_blogs_paginated(db_session, BASE_URL, cursor=next_cursor, limit=5)

    assert len(result.blogs) == 5
    for blog in result.blogs:
        blog_id = int(blog.id_url.split("/")[-1])
        assert blog_id not in seen_ids
        seen_ids.add(blog_id)
        assert any(blog_id == expected_blog.id for expected_blog in many_blogs)
        assert len(blog.blog_contents) == 2

    assert not result.pagination.has_more
    assert result.pagination.next_cursor is None


# Get blog by id (no/invalid language specified): check if correct blog is returned with all correct content and events.
# Invalid language results in all content, could be changed if desired.
def test_get_blog_by_id_no_language(db_session, blogs_limited):
    blog_response = get_blog_by_id(db_session, blogs_limited[1].id, BASE_URL)
    assert blog_response.id_url == f"{BASE_URL}/blogs/{blogs_limited[1].id}"
    assert len(blog_response.blog_contents) == 2


# Get blog by id for a specific (valid) language.
def test_get_blog_by_id_valid_language(db_session, blogs_limited):
    blog_response = get_blog_by_id(
        db_session, blogs_limited[1].id, BASE_URL, language=Languages.ENGLISH
    )
    assert blog_response.id_url == f"{BASE_URL}/blogs/{blogs_limited[1].id}"
    assert len(blog_response.blog_contents) == 1
    assert blog_response.blog_contents[0].language == Languages.ENGLISH


# Create a valid new blog and check if it is added to database.
def test_create_blog_valid_content(db_session, blogs_limited):
    result = get_blogs_paginated(db_session, BASE_URL)
    assert len(result.blogs) == 2
    new_blog = BlogCreate(
        blog_content=BlogContentCreate(
            language=Languages.NEDERLANDS,
            title="nieuwe blog",
            content="Dit is mijn nieuwe blog",
        ),
        production_id_urls=[],
    )

    _ = create_blog(db_session, new_blog, BASE_URL)
    result2 = get_blogs_paginated(db_session, BASE_URL)
    assert len(result2.blogs) == 3


# Create an invalid blog, results in NotFoundError.
def test_create_blog_invalid_content(db_session, blogs_limited):
    new_blog = BlogCreate(
        blog_content=BlogContentCreate(language="es", title="el blog", content=""),
    )
    with pytest.raises(ValidationError, match="Language 'es' not supported"):
        _ = create_blog(db_session, new_blog, BASE_URL)


# Create a blog with a series of existing productions.
def test_create_blog_with_tags_valid(db_session, blogs_limited):
    result = get_blogs_paginated(db_session, BASE_URL)
    assert len(result.blogs) == 2

    valid_productions = get_productions_paginated(
        db_session, BASE_URL, limit=5
    ).productions
    new_blog = BlogCreate(
        blog_content=BlogContentCreate(
            language=Languages.NEDERLANDS, title="nieuwe blog", content=""
        ),
        production_id_urls=[prod.id_url for prod in valid_productions],
    )

    response = create_blog(db_session, new_blog, BASE_URL)
    result2 = get_blogs_paginated(db_session, BASE_URL)
    assert len(result2.blogs) == 3

    new_id = int(response.id_url.rstrip("/").split("/")[-1])
    new_blog_from_db = get_blog_by_id(db_session, new_id, BASE_URL)
    assert set(new_blog_from_db.production_id_urls) == {
        prod.id_url for prod in valid_productions
    }


# Update an existing blog - basic field.
def test_update_blog_basic(db_session, blogs_limited):
    blog_response = get_blog_by_id(db_session, blogs_limited[0].id, BASE_URL)
    assert blog_response.blog_contents[0].title == "title1"
    assert blog_response.blog_contents[0].content == "content1"
    blog_update = BlogUpdate(
        blog_contents=[
            BlogContentUpdate(
                language=Languages.ENGLISH, title="title 1", content="content"
            )
        ]
    )
    result = update_blog_by_id(db_session, blog_update, blogs_limited[0].id, BASE_URL)
    assert result.blog_contents[0].title == "title 1"
    assert result.blog_contents[0].content == "content"


# Update productions of a blog
def test_update_blog_prods(db_session, blogs_limited):
    blog_response = get_blog_by_id(db_session, blogs_limited[0].id, BASE_URL)
    assert blog_response.production_id_urls == [f"{BASE_URL}/productions/1"]
    new_urls = [f"{BASE_URL}/productions/1", f"{BASE_URL}/productions/2"]

    blog_update1 = BlogUpdate(production_id_urls=new_urls)

    # Correct responses are returned.
    result = update_blog_by_id(db_session, blog_update1, blogs_limited[0].id, BASE_URL)

    assert result.production_id_urls == [
        f"{BASE_URL}/productions/1",
        f"{BASE_URL}/productions/2",
    ]

    # Updated in database.
    blog_response = get_blog_by_id(db_session, blogs_limited[0].id, BASE_URL)
    assert blog_response.production_id_urls == [
        f"{BASE_URL}/productions/1",
        f"{BASE_URL}/productions/2",
    ]


# Update an existing blog - delete existing blog content.
def test_update_blog_content_delete(db_session, blogs_limited):
    blog_response = get_blog_by_id(db_session, blogs_limited[1].id, BASE_URL)
    assert len(blog_response.blog_contents) == 2

    # New content should be deleted.
    update = BlogUpdate(remove_languages=[Languages.ENGLISH])

    # Check updated in response.
    update_response = update_blog_by_id(
        db_session, update, blogs_limited[1].id, BASE_URL
    )
    assert len(update_response.blog_contents) == 1

    # Check updated in database
    blog_response = get_blog_by_id(db_session, blogs_limited[1].id, BASE_URL)
    assert len(blog_response.blog_contents) == 1


# Delete a existing blog.
def test_delete_blog(db_session, blogs_limited):
    result = get_blogs_paginated(db_session, BASE_URL)
    assert len(result.blogs) == 2

    success = delete_blog_by_id(db_session, blogs_limited[0].id)
    assert success

    result = get_blogs_paginated(db_session, BASE_URL)
    assert len(result.blogs) == 1
    assert result.blogs[0].blog_contents[0].title == "title2"
