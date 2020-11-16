CREATE TABLE notes (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  folderId INTEGER REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
  modified TIMESTAMPTZ NOT NULL DEFAULT now()
);