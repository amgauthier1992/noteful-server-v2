WITH notesData AS (
	SELECT 'Dogs' AS name, 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui' AS content, 'Important' AS folderName UNION
	SELECT 'Cats', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super' UNION
	SELECT 'Pigs', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Spangley' UNION
    SELECT 'Birds', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Important' UNION
    SELECT 'Bears', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super' UNION
    SELECT 'Horses', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Spangley' UNION
    SELECT 'Tigers', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super' UNION
    SELECT 'Wolves', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Important' UNION
    SELECT 'Elephants', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super' UNION
    SELECT 'Lions', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Important' UNION
    SELECT 'Monkeys', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Spangley' UNION
    SELECT 'Bats', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super' UNION
    SELECT 'Turtles', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Spangley' UNION
    SELECT 'Zebras', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui', 'Super'
)

INSERT INTO notes (name, content, folderId) --where am i going to put it and in what format? column a, b, c from notes
SELECT n.name, n.content, f.id -- i have this data, where am i gonna put it?
FROM folders f
INNER JOIN
	notesData n ON 
	f.name = n.folderName