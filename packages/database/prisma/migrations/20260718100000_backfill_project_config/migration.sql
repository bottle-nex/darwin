INSERT INTO "ProjectConfig" ("id", "projectId")
SELECT gen_random_uuid()::text, p."id"
FROM "Project" p
LEFT JOIN "ProjectConfig" c ON c."projectId" = p."id"
WHERE c."id" IS NULL;
