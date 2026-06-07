-- Full-text search materialized view across blog posts + projects
-- Manually authored — Drizzle does not manage materialized views.

CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS
SELECT
  'post'::text                                                AS type,
  bp.id                                                       AS id,
  bp.slug                                                     AS slug,
  bp.title->>'en'                                             AS title_en,
  bp.title->>'id'                                             AS title_id,
  bp.excerpt->>'en'                                           AS excerpt_en,
  bp.excerpt->>'id'                                           AS excerpt_id,
  bp.content->>'en'                                           AS content_en,
  bp.content->>'id'                                           AS content_id,
  bp.cover_image                                              AS cover_image,
  bp.published_at                                             AS sort_at,
  to_tsvector(
    'english',
    coalesce(bp.title->>'en','') || ' ' ||
    coalesce(bp.excerpt->>'en','') || ' ' ||
    coalesce(bp.content->>'en','')
  )                                                           AS tsv_en,
  to_tsvector(
    'simple',
    coalesce(bp.title->>'id','') || ' ' ||
    coalesce(bp.excerpt->>'id','') || ' ' ||
    coalesce(bp.content->>'id','')
  )                                                           AS tsv_id
FROM blog_posts bp
WHERE bp.published = true

UNION ALL

SELECT
  'project'::text                                             AS type,
  p.id                                                        AS id,
  p.slug                                                      AS slug,
  p.title                                                     AS title_en,
  p.title                                                     AS title_id,
  p.description->>'en'                                        AS excerpt_en,
  p.description->>'id'                                        AS excerpt_id,
  coalesce(pc.content->>'en', p.description->>'en')           AS content_en,
  coalesce(pc.content->>'id', p.description->>'id')           AS content_id,
  p.image                                                     AS cover_image,
  p.updated_at                                                AS sort_at,
  to_tsvector(
    'english',
    coalesce(p.title,'') || ' ' ||
    coalesce(p.description->>'en','') || ' ' ||
    coalesce(pc.content->>'en','')
  )                                                           AS tsv_en,
  to_tsvector(
    'simple',
    coalesce(p.title,'') || ' ' ||
    coalesce(p.description->>'id','') || ' ' ||
    coalesce(pc.content->>'id','')
  )                                                           AS tsv_id
FROM projects p
LEFT JOIN project_case_studies pc ON pc.project_id = p.id;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_search_tsv_en ON search_index USING gin(tsv_en);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_search_tsv_id ON search_index USING gin(tsv_id);
--> statement-breakpoint
-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_unique ON search_index(type, id);
