-- Listar Triggers en auth.users
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';
