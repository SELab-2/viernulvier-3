from database import SessionLocal, Language

with SessionLocal() as session:
    existing = session.query(Language).filter(Language.id.in_([1, 2])).all()
    existing_ids = {lang.id for lang in existing}

    to_add = []
    for id, name in [(1, "nl"), (2, "en")]:
        if id in existing_ids:
            print(f"Language '{name}' already exists, skipping.")
        else:
            to_add.append(Language(id=id, language=name))
            print(f"Adding language '{name}'.")

    if to_add:
        session.add_all(to_add)
        session.commit()

    print("\nAll languages in database:")
    for lang in session.query(Language).all():
        print(f"  {lang.id}: {lang.language}")