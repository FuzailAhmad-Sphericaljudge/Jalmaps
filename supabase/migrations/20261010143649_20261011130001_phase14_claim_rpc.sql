CREATE OR REPLACE FUNCTION claim_notification_outbox(batch_size INT)
RETURNS SETOF notification_outbox
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE notification_outbox
  SET status = 'sending'::notification_status
  WHERE id IN (
    SELECT id
    FROM notification_outbox
    WHERE status = 'pending'::notification_status
       OR (status = 'failed'::notification_status AND attempts < 3 AND next_attempt_at <= now())
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING *;
END;
$$;

